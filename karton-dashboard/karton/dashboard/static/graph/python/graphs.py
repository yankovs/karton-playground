from __future__ import annotations
from dataclasses import dataclass
from networkx.readwrite import json_graph
from karton.core.inspect import KartonState
import logging, json
import networkx as nx

logger = logging.getLogger("graphs")
excluded = ['karton.classifier']

@dataclass
class karton_node:
    identity: str
    filters: list[dict[str, str]] = None
    outputs: list[dict[str, str]] = None

    def filter_contained(self, filter: dict[str, str], output: dict[str, str]):
        return all(item in output.items() for item in filter.items())

    def __contains__(self, other: karton_node):
        if self.filters and other.outputs:
            for filter in self.filters:
                if any(self.filter_contained(filter, json.loads(output)) for output in other.outputs):
                    return True
        return False


class graph:
    def __init__(self, state: KartonState) -> None:
        self.state = state
        self.nodes: list[karton_node] = []
        self.edges: dict[str, set[str]] = {}
    
    def build_nodes(self):
        values = {}

        for bind in self.state.backend.get_binds():
            if bind.identity not in values:
                values[bind.identity] = {}
            values[bind.identity]['filters'] = bind.filters

        for producer in self.state.backend.redis.keys("karton.outputs:*"):
            identity = producer.split(":")[1]
            if identity not in values:
                values[identity] = {}

            outputs = self.state.backend.redis.smembers(producer)
            values[identity]['outputs'] = outputs

        for iden in values.keys():
            node = None
            keys = values[iden].keys()
            if 'filters' in keys and 'outputs' in keys:
                node = karton_node(iden, values[iden]['filters'], values[iden]['outputs'])
            elif 'filters' in keys:
                node = karton_node(iden, values[iden]['filters'], None)
            else:
                node = karton_node(iden, None, values[iden]['outputs'])
            
            self.nodes.append(node)    

    def create_edges(self):
        for node in self.nodes:
            self.edges[node.identity] = set()

        for node in self.nodes:
            for other in self.nodes:
                if node.__contains__(other):
                    self.edges[other.identity].add(node.identity)
        
        logger.info(self.nodes)
        logger.info(self.edges)

    def generate_graph(self):
        G = nx.DiGraph(self.edges)
        data = json_graph.adjacency_data(G)
        H = json_graph.adjacency_graph(data)
        nx.write_gexf(H, 'karton/dashboard/static/graph/graph.gexf')
