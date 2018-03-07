/**
 * Created by zouwei on 2015/8/31.
 * 地面填图配置
 */
var plotStyles_surface = [
    {
        field:"区站号",      //字段名
        type:"label",	    //显示类型（label-文本、symbol-符号）
        visible:"true",
        offsetX: 0,	        //X偏移量
        offsetY: -50,	    //Y偏移量
        rotationField:null,	//旋转角度字段
        decimal:null,          //小数位数，如果为null，不做处理（特别是字符类型字段一定要为null）
        valueScale:null,           //值缩放，显示的值=原始值*valueScale
        noDataValue:9999.0, //无效值
        style: {		    //风格
            labelAlign:"lt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"露点",
        type:"label",
        visible:"true",
        offsetX: -10,
        offsetY: -10,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"rt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"海平面气压",
        type:"label",
        visible:"true",
        offsetX: 10,
        offsetY: 20,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"lb",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 255)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"温度",
        type:"label",
        visible:"true",
        offsetX: -10,
        offsetY: 20,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"rb",
            fontFamily:"Arial",
            fontColor:"rgb(255, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"现在天气",
        type:"symbol",
        visible:"true",
        offsetX: 0,
        offsetY: 0,
        rotationField:null,
        decimal:null,
        noDataValue:9999.0,
        style: {
            graphicWidth:12,
            graphicHeight:12,
            graphicXOffset:0,
            graphicYOffset:0,
            graphicOpacity:1.0,
            fillOpacity:1.0,
            fontFamily:"Arial",
            fontColor:"rgb(255, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:
            [
                {
                    value: 4,
                    image: "./imgs/current/current4.png"
                },
                {
                    value: 5,
                    image: "./imgs/current/current5.png"
                },
                {
                    value: 6,
                    image: "./imgs/current/current6.png"
                },
                {
                    value: 7,
                    image: "./imgs/current/current7.png"
                },
                {
                    value: 8,
                    image: "./imgs/current/current8.png"
                },
                {
                    value: 9,
                    image: "./imgs/current/current9.png"
                },
                {
                    value: 10,
                    image: "./imgs/current/current10.png"
                },
                {
                    value: 11,
                    image: "./imgs/current/current11.png"
                },
                {
                    value: 12,
                    image: "./imgs/current/current12.png"
                },
                {
                    value: 13,
                    image: "./imgs/current/current13.png"
                },
                {
                    value: 14,
                    image: "./imgs/current/current14.png"
                },
                {
                    value: 15,
                    image: "./imgs/current/current15.png"
                },
                {
                    value: 16,
                    image: "./imgs/current/current16.png"
                },
                {
                    value: 17,
                    image: "./imgs/current/current17.png"
                },
                {
                    value: 18,
                    image: "./imgs/current/current18.png"
                },
                {
                    value: 19,
                    image: "./imgs/current/current19.png"
                },
                {
                    value: 20,
                    image: "./imgs/current/current20.png"
                },
                {
                    value: 21,
                    image: "./imgs/current/current21.png"
                },
                {
                    value: 22,
                    image: "./imgs/current/current22.png"
                },
                {
                    value: 23,
                    image: "./imgs/current/current23.png"
                },
                {
                    value: 24,
                    image: "./imgs/current/current24.png"
                },
                {
                    value: 25,
                    image: "./imgs/current/current25.png"
                },
                {
                    value: 26,
                    image: "./imgs/current/current26.png"
                },
                {
                    value: 27,
                    image: "./imgs/current/current27.png"
                },
                {
                    value: 28,
                    image: "./imgs/current/current29.png"
                },
                {
                    value: 29,
                    image: "./imgs/current/current29.png"
                },
                {
                    value: 30,
                    image: "./imgs/current/current30.png"
                },
                {
                    value: 31,
                    image: "./imgs/current/current31.png"
                },
                {
                    value: 32,
                    image: "./imgs/current/current32.png"
                },
                {
                    value: 33,
                    image: "./imgs/current/current33.png"
                },
                {
                    value: 34,
                    image: "./imgs/current/current34.png"
                },
                {
                    value: 35,
                    image: "./imgs/current/current35.png"
                },
                {
                    value: 36,
                    image: "./imgs/current/current36.png"
                },
                {
                    value: 37,
                    image: "./imgs/current/current37.png"
                },
                {
                    value: 38,
                    image: "./imgs/current/current38.png"
                },
                {
                    value: 39,
                    image: "./imgs/current/current39.png"
                },
                {
                    value: 40,
                    image: "./imgs/current/current40.png"
                },
                {
                    value: 41,
                    image: "./imgs/current/current41.png"
                },
                {
                    value: 42,
                    image: "./imgs/current/current42.png"
                },
                {
                    value: 43,
                    image: "./imgs/current/current43.png"
                },
                {
                    value: 44,
                    image: "./imgs/current/current44.png"
                },
                {
                    value: 45,
                    image: "./imgs/current/current45.png"
                },
                {
                    value: 46,
                    image: "./imgs/current/current46.png"
                },
                {
                    value: 47,
                    image: "./imgs/current/current47.png"
                },
                {
                    value: 48,
                    image: "./imgs/current/current48.png"
                },
                {
                    value: 49,
                    image: "./imgs/current/current49.png"
                },
                {
                    value: 50,
                    image: "./imgs/current/current50.png"
                },
                {
                    value: 51,
                    image: "./imgs/current/current51.png"
                },
                {
                    value: 52,
                    image: "./imgs/current/current52.png"
                },
                {
                    value: 53,
                    image: "./imgs/current/current53.png"
                },
                {
                    value: 54,
                    image: "./imgs/current/current54.png"
                },
                {
                    value: 55,
                    image: "./imgs/current/current55.png"
                },
                {
                    value: 56,
                    image: "./imgs/current/current56.png"
                },
                {
                    value: 57,
                    image: "./imgs/current/current57.png"
                },
                {
                    value: 58,
                    image: "./imgs/current/current58.png"
                },
                {
                    value: 59,
                    image: "./imgs/current/current59.png"
                },
                {
                    value: 60,
                    image: "./imgs/current/current60.png"
                },
                {
                    value: 61,
                    image: "./imgs/current/current61.png"
                },
                {
                    value: 62,
                    image: "./imgs/current/current62.png"
                },
                {
                    value: 63,
                    image: "./imgs/current/current63.png"
                },
                {
                    value: 64,
                    image: "./imgs/current/current64.png"
                },
                {
                    value: 65,
                    image: "./imgs/current/current65.png"
                },
                {
                    value: 66,
                    image: "./imgs/current/current66.png"
                },
                {
                    value: 67,
                    image: "./imgs/current/current67.png"
                },
                {
                    value: 68,
                    image: "./imgs/current/current68.png"
                },
                {
                    value: 69,
                    image: "./imgs/current/current69.png"
                },
                {
                    value: 70,
                    image: "./imgs/current/current70.png"
                },
                {
                    value: 71,
                    image: "./imgs/current/current71.png"
                },
                {
                    value: 72,
                    image: "./imgs/current/current72.png"
                },
                {
                    value: 73,
                    image: "./imgs/current/current73.png"
                },
                {
                    value: 74,
                    image: "./imgs/current/current74.png"
                },
                {
                    value: 75,
                    image: "./imgs/current/current75.png"
                },
                {
                    value: 76,
                    image: "./imgs/current/current76.png"
                },
                {
                    value: 77,
                    image: "./imgs/current/current78.png"
                },
                {
                    value: 79,
                    image: "./imgs/current/current79.png"
                },
                {
                    value: 80,
                    image: "./imgs/current/current80.png"
                },
                {
                    value: 81,
                    image: "./imgs/current/current81.png"
                },
                {
                    value: 82,
                    image: "./imgs/current/current82.png"
                },
                {
                    value: 83,
                    image: "./imgs/current/current83.png"
                },
                {
                    value: 84,
                    image: "./imgs/current/current84.png"
                },
                {
                    value: 85,
                    image: "./imgs/current/current85.png"
                },
                {
                    value: 86,
                    image: "./imgs/current/current86.png"
                },
                {
                    value: 87,
                    image: "./imgs/current/current87.png"
                },
                {
                    value: 88,
                    image: "./imgs/current/current88.png"
                },
                {
                    value: 89,
                    image: "./imgs/current/current89.png"
                },
                {
                    value: 90,
                    image: "./imgs/current/current90.png"
                },
                {
                    value: 91,
                    image: "./imgs/current/current91.png"
                },
                {
                    value: 92,
                    image: "./imgs/current/current92.png"
                },
                {
                    value: 93,
                    image: "./imgs/current/current93.png"
                },
                {
                    value: 94,
                    image: "./imgs/current/current94.png"
                },
                {
                    value: 95,
                    image: "./imgs/current/current95.png"
                },
                {
                    value: 96,
                    image: "./imgs/current/current96.png"
                },
                {
                    value: 97,
                    image: "./imgs/current/current97.png"
                },
                {
                    value: 98,
                    image: "./imgs/current/current98.png"
                },
                {
                    value: 99,
                    image: "./imgs/current/current99.png"
                }
        ]
    },
    {
        field: "总云量",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: -6,
            graphicYOffset: -6,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 0,
                image: "./imgs/cloud/allCloud0.png"
            },
            {
                value: 1,
                image: "./imgs/cloud/allCloud1.png"
            },
            {
                value: 2,
                image: "./imgs/cloud/allCloud2.png"
            },
            {
                value: 3,
                image: "./imgs/cloud/allCloud3.png"
            },
            {
                value: 4,
                image: "./imgs/cloud/allCloud4.png"
            },
            {
                value: 5,
                image: "./imgs/cloud/allCloud5.png"
            },
            {
                value: 6,
                image: "./imgs/cloud/allCloud6.png"
            },
            {
                value: 7,
                image: "./imgs/cloud/allCloud7.png"
            },
            {
                value: 8,
                image: "./imgs/cloud/allCloud8.png"
            },
            {
                value: 9,
                image: "./imgs/cloud/allCloud9.png"
            }
        ]
    },
    {
        field:"风速",
        type:"symbol",
        visible:"true",
        offsetX: 0,
        offsetY: 0,
        rotationField:"风向",
        decimal:null,
        noDataValue:9999.0,
        style: {
            graphicWidth:12,
            graphicHeight:24,
            graphicXOffset:-6,
            graphicYOffset:-24,
            graphicOpacity:1.0,
            fillOpacity:1.0,
            fontFamily:"Arial",
            fontColor:"rgb(255, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:
            [
                {
                    value: 0,
                    image: "./imgs/wind/wind1.png"
                },
                {
                    value: 1,
                    image: "./imgs/wind/wind2.png"
                },
                {
                    value: 2,
                    image: "./imgs/wind/wind2.png"
                },
                {
                    value: 3,
                    image: "./imgs/wind/wind3.png"
                },
                {
                    value: 4,
                    image: "./imgs/wind/wind3.png"
                },
                {
                    value: 5,
                    image: "./imgs/wind/wind4.png"
                },
                {
                    value: 6,
                    image: "./imgs/wind/wind4.png"
                },
                {
                    value: 7,
                    image: "./imgs/wind/wind5.png"
                },
                {
                    value: 8,
                    image: "./imgs/wind/wind5.png"
                },
                {
                    value: 9,
                    image: "./imgs/wind/wind6.png"
                },
                {
                    value: 10,
                    image: "./imgs/wind/wind6.png"
                },
                {
                    value: 11,
                    image: "./imgs/wind/wind7.png"
                },
                {
                    value: 12,
                    image: "./imgs/wind/wind7.png"
                },
                {
                    value: 13,
                    image: "./imgs/wind/wind8.png"
                },
                {
                    value: 14,
                    image: "./imgs/wind/wind8.png"
                },
                {
                    value: 15,
                    image: "./imgs/wind/wind9.png"
                },
                {
                    value: 16,
                    image: "./imgs/wind/wind9.png"
                },
                {
                    value: 17,
                    image: "./imgs/wind/wind10.png"
                },
                {
                    value: 18,
                    image: "./imgs/wind/wind10.png"
                },
                {
                    value: 19,
                    image: "./imgs/wind/wind11.png"
                },
                {
                    value: 20,
                    image: "./imgs/wind/wind11.png"
                },
                {
                    value: 21,
                    image: "./imgs/wind/wind12.png"
                },
                {
                    value: 22,
                    image: "./imgs/wind/wind12.png"
                },
                {
                    value: 23,
                    image: "./imgs/wind/wind13.png"
                },
                {
                    value: 24,
                    image: "./imgs/wind/wind13.png"
                },
                {
                    value: 25,
                    image: "./imgs/wind/wind14.png"
                },
                {
                    value: 26,
                    image: "./imgs/wind/wind14.png"
                }
            ]
    },
    {
        field:"六小时降水",
        type:"label",
        visible:"true",
        offsetX: 40,
        offsetY: -30,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"lt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 255)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"三小时变压",
        type:"label",
        visible:"true",
        offsetX: 10,
        offsetY: 0,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"lm",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"低云高",
        type:"label",
        visible:"true",
        offsetX: 0,
        offsetY: -30,
        rotationField:null,
        decimal:null,
        valueScale:0.01,
        noDataValue:9999.0,
        style: {
            labelAlign:"lt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 0)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field: "低云状",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: -6,
            graphicYOffset: 10,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 31,
                image: "./imgs/cloud/low_cloud31.png"
            },
            {
                value: 32,
                image: "./imgs/cloud/low_cloud32.png"
            },
            {
                value: 33,
                image: "./imgs/cloud/low_cloud33.png"
            },
            {
                value: 34,
                image: "./imgs/cloud/low_cloud34.png"
            },
            {
                value: 35,
                image: "./imgs/cloud/low_cloud35.png"
            },
            {
                value: 36,
                image: "./imgs/cloud/low_cloud36.png"
            },
            {
                value: 37,
                image: "./imgs/cloud/low_cloud37.png"
            },
            {
                value: 38,
                image: "./imgs/cloud/low_cloud38.png"
            },
            {
                value: 39,
                image: "./imgs/cloud/low_cloud39.png"
            }
        ]
    },
    {
        field: "中云状",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: -6,
            graphicYOffset: -32,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 21,
                image: "./imgs/cloud/mid_cloud21.png"
            },
            {
                value: 22,
                image: "./imgs/cloud/mid_cloud22.png"
            },
            {
                value: 23,
                image: "./imgs/cloud/mid_cloud23.png"
            },
            {
                value: 24,
                image: "./imgs/cloud/mid_cloud24.png"
            },
            {
                value: 25,
                image: "./imgs/cloud/mid_cloud25.png"
            },
            {
                value: 26,
                image: "./imgs/cloud/mid_cloud26.png"
            },
            {
                value: 27,
                image: "./imgs/cloud/mid_cloud27.png"
            },
            {
                value: 28,
                image: "./imgs/cloud/mid_cloud28.png"
            },
            {
                value: 29,
                image: "./imgs/cloud/mid_cloud29.png"
            }
        ]
    },
    {
        field: "高云状",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: -6,
            graphicYOffset: -56,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 11,
                image: "./imgs/cloud/high_cloud11.png"
            },
            {
                value: 12,
                image: "./imgs/cloud/high_cloud12.png"
            },
            {
                value: 13,
                image: "./imgs/cloud/high_cloud13.png"
            },
            {
                value: 14,
                image: "./imgs/cloud/high_cloud14.png"
            },
            {
                value: 15,
                image: "./imgs/cloud/high_cloud15.png"
            },
            {
                value: 16,
                image: "./imgs/cloud/high_cloud16.png"
            },
            {
                value: 17,
                image: "./imgs/cloud/high_cloud17.png"
            },
            {
                value: 18,
                image: "./imgs/cloud/high_cloud18.png"
            },
            {
                value: 19,
                image: "./imgs/cloud/high_cloud19.png"
            }
        ]
    },
    {
        field: "过去天气1",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: 50,
            graphicYOffset: 50,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 3,
                image: "./imgs/last/last3.png"
            },
            {
                value: 4,
                image: "./imgs/last/last4.png"
            },
            {
                value: 5,
                image: "./imgs/last/last5.png"
            },
            {
                value: 6,
                image: "./imgs/last/last6.png"
            },
            {
                value: 7,
                image: "./imgs/last/last7.png"
            },
            {
                value: 8,
                image: "./imgs/last/last8.png"
            },
            {
                value: 9,
                image: "./imgs/last/last9.png"
            }
        ]
    },
    {
        field: "过去天气2",
        type: "symbol",
        visible: "true",
        offsetX: 0,
        offsetY: 0,
        rotationField: null,
        decimal: null,
        noDataValue: 9999.0,
        style: {
            graphicWidth: 12,
            graphicHeight: 12,
            graphicXOffset: 80,
            graphicYOffset: 50,
            graphicOpacity: 1.0,
            fillOpacity: 1.0,
            fontFamily: "Arial",
            fontColor: "rgb(255, 0, 0)",
            fontSize: "14px",
            fill: false,
            stroke: false
        },
        symbols: [
            {
                value: 3,
                image: "./imgs/last/last3.png"
            },
            {
                value: 4,
                image: "./imgs/last/last4.png"
            },
            {
                value: 5,
                image: "./imgs/last/last5.png"
            },
            {
                value: 6,
                image: "./imgs/last/last6.png"
            },
            {
                value: 7,
                image: "./imgs/last/last7.png"
            },
            {
                value: 8,
                image: "./imgs/last/last8.png"
            },
            {
                value: 9,
                image: "./imgs/last/last9.png"
            }
        ]
    },
    {
        field:"能见度",
        type:"label",
        visible:"true",
        offsetX: -10,
        offsetY: -30,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"rt",
            fontFamily:"Arial",
            fontColor:"rgb(98, 56, 32)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"低云量",
        type:"label",
        visible:"true",
        offsetX: 20,
        offsetY: -30,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"rt",
            fontFamily:"Arial",
            fontColor:"rgb(111, 37, 150)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"二十四小时变温",
        type:"label",
        visible:"true",
        offsetX: 40,
        offsetY: 40,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"lt",
            fontFamily:"Arial",
            fontColor:"rgb(111, 37, 150)",
            fontSize:"12px",
            fill: false,
            stroke: false
        },
        symbols:null
    }
];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           