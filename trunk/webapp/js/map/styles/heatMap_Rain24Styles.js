/**
 * Created by allen_000 on 2015/7/15.
 * 气温填色风格
 * 开始值，结束值，开始颜色，结束颜色
 * 包含最大值，不包含最小值，也即左开右闭
 */
var heatMap_Rain24Styles = [
    { start: 0.0, end: 0.1, caption: "无雨", startColor: { red: 255, green: 255, blue: 255 }, endColor: { red: 152, green: 251, blue: 152 } },
    { start: 0.1, end: 10.0, caption: "小雨", startColor: { red: 165, green: 241, blue: 146 }, endColor: { red: 152, green: 251, blue: 152 } },
    { start: 10.0, end: 25.0, caption: "中雨", startColor: { red: 61, green: 182, blue: 66 }, endColor: { red: 34, green: 139, blue: 34 } },
    { start: 25.0, end: 50.0, caption: "大雨", startColor: { red: 100, green: 184, blue: 244 }, endColor: { red: 92, green: 172, blue: 238 } },
    { start: 50.0, end: 100.0, caption: "暴雨", startColor: { red: 2, green: 3, blue: 241 }, endColor: { red: 0, green: 0, blue: 205 } },
    { start: 100.0, end: 250.0, caption: "大暴雨", startColor: { red: 253, green: 0, blue: 251 }, endColor: { red: 238, green: 0, blue: 238 } },
    { start: 250.0, end: 500.0, caption: "特大暴雨", startColor: { red: 132, green: 0, blue: 66 }, endColor: { red: 139, green: 0, blue: 0 } }
];
