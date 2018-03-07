/* COPYRIGHT 2012 SUPERMAP
 * 本程序只能在有效的授权许可下使用。
 * 未经许可，不得以任何手段擅自使用或传播。*/

/**
 * @requires SuperMap/Renderer/AnimatorCanvas.js
 */

/**
 * Class: SuperMap.Renderer.StreamLine
 * 在 AnimatorCanvas 的基础上重写线渲染方式，实现了流线效果
 * 可以用于模拟大气、洋流等流体动画
 * 
 * Inherits from:
 *  - <SuperMap.Renderer.AnimatorCanvas>
 */
SuperMap.Renderer.StreamLine = SuperMap.Class(SuperMap.Renderer.AnimatorCanvas, {

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

        var animationCount = Math.round(points.length / 25) + 1;    // 同一条流线上的动画数
        for (var t = 0; t < animationCount; t++)
        {
            var maxNodeCount = 15; //（流线动画）最大节点数
            var maxNodeCountTemp = maxNodeCount;
            var nodeIndex = (this.frameCount + Math.round(points.length / animationCount * t)) % (points.length +
                maxNodeCount);
            if(nodeIndex >= points.length)
            {
                maxNodeCountTemp -= nodeIndex - points.length;
                nodeIndex = points.length - 1;
            }

            context.beginPath();
            var ptStart = this.getLocalXY(points[nodeIndex]);
            context.moveTo(ptStart[0], ptStart[1]);
            for (var j = nodeIndex - 1; j >= 0; j--) {
                var pt = this.getLocalXY(points[j]);
                context.lineWidth = 0.5;
                var grd = context.createLinearGradient(pt[0], pt[1], ptStart[0], ptStart[1]);
                grd.addColorStop(0, "rgba(255,255,255,0)");
                var c = "rgba(122,255,168," + Math.round(255*maxNodeCountTemp/maxNodeCount) + ")";
                //var c = "rgba(0, 0, 255," + Math.round(255*maxNodeCountTemp/maxNodeCount) + ")";
                grd.addColorStop(1, c);
                context.strokeStyle = grd;
                context.lineCap = "round";
                context.lineTo(pt[0], pt[1]);
                if (nodeIndex - j == maxNodeCountTemp)
                    break;
            }
            context.stroke();
        }
    },

    CLASS_NAME: "SuperMap.Renderer.StreamLine"
});

