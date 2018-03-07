/**
 * Class: WeatherMap.Renderer.Plot
 * 填图渲染。
 * by zouwei, 2015-08-27
 *
 * Inherits from:
 *  - <WeatherMap.Renderer.Canvas>
 */
WeatherMap.Renderer.Plot = WeatherMap.Class(WeatherMap.Renderer.Canvas, {

    styles:null,        //填图风格

    plotWidth : 120,    //填图像素宽度

    plotHeight : 120,   //填图像素高度

    listDrawnID: null, //已绘制对象ID

    listDrawnXY : null, //已绘制对象屏幕坐标

    /**
     * Method: redraw
     * The real 'meat' of the function: any time things have changed,
     *     redraw() can be called to loop over all the data and (you guessed
     *     it) redraw it.  Unlike Elements-based Renderers, we can't interact
     *     with things once they're drawn, to remove them, for example, so
     *     instead we have to just clear everything and draw from scratch.
     */
    redraw: function() {
        if (!this.locked) {
            var height = this.root.height;
            var width = this.root.width;
            this.canvas.clearRect(0, 0, width, height);
            if (this.hitDetection) {
                this.hitContext.clearRect(0, 0, width, height);
            }
            var labelMap = [];
            var feature, style;

            this.listDrawnID = [];
            this.listDrawnXY = [];
            var hasStationLevel = false;
            for (var id in this.features) {
                if (!this.features.hasOwnProperty(id)) {
                    continue;
                }
                feature = this.features[id][0];
                hasStationLevel = feature.attributes.hasOwnProperty("站点级别");
                break;
            }
            if(this.features != null && hasStationLevel) //如果有站点级别字段，仅适用于Micaps数据显示
            {
                for(var i=0; i <= 5; i++) //级别写死了
                {
                    var level = Math.pow(2, i);
                    for (var id in this.features) {
                        if (!this.features.hasOwnProperty(id)) { continue; }
                        feature = this.features[id][0];
                        if(feature.attributes["站点级别"] == level) {
                            var bCross = false;
                            var xyTemp = this.getLocalXY(feature.geometry.getCentroid());
                            for(var j=0; j<this.listDrawnXY.length; j++)
                            {
                                if(Math.abs(this.listDrawnXY[j][0] - xyTemp[0]) < this.plotWidth/2 && Math.abs(this.listDrawnXY[j][1] - xyTemp[1])<this.plotHeight/2)
                                {
                                    bCross = true;
                                    break;
                                }
                            }
                            if(bCross) //如果重叠，仅画一个点
                            {
//                                var p0 = xyTemp[0];
//                                var p1 = xyTemp[1];
//                                var twoPi = Math.PI * 2;
//                                var radius = 2;//style.pointRadius;
//
//                                var styleCircle = {
//                                    strokeOpacity:1.0,
//                                    strokeColor:"#ff6432",
//                                    strokeWidth:0.5,
//                                    fillColor:"#00ff00",
//                                    fillOpacity:0.5
//                                };
//                                this.setCanvasStyle("fill", styleCircle);
//                                this.canvas.beginPath();
//                                this.canvas.arc(p0, p1, radius, 0, twoPi, true);
//                                this.canvas.fill();
//                                if (this.hitDetection) {
//                                    this.setHitContextStyle("fill", feature.id, styleCircle);
//                                    this.hitContext.beginPath();
//                                    this.hitContext.arc(p0, p1, radius, 0, twoPi, true);
//                                    this.hitContext.fill();
//                                }
//                                this.setCanvasStyle("stroke", styleCircle);
//                                this.canvas.beginPath();
//                                this.canvas.arc(p0, p1, radius, 0, twoPi, true);
//                                this.canvas.stroke();
//                                if (this.hitDetection) {
//                                    this.setHitContextStyle("stroke", feature.id, styleCircle);
//                                    this.hitContext.beginPath();
//                                    this.hitContext.arc(p0, p1, radius, 0, twoPi, true);
//                                    this.hitContext.stroke();
//                                }
//                                this.setCanvasStyle("reset");
                                continue;
                            }

                            style = this.features[id][1];
                            this.drawGeometry(feature.geometry, style, feature.id);
                            this.listDrawnXY.push(this.getLocalXY(feature.geometry.getCentroid())); //记录对象屏幕位置
                            this.listDrawnID.push(feature.id);
                        }
                    }
                }
            }
            else
            {
                for (var id in this.features) {
                    if (!this.features.hasOwnProperty(id)) { continue; }
                    feature = this.features[id][0];
                    style = this.features[id][1];
                    //console.log("redraw,id:"+id+",style:"+style.externalGraphic);
                    var bCross = false;
                    var xyTemp = this.getLocalXY(feature.geometry.getCentroid());
                    for(var xy in this.listDrawnXY)
                    {
                        if(Math.abs(this.listDrawnXY[j][0] - xyTemp[0]) < this.plotWidth/2 && Math.abs(this.listDrawnXY[j][1] - xyTemp[1])<this.plotHeight/2)
                        {
                            bCross = true;
                            break;
                        }
                    }
                    if(bCross)
                    {
                        continue;
                    }

                    this.drawGeometry(feature.geometry, style, feature.id);
                    this.listDrawnXY.push(this.getLocalXY(feature.geometry.getCentroid())); //记录对象屏幕位置
                    this.listDrawnID.push(feature.id);
                    if(style.label) {
                        labelMap.push([feature, style]);
                    }
                }
            }

            var item;
            for (var i=0, len=labelMap.length; i<len; ++i) {
                item = labelMap[i];
                //如果获取标签位置失败，不绘制该标签。
                var location = item[0].geometry.getCentroid();
                if(location == null)
                {
                    continue;
                }
                this.drawText(location, item[1]);
            }
        }
    },

    /**
     * 重写点的绘制，这里实现填图效果
     * */
    drawPoint: function(geometry, style, featureId){
        var location = geometry.getCentroid();
        if(this.styles == null || this.styles.length == 0) {
            if (style.graphic !== false) {
                if (style.externalGraphic) {
                    this.drawExternalGraphic(geometry, style, featureId);
                } else {
                    var pt = this.getLocalXY(geometry);
                    var p0 = pt[0];
                    var p1 = pt[1];
                    if (!isNaN(p0) && !isNaN(p1)) {
                        var twoPi = Math.PI * 2;
                        var radius = style.pointRadius;
                        if (style.fill !== false) {
                            this.setCanvasStyle("fill", style);
                            this.canvas.beginPath();
                            this.canvas.arc(p0, p1, radius, 0, twoPi, true);
                            this.canvas.fill();
                            if (this.hitDetection) {
                                this.setHitContextStyle("fill", featureId, style);
                                this.hitContext.beginPath();
                                this.hitContext.arc(p0, p1, radius, 0, twoPi, true);
                                this.hitContext.fill();
                            }
                        }

                        if (style.stroke !== false) {
                            this.setCanvasStyle("stroke", style);
                            this.canvas.beginPath();
                            this.canvas.arc(p0, p1, radius, 0, twoPi, true);
                            this.canvas.stroke();
                            if (this.hitDetection) {
                                this.setHitContextStyle("stroke", featureId, style);
                                this.hitContext.beginPath();
                                this.hitContext.arc(p0, p1, radius, 0, twoPi, true);
                                this.hitContext.stroke();
                            }
                            this.setCanvasStyle("reset");
                        }
                    }
                }
            }
        }
        else
        {
            for(var i=0; i<this.styles.length; i++)
            {
                var stylePlot = this.styles[i];
                if(stylePlot.visible){
                    var feature = this.features[featureId][0];

                    function clone(myObj){
                        if(typeof(myObj) != 'object') return myObj;
                        if(myObj == null) return myObj;
                        var myNewObj = new Object();
                        for(var i in myObj)
                            myNewObj[i] = clone(myObj[i]);
                        return myNewObj;
                    }
                    //克隆一个Style
                    var styleTemp = clone(stylePlot.style);

                    if(feature.attributes.hasOwnProperty(stylePlot.field)){
                        if(stylePlot.type == "label"){
                            if(feature.attributes[stylePlot.field] == stylePlot.noDataValue)
                                continue;
                            styleTemp.externalGraphic = null;
                            styleTemp.labelXOffset = stylePlot.offsetX;
                            styleTemp.labelYOffset = stylePlot.offsetY;
                            var v = feature.attributes[stylePlot.field];
                            if(stylePlot.valueScale != null)
                            {
                                v*=stylePlot.valueScale;
                                v = v.toString();
                            }
                            if(stylePlot.decimal != null)
                            {
                                v = Math.floor(v * Math.pow(10,stylePlot.decimal)) / Math.pow(10,stylePlot.decimal);
                                v = v.toString();
                            }
                            styleTemp.label = v;
                            this.drawText(location, styleTemp);
                        }
                        else if(stylePlot.type == "symbol"){
                            styleTemp.label = null;
                            var v = feature.attributes[stylePlot.field];
                            if(stylePlot.symbols != null && stylePlot.symbols.length > 0){
                                for(var j=0; j<stylePlot.symbols.length; j++){
                                    if(stylePlot.symbols[j].value == v){
                                        styleTemp.externalGraphic =stylePlot.symbols[j].image;
                                        break;
                                    }
                                }
                            }
                            if(stylePlot.rotationField != null)
                                styleTemp.rotation = feature.attributes[stylePlot.rotationField];
                            this.drawExternalGraphic(geometry, styleTemp, featureId);
                        }
                    }
                }
            }
        }
    },

    /**
     * Method: drawExternalGraphic
     * Called to draw External graphics.
     *
     * Parameters:
     * geometry - {<WeatherMap.Geometry>}
     * style    - {Object}
     * featureId - {String}
     */
    drawExternalGraphic: function(geometry, style, featureId) {
        var t = this;
//        if(this.londingimgs[featureId]){
//            this.londingimgs[featureId].onload = function(){return false;}
//        }

        var img = new Image();
        this.londingimgs[featureId] = img;

        if (style.graphicTitle) {
            img.title = style.graphicTitle;
        }

        var onLoad = function() {
            var featureId = this.featureId;
            var geometry = this.geometry;
            var style = this.style;
            var img = this.img;

            t.londingimgs[featureId] = null;

            if(!t.features[featureId]) {
                return;
            }
            var width = style.graphicWidth || style.graphicHeight;
            var height = style.graphicHeight || style.graphicWidth;
            width = width ? width : style.pointRadius * 2;
            height = height ? height : style.pointRadius * 2;
            var xOffset = (style.graphicXOffset != undefined) ?
                style.graphicXOffset : -(0.5 * width);
            var yOffset = (style.graphicYOffset != undefined) ?
                style.graphicYOffset : -(0.5 * height);

            var opacity = style.graphicOpacity || style.fillOpacity;

            var pt = t.getLocalXY(geometry);
            var p0 = pt[0];
            var p1 = pt[1];
            if(!isNaN(p0) && !isNaN(p1)) {
                var canvas = t.canvas;
                //Canvas添加旋转图片的功能
                canvas.save();
                var rotation;
                if(style.rotation){
                    rotation = style.rotation/180*Math.PI;
                }
                canvas.translate(p0,p1);
                if(rotation) {
                    canvas.rotate(rotation);
                }
                canvas.translate(xOffset,yOffset);
                canvas.globalAlpha = opacity;
                var factor = WeatherMap.Renderer.Canvas.drawImageScaleFactor ||
                    (WeatherMap.Renderer.Canvas.drawImageScaleFactor =
                        /android 2.1/.test(navigator.userAgent.toLowerCase()) ?
                            // 320 is the screen width of the G1 phone, for
                            // which drawImage works out of the box.
                            320 / window.screen.width : 1
                        );
                canvas.drawImage(
                    img, 0, 0, width*factor, height*factor
                );
                canvas.restore();
                if (t.hitDetection) {
                    t.setHitContextStyle("fill", featureId);
                    t.hitContext.save();
                    t.hitContext.translate(p0,p1);
                    if(rotation) {
                        t.hitContext.rotate(rotation);
                    }
                    t.hitContext.translate(xOffset,yOffset);
                    t.hitContext.fillRect(0, 0, width, height);
                    t.hitContext.restore();
                }

            }
        };

        img.onload = WeatherMap.Function.bind(onLoad, {
            featureId:featureId,
            geometry:geometry,
            style:style,
            img:img
        });
        img.src = style.externalGraphic;
    },

    CLASS_NAME: "WeatherMap.Renderer.Plot"
});
