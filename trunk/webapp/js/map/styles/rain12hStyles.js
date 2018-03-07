/**
 * Created by allen_000 on 2015/7/15.
 * 12小时降水填色风格
 * 最小值，最大值，样式
 * 同时包含最大值和最小值，也即左开右闭
 */
    var rain12hStyles = [
    [0,0.1,{
        stroke: false,
        fill: false
}],
    [0.1,5.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(166,242,143)",
    fillOpacity: "0.5"
}],
    [5.0,15.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(61,186,61)",
    fillOpacity: "0.5"
}],
    [15.0,30.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(97,184,255)",
    fillOpacity: "0.5"
}],
    [30.0,70.0, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(0,0,255)",
    fillOpacity: "0.5"
}],
    [70.0,140.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(255,0,255)",
    fillOpacity: "0.5"
}],
    [140.0, 1000, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(128,0,64)",
    fillOpacity: "0.5"
}]];