/**
 * Created by zouwei on 2015/8/28.
 * 高空填图配置
 */
var plotStyles_hight = [
    {
        field:"区站号",      //字段名
        type:"label",	    //显示类型（label-文本、symbol-符号）
        visible:"true",
        offsetX: 10,	        //X偏移量
        offsetY: -20,	    //Y偏移量
        rotationField:null,	//旋转角度字段
        decimal:null,          //小数位数，如果为null，不做处理（特别是字符类型字段一定要为null）
        noDataValue:9999.0, //无效值
        style: {		    //风格
            labelAlign:"lt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 0, 0)",
            fontSize:"14px",
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
            fontSize:"14px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"温度露点差",
        type:"label",
        visible:"true",
        offsetX: -10,
        offsetY: -20,
        rotationField:null,
        decimal:1,
        noDataValue:9999.0,
        style: {
            labelAlign:"rt",
            fontFamily:"Arial",
            fontColor:"rgb(0, 255, 0)",
            fontSize:"14px",
            fill: false,
            stroke: false
        },
        symbols:null
    },
    {
        field:"高度",
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
            fontSize:"14px",
            fill: false,
            stroke: false
        },
        symbols:null
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
            fontSize:"14px",
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
    }
];