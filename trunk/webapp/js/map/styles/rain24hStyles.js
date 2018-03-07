/**
 * Created by allen_000 on 2015/7/15.
 * 24小时降水填色风格
 * 最小值，最大值，样式
 * 同时包含最大值和最小值，也即左开右闭
 */
    var rain24hStyles = [
    [0,0.1,{
        stroke: false,
        fill: false
}],
    [0.1,10.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#A6F38D",
    fillOpacity: "1"
}],
    [10.0,25.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#38A700",
    fillOpacity: "1"
}],
    [25.0,50.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#61B8FF",
    fillOpacity: "1"
}],
    [50.0,100.0, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#0000FE",
    fillOpacity: "1"
}],
    [100.0,250.0,{
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#FA00FA",
    fillOpacity: "1"
}],
    [250.0, 1000, {
    strokeColor: "#ff0000",
    strokeWidth: 0.5,
    fillColor: "#720000",
    fillOpacity: "1"
}]];