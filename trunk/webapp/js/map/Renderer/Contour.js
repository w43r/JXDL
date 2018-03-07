/*
* 等值线渲染
* 特性：沿线、等距、断开
* 注意：renderPath方法中性能有待优化，貌似占用内存较多
* by zouwei, 2015-09-06
* */
WeatherMap.Renderer.Contour = WeatherMap.Class(WeatherMap.Renderer.Canvas, {

    labelField:null,    //标签字段

    labelVisible:true,  //标签是否显示

    labelInterval:500,  //标签间距像素值

    drawLinearRing: function(geometry, style, featureId) {
        //绘制边缘线
        if (style.stroke !== false) {
            this.setCanvasStyle("stroke", style);
            this.renderPath(this.canvas, geometry, style, featureId, "stroke");
//            if (this.hitDetection) {
//                this.setHitContextStyle("stroke", featureId, style);
//                this.renderPath(this.hitContext, geometry, style, featureId, "stroke");
//            }
        }
        this.setCanvasStyle("reset");
    },

    renderPath: function(context, geometry, style, featureId, type) {
        var components = geometry.components;
        var len = components.length;
        context.beginPath();
        var start = this.getLocalXY(components[0]);
        var x = start[0];
        var y = start[1];
        var ptLast = start;
        var length = 0;
        var ptLabels = [];
        var drawnCount = 0;

        //度量标签宽度
        var feature = this.features[featureId][0];
        style.label = feature.attributes[this.labelField];
        var fontStyle = [style.fontStyle ? style.fontStyle : "normal",
            "normal", // "font-variant" not supported
            style.fontWeight ? style.fontWeight : "normal",
            style.fontSize ? style.fontSize : "1em",
            style.fontFamily ? style.fontFamily : "sans-serif"].join(" ");
        this.canvas.font = fontStyle;
        var labelWidth = this.canvas.measureText(style.label).width;
        var margin = 5;

        if (!isNaN(x) && !isNaN(y)) {
            context.moveTo(start[0], start[1]);
            for (var i=1; i<len; ++i) {
                var pt = this.getLocalXY(components[i]);
                //context.lineTo(pt[0], pt[1]);
                //记录标签位置
                if(this.labelVisible){
                    var deltaLength = Math.sqrt(Math.pow(Math.abs(pt[0] - ptLast[0]), 2) + Math.pow(Math.abs(pt[1] - ptLast[1]), 2));
                    length+=deltaLength;
                    if(length >= (drawnCount+1)*this.labelInterval){
                        var count = Math.floor(deltaLength/this.labelInterval) + 1;
                        var startLength = length-deltaLength;
                        for(var j=0; j <count; j++){
                            {
                                var l = (drawnCount + j +1)*this.labelInterval - startLength;
                                var a =Math.atan2(pt[1]-ptLast[1], pt[0]-ptLast[0]);
                                var ptLabel = [ptLast[0]+Math.cos(a)*l, ptLast[1]+Math.sin(a)*l];
                                if(ptLabel[0] < 0 || ptLabel[0] > this.size.w || ptLabel[1]<0 || ptLabel[1]>this.size.h)
                                    continue;
                                ptLabels.push([ptLabel, a/Math.PI*180]);

                                var lStart = l - (labelWidth / 2 + margin);
                                var ptBreakStart = [ptLast[0]+Math.cos(a)*lStart, ptLast[1]+Math.sin(a)*lStart]; //断开起点位置
                                var lEnd = l + (labelWidth / 2 + margin);
                                var ptBreakEnd = [ptLast[0]+Math.cos(a)*lEnd, ptLast[1]+Math.sin(a)*lEnd]; //断开终点位置
                                if(lStart>0)
                                    context.lineTo(ptBreakStart[0], ptBreakStart[1]);
                                context.stroke();
                                if((startLength + lEnd) <= length)
                                {
                                    context.moveTo(ptBreakEnd[0], ptBreakEnd[1]);
                                    context.lineTo(pt[0], pt[1]);
                                }
                                else
                                {
                                    //context.moveTo(pt[0], pt[1]);
                                    if(i == len - 1)
                                        context.moveTo(pt[0], pt[1]);
                                    else {
                                        //寻找断口结束位置
                                        var k=i+1;
                                        var ptNext = null;
                                        for(k; k<len; k++)
                                        {
                                            var ptNext = this.getLocalXY(components[k]);
                                            deltaLength = Math.sqrt(Math.pow(Math.abs(ptNext[0] - pt[0]), 2) + Math.pow(Math.abs(ptNext[1] - pt[1]), 2));
                                            length+=deltaLength;
                                            if((startLength + lEnd) <= length)
                                            {
                                                var l = deltaLength - (length - (startLength + lEnd));
                                                if (l > 0) {
                                                    var a = Math.atan2(ptNext[1] - pt[1], ptNext[0] - pt[0]);
                                                    ptBreakEnd = [pt[0] + Math.cos(a) * l, pt[1] + Math.sin(a) * l];
                                                    context.moveTo(ptBreakEnd[0], ptBreakEnd[1]);
                                                }
                                            }
                                            pt = ptNext;
                                            if((startLength + lEnd) <= length)
                                                break;
                                        }
                                        i=k;
                                    }
                                }
                            }
                        }
                        drawnCount+=count;
                    }
                    else{
                        if(((drawnCount+1)*this.labelInterval - length) > (labelWidth / 2 + margin))
                        {
                            context.lineTo(pt[0], pt[1]);
                        }
                        else
                        {
                            //寻找断口开始位置
                            var l = deltaLength - ((labelWidth / 2 + margin) - ((drawnCount+1)*this.labelInterval - length));
                            if(l > 0) {
                                var a = Math.atan2(pt[1] - ptLast[1], pt[0] - ptLast[0]);
                                var ptBreakStart = [ptLast[0] + Math.cos(a) * l, ptLast[1] + Math.sin(a) * l];
                                context.lineTo(ptBreakStart[0], ptBreakStart[1]);
                            }
                        }
                    }
                    ptLast = pt;
                }
                else
                    context.lineTo(pt[0], pt[1]);
            }
            if (type === "fill") {
                context.fill();
            } else {
                context.stroke();
            }

            //如果没有找到就在中点显示吧，当然太短了不显示标注
            if(ptLabels.length == 0 && length > 50)
            {
                var i = Math.floor(components.length/2);
                var pt1 = this.getLocalXY(components[i-1]);
                var pt2 = this.getLocalXY(components[i]);
                var l = Math.sqrt(Math.pow(Math.abs(pt2[0] - pt1[0]), 2) + Math.pow(Math.abs(pt2[1] - pt1[1]), 2));
                var a =Math.atan2(pt2[1]-pt1[1], pt2[0]-pt1[0]);
                ptLabels.push([pt2, a/Math.PI*180]);
            }
        }

        //绘制标签
        if(this.labelVisible && ptLabels.length > 0){
            for(var i=0; i<ptLabels.length; i++){
                var pt = ptLabels[i][0];
                style.labelRotation = Math.abs(ptLabels[i][1]) > 90 ? 180+ptLabels[i][1]: ptLabels[i][1];
                this.drawText2(pt, style);
            }
        }
        style.label = null; //这里要置为空，否则Vector图层本身要去再绘制它
    },

    /*
    * 根据设备坐标绘制文本
    * */
    drawText2: function(location, style) {
        style = WeatherMap.Util.extend({
            fontColor: "#000000",
            labelAlign: "cm"
        }, style);
        var pt = location;

        if (style.labelXOffset  || style.labelYOffset ) {
            var xOffset = isNaN(style.labelXOffset) ? 0 : style.labelXOffset;
            var yOffset = isNaN(style.labelYOffset) ? 0 : style.labelYOffset;
            pt[0] += xOffset;
            pt[1] -= yOffset;
        }

        this.setCanvasStyle("reset");
        this.canvas.fillStyle = style.fontColor;
        this.canvas.globalAlpha = style.fontOpacity || 1.0;
        var fontStyle = [style.fontStyle ? style.fontStyle : "normal",
            "normal", // "font-variant" not supported
            style.fontWeight ? style.fontWeight : "normal",
            style.fontSize ? style.fontSize : "1em",
            style.fontFamily ? style.fontFamily : "sans-serif"].join(" ");
        var labelRows = style.label.split('\n');
        var numRows = labelRows.length;
        if (this.canvas.fillText) {
            // HTML5
            this.canvas.font = fontStyle;
            this.canvas.textAlign =
                WeatherMap.Renderer.Canvas.LABEL_ALIGN[style.labelAlign[0]] ||
                "center";
            this.canvas.textBaseline =
                WeatherMap.Renderer.Canvas.LABEL_ALIGN[style.labelAlign[1]] ||
                "middle";
            var vfactor =
                WeatherMap.Renderer.Canvas.LABEL_FACTOR[style.labelAlign[1]];
            if (vfactor == null) {
                vfactor = -.5;
            }
            var lineHeight =
                this.canvas.measureText('Mg').height ||
                this.canvas.measureText('xx').width;
            pt[1] += lineHeight*vfactor*(numRows-1);
            for (var i = 0; i < numRows; i++) {
                if(style.labelRotation != 0)
                {
                    this.canvas.save();
                    this.canvas.translate(pt[0], pt[1]);
                    this.canvas.rotate(style.labelRotation*Math.PI/180);
                    this.canvas.fillText(labelRows[i], 0,  (lineHeight*i));
                    this.canvas.restore();
                }else{
                    this.canvas.fillText(labelRows[i], pt[0], pt[1] + (lineHeight*i));
                }
            }
        } else if (this.canvas.mozDrawText) {
            // Mozilla pre-Gecko1.9.1 (<FF3.1)
            this.canvas.mozTextStyle = fontStyle;
            // No built-in text alignment, so we measure and adjust the position
            var hfactor =
                WeatherMap.Renderer.Canvas.LABEL_FACTOR[style.labelAlign[0]];
            if (hfactor == null) {
                hfactor = -.5;
            }
            var vfactor =
                WeatherMap.Renderer.Canvas.LABEL_FACTOR[style.labelAlign[1]];
            if (vfactor == null) {
                vfactor = -.5;
            }
            var lineHeight = this.canvas.mozMeasureText('xx');
            pt[1] += lineHeight*(1 + (vfactor*numRows));
            for (var i = 0; i < numRows; i++) {
                var x = pt[0] + (hfactor*this.canvas.mozMeasureText(labelRows[i]));
                var y = pt[1] + (i*lineHeight);
                this.canvas.translate(x, y);
                this.canvas.mozDrawText(labelRows[i]);
                this.canvas.translate(-x, -y);
            }
        }
        this.setCanvasStyle("reset");
    },

    /*
    * 判断直线（线段）与矩形是否相交
    * */
    getIsLineCrossRect:function(pt1, pt2, left, top, w, h){
        var result = this.getIsLineCrossLine(pt1, pt2, [left, top], [left, top + h]);
        if(!result)
            result = this.getIsLineCrossLine(pt1, pt2, [left, top +h], [left + w, top + h]);
        if(!result)
            result = this.getIsLineCrossLine(pt1, pt2, [left + w, top + h], [left + w, top]);
        if(!result)
            result = this.getIsLineCrossLine(pt1, pt2, [left + w, top], [left, top]);
        return result;
    },

    /*
    * 判断两条直线（线段）是否相交
    * 算法来源：http://www.cnblogs.com/i-gps/archive/2012/06/19/2554992.html
    * */
    getIsLineCrossLine:function(a, b, c, d){

        //线段ab的法线N1
        var nx1 = (b[1] - a[1]), ny1 = (a[0] - b[0]);

        //线段cd的法线N2
        var nx2 = (d[1] - c[1]), ny2 = (c[0] - d[0]);

        //两条法线做叉乘, 如果结果为0, 说明线段ab和线段cd平行或共线,不相交
        var denominator = nx1*ny2 - ny1*nx2;
        if (denominator==0) {
            return false;
        }

        //在法线N2上的投影
        var distC_N2=nx2 * c[0] + ny2 * c[1];
        var distA_N2=nx2 * a[0] + ny2 * a[1]-distC_N2;
        var distB_N2=nx2 * b[0] + ny2 * b[1]-distC_N2;

        // 点a投影和点b投影在点c投影同侧 (对点在线段上的情况,本例当作不相交处理);
        if ( distA_N2*distB_N2>=0  ) {
            return false;
        }

        //
        //判断点c点d 和线段ab的关系, 原理同上
        //
        //在法线N1上的投影
        var distA_N1=nx1 * a[0] + ny1 * a[1];
        var distC_N1=nx1 * c[0] + ny1 * c[1]-distA_N1;
        var distD_N1=nx1 * d[0] + ny1 * d[1]-distA_N1;
        if ( distC_N1*distD_N1>=0  ) {
            return false;
        }

        return true;
    },

CLASS_NAME: "WeatherMap.Renderer.Contour"
});
