
var dom = document.getElementById("container");
var myChart = echarts.init(dom, 'purple-passion');
var app = {};
var allNodes;
var isLabelsHidden = false;


const arrayToObject = (array) =>
    array.reduce((obj, item) => {
        obj[item.id] = item
        return obj
    }, {});


option = null;
myChart.showLoading();
$.get('../static/graph/graph.gexf', function (xml) {
    myChart.hideLoading();

    var graph = echarts.dataTool.gexf.parse(xml);
    var categories = [];
    allNodes = arrayToObject(graph.nodes);

    graph.nodes.forEach(function (node) {
        node.symbolSize = 40;
    });
    option = {


        title: {
            // text: 'Russian APT Ecosystem',
            //subtext: 'Default layout',
            top: 'bottom',
            left: 'right'
        },
        feature: {
            magicType: {
                type: ['line', 'bar', 'stack', 'tiled']
            }
        },
        tooltip: {
            formatter: function (params) {
                if (params.dataType == "node") {
                    var colorSpan = '<span style="display:inline-block;margin-left:5px;border-radius:10px;width:9px;height:9px;background-color:' + 'blue' + '"></span>';
                    // is node
                    res = "<b>Karton:</b>: " + params.data.id + colorSpan;
                } else if (params.dataType == "edge") {
                    // is edge
                    res = allNodes[params.data.source].name + " > " + allNodes[params.data.target].name;
                }
                return res;
            }
        },
        legend: [{
            // selectedMode: 'single',
            data: categories.map(function (a) {
                return a.name;
            })
        }],
        animation: true,
        animationDuration: 1500,
        scaleLimit: {},
        animationEasingUpdate: 'quinticInOut',
        dataZoom: [{
                type: 'inside',

            },
            {
                type: 'inside',
            }
        ],
        xAxis: {
            show: false,
            scale: true,
            silent: true,
            type: 'value'
        },
        yAxis: {
            show: false,
            scale: true,
            silent: true,
            type: 'value'
        },

        series: [{
            name: 'Russian APT Ecosystem',
            type: 'graph',
            layout: 'force',
            force: {
                initLayout: 'circular',
                edgeLength: 1200,
                repulsion: 100000,
                gravity: 0.4
            },
            zoom: 0.15,
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            data: graph.nodes,
            links: graph.links,
            categories: categories,
            roam: true,
            focusNodeAdjacency: true,
            draggable: true,
            itemStyle: {
                normal: {
                    borderColor: '#fff',
                    borderWidth: 1,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
            },
            label: {
                position: 'outside',
                show: true,
                //padding: 5,
                //borderRadius: 5,
                //borderWidth: 1,
                //borderColor: 'rgba(255, 255, 255, 0.7)',
                //backgroundColor: 'rgba(255, 255, 255, 1)',
                formatter: '{b}'
            },
            lineStyle: {
                color: 'source',
                curveness: 0,
                width: 2
            },
            emphasis: {
                lineStyle: {
                    width: 8
                }
            }
        }]
    };

    myChart.setOption(option);
}, 'xml');;
if (option && typeof option === "object") {
    myChart.setOption(option, true);
}


myChart.on('dataZoom', function (params) {
    var start = params.batch[0].start;
    var end = params.batch[0].end;


    if (myChart.getOption().series[0].zoom <= 0.28 && myChart.getOption().series[0].zoom != 1 && !isLabelsHidden) {
        myChart.setOption({
            series: [{
                label: {
                    show: false
                },
                force: {
                    friction: 0.1
                }
            }]
        });
        isLabelsHidden = true;
    } else if (myChart.getOption().series[0].zoom > 0.28 && myChart.getOption().series[0].zoom != 1 && isLabelsHidden) {
        myChart.setOption({
            series: [{
                label: {
                    show: true
                },
                force: {
                    friction: 0.1
                }
            }]
        });
        isLabelsHidden = false;
    }
});

myChart.on('mousemove', params => {
    if (params.dataType === 'node') {
        myChart.getZr().setCursorStyle('pointer')
    } else {
        myChart.getZr().setCursorStyle('default')
    }
});