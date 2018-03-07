/**
 * Created by allen_000 on 2015/7/15.
 * 6小时降水填色风格
 * 最小值，最大值，样式
 * 同时包含最大值和最小值，也即左开右闭
 */
    var rain6hStyles = [
    [0,0.1,{
        stroke: false,
        fill: false
}],
    [0.1,4.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(166,242,143)",
    fillOpacity: "0.5"
}],
    [4.0,13.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(61,186,61)",
    fillOpacity: "0.5"
}],
    [13.0,25.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(97,184,255)",
    fillOpacity: "0.5"
}],
    [25.0,60.0, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(0,0,255)",
    fillOpacity: "0.5"
}],
    [60.0,120.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(255,0,255)",
    fillOpacity: "0.5"
}],
    [120.0, 1000, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "rgb(128,0,64)",
    fillOpacity: "0.5"
}]];