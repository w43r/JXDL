/* COPYRIGHT 2012 SUPERMAP
 * 本程序只能在有效的授权许可下使用。
 * 未经许可，不得以任何手段擅自使用或传播。*/

/**
 * @requires SuperMap/Renderer/AnimatorCanvas.js
 */

/**
 * Class: SuperMap.Renderer.NeonLine
 * 在 AnimatorCanvas 的基础上重写线渲染方式，实现了霓虹灯线条
 * 可以用于区域高亮提醒，魔术棒落区选择等
 * 
 * Inherits from:
 *  - <SuperMap.Renderer.AnimatorCanvas>
 */
SuperMap.Renderer.NeonLine = SuperMap.Class(SuperMap.Renderer.AnimatorCanvas, {

    frameCount:0, //动画计数（帧数）

    
    /**
     * Constructor: SuperMap.Renderer.StreamLine
     * 伸缩线渲染
     * （不允许用户初始化）
     *
     */
    initialize: function(containerID, options,layer) {
        SuperMap.Renderer.AnimatorCanvas.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: smoothConvertLine
     * 重写了父类的方法，对线进行了伸缩转换
     *
     *
     * Parameters:
     * geometry - {<SuperMap.Geometry>}   与当前时刻最接近的即将绘制的geometry
     * frontGeometry - {<SuperMap.Geometry>}  geometry 的前一个数据（同一实物）
     * backGeometry - {<SuperMap.Geometry>}  geometry 的后一个数据（同一实物）
     * featureId - {String} geometry 所对应的feature的id
     *
     * Returns:
     * {Array} 返回 [即将需要绘制的 geometry，geometry 的前一个数据，geometry 的后一个数据]
     */
    smoothConvertLine:function(geometry,frontGeometry,backGeometry,featureId){
        var options = this.features[featureId][2];
        if(options && options.smooth && options.smooth[0]) {
        }
        else
        {
            return [geometry,frontGeometry,backGeometry];
        }
    },

    unshiftPoint:function(points,arr,dis,smooth){
        var la = 0;
        for(var a = arr.length-1;a>0;a--)
        {
            var point_a_B = arr[a];
            var point_a_F = arr[a-1];
            var mod_a_B_F = point_a_B.distanceTo(point_a_F);
            var cm_a = dis*smooth-la;
            if(cm_a<=mod_a_B_F)
            {
                var xa =  point_a_B.x + (point_a_F.x-point_a_B.x)*cm_a/mod_a_B_F;
                var ya =  point_a_B.y + (point_a_F.y-point_a_B.y)*cm_a/mod_a_B_F;
                points.unshift(new SuperMap.Geometry.Point(xa,ya));
                break;
            }
            else
            {
                la+= mod_a_B_F;
                points.unshift(point_a_F.clone());
            }
        }
        return points;
    },
    pushPoint:function(points,arr,dis,smooth){
        var la = 0;
        for(var a = 0;a<arr.length-1;a++)
        {
            var point_a_B = arr[a+1];
            var point_a_F = arr[a];
            var mod_a_B_F = point_a_B.distanceTo(point_a_F);
            var cm_a = dis*smooth-la;
            if(cm_a<=mod_a_B_F)
            {
                var xa =  point_a_F.x + (point_a_B.x-point_a_F.x)*cm_a/mod_a_B_F;
                var ya =  point_a_F.y + (point_a_B.y-point_a_F.y)*cm_a/mod_a_B_F;
                points.push(new SuperMap.Geometry.Point(xa,ya));
                break;
            }
            else
            {
                la+= mod_a_B_F;
                points.push(point_a_B.clone());
            }
        }
        return points;
    },

    /**
     * Method: renderPath
     * Render a path with stroke and optional fill.
     */
    renderPath: function(context, geometry, style, featureId, type) {
        var points = geometry.components;
        var len = points.length;
        if(len <= 2)
            return;

        context.save();

        var ptPre = 0;
        for(var i = 1; i<points.length; i++){
            var delta = 5; //线段（像素）长度
            var ptStart = this.getLocalXY(points[ptPre]);
            var ptEnd = this.getLocalXY(points[i]);
            var deltaX = Math.abs(ptEnd[0] - ptStart[0]);
            var deltaY = Math.abs(ptEnd[1] - ptStart[1]);
            if(deltaX<=delta*2 &&  deltaY<=delta*2) //长度不足2个delta像素，继续找
            {
                if(ptPre == 0 && (i == points.length - 1)) //整个都不足5像素，模拟一个正方形区域将其括起来吧，边长为delta
                {
                    var ptCenter = this.getLocalXY({x:geometry.bounds.left + (geometry.bounds.right - geometry.bounds.left) / 2,
                        y:geometry.bounds.bottom + (geometry.bounds.top - geometry.bounds.bottom) / 2});

                    context.lineWidth = style.strokeWidth;
                    context.strokeStyle = this.frameCount%2==0 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                    context.beginPath();
                    context.moveTo(ptCenter[0] - delta/2, ptCenter[1] - delta/2);
                    context.lineTo(ptCenter[0] - delta/2, ptCenter[1] + delta/2);
                    context.stroke();

                    context.lineWidth = style.strokeWidth;
                    context.strokeStyle = this.frameCount%2==1 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                    context.beginPath();
                    context.moveTo(ptCenter[0] - delta/2, ptCenter[1] + delta/2);
                    context.lineTo(ptCenter[0] + delta/2, ptCenter[1] + delta/2);
                    context.stroke();

                    context.lineWidth = style.strokeWidth;
                    context.strokeStyle = this.frameCount%2==0 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                    context.beginPath();
                    context.moveTo(ptCenter[0] + delta/2, ptCenter[1] + delta/2);
                    context.lineTo(ptCenter[0] + delta/2, ptCenter[1] - delta/2);
                    context.stroke();

                    context.lineWidth = style.strokeWidth;
                    context.strokeStyle = this.frameCount%2==1 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                    context.beginPath();
                    context.moveTo(ptCenter[0] + delta/2, ptCenter[1] - delta/2);
                    context.lineTo(ptCenter[0] - delta/2, ptCenter[1] - delta/2);
                    context.stroke();
                }
            }
            else
            {
                ptPre = i;
                var hv = deltaY>deltaX ?1:0; //1表示竖向，0表示横向
                var v = ptStart[hv == 0?1:0]; //如果是0-横向，那么v为y坐标；如果是1-竖向，那么v为x坐标
                var length = ptEnd[hv] - ptStart[hv];
                delta = delta*Math.abs(length)/length;
                length = Math.abs(length);

                var offset = this.frameCount%length;
                var v0 = delta>0 ? ptStart[hv] + offset : ptStart[hv] - offset; //起点
                var j = 1;
                while(true)
                {
                    if(Math.abs(delta*j) > length)
                        break;
                    var vStart = v0 + delta*(j - 1);
                    var vEnd = v0 + delta*j;
                    if(delta > 0)
                    {
                        if(vStart<ptEnd[hv] && vEnd > ptEnd[hv]) //折返，需要画两条线
                        {
                            var vStartTemp = ptStart[hv];
                            var vEndTemp = ptStart[hv] + vEnd - ptEnd[hv];
                            context.beginPath();
                            context.moveTo(hv==0?vStartTemp:v, hv==0?v:vStartTemp);
                            context.strokeStyle = j%2==0 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                            context.lineWidth = style.strokeWidth;
                            context.lineTo(hv==0?vEndTemp:v, hv==0?v:vEndTemp);
                            context.stroke();

                            vEnd = ptEnd[hv];
                        }
                        else if(vStart>ptEnd[hv] && vEnd > ptEnd[hv])
                        {
                            vStart = ptStart[hv] + vStart - ptEnd[hv];
                            vEnd = ptStart[hv] + vEnd - ptEnd[hv];
                        }
                    }
                    else
                    {
                        if(vStart>ptEnd[hv] && vEnd < ptEnd[hv]) //折返，需要画两条线
                        {
                            var vStartTemp = ptStart[hv];
                            var vEndTemp = ptStart[hv] - (ptEnd[hv] - vEnd);
                            context.beginPath();
                            context.moveTo(hv==0?vStartTemp:v, hv==0?v:vStartTemp);
                            context.strokeStyle = j%2==0 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                            context.lineWidth = style.strokeWidth;
                            context.lineTo(hv==0?vEndTemp:v, hv==0?v:vEndTemp);
                            context.stroke();

                            vEnd = ptEnd[hv];
                        }
                        else if(vStart<ptEnd[hv] && vEnd < ptEnd[hv])
                        {
                            vStart = ptStart[hv] - (ptEnd[hv] - vStart);
                            vEnd = ptStart[hv] - (ptEnd[hv] - vEnd);
                        }
                    }
                    context.beginPath();
                    context.moveTo(hv==0?vStart:v, hv==0?v:vStart);
                    context.strokeStyle = j%2==0 ? style.strokeColor : "rgba(255, 255, 255, 255)";
                    context.lineWidth = style.strokeWidth;
                    context.lineTo(hv==0?vEnd:v, hv==0?v:vEnd);
                    context.stroke();
                    j++;
                }
            }
        }
    },

    CLASS_NAME: "SuperMap.Renderer.NeonLine"
});

