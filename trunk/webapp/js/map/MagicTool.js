/**
 * 魔术棒工具，落区选择
 */
function MagicTool(){

    this.arrayTag = [];

    this.geoline = null;

    this.map = null;

    this.init = function(map){
        var t = this;
        t.map = map;
        map.events.register("click", map, function (event) {
            if (GDYB.GridProductClass.layerMagic == null)
                return;
            if(GDYB.GridProductClass.drawFreePath.active)
                return;
            GDYB.GridProductClass.layerMagic.removeAllFeatures();
            if (GDYB.GridProductClass.action == GDYB.CorrectAction.none)
                return;
            if (GDYB.GridProductClass.action == GDYB.CorrectAction.modifyLuoqu)
                t.arrayTag = [];
            var ptPixel = event.xy;
            var lonlat = this.getLonLatFromPixel(ptPixel);
            t.pick(lonlat);
        });

        var ptMouseDown = null;
        map.events.register("mousedown", map, function (event) {
            if(GDYB.GridProductClass.drawFreePath.active)
                return;
            if (GDYB.GridProductClass.layerMagic != null && GDYB.GridProductClass.action == GDYB.CorrectAction.moveLuoqu)
                ptMouseDown = event.xy;
            if (GDYB.GridProductClass.layerMagic != null && GDYB.GridProductClass.action == GDYB.CorrectAction.none)
                GDYB.GridProductClass.layerMagic.removeAllFeatures();
        });

        //移动后订正格点
        map.events.register("mouseup", map, function (event) {
            if (GDYB.GridProductClass.action != GDYB.CorrectAction.moveLuoqu)
                return;
            if (GDYB.GridProductClass.layerMagic.features.length > 0 && t.arrayTag.length > 0) {
                var dtGrid = GDYB.GridProductClass.datasetGrid;
                var arrayTagOld = [];
                var gridOld = []; //原始值
                for (var i = 0; i < dtGrid.rows; i++) {
                    var arrayTagRow = [];
                    var gridRow = [];
                    for (var j = 0; j < dtGrid.cols; j++) {
                        arrayTagRow.push(t.arrayTag[i][j]);
                        gridRow.push(dtGrid.grid[i][j].z);
                    }
                    arrayTagOld.push(arrayTagRow);
                    gridOld.push(gridRow);
                }

                var dValueDefault = GDYB.GridProductClass.currentGridValueDown >= 0.1 ? GDYB.GridProductClass.currentGridValueDown - 0.1 : 0; //代替值
                var ptMouseUp = event.xy;
                var lonlatMouseDown = this.getLonLatFromPixel(ptMouseDown);
                var lonlatMouseUp = this.getLonLatFromPixel(ptMouseUp);
                var ptGridMouseDown = dtGrid.xyToGrid(lonlatMouseDown.lon, lonlatMouseDown.lat);
                var ptGridMouseUp = dtGrid.xyToGrid(lonlatMouseUp.lon, lonlatMouseUp.lat);
                var xOffset = ptGridMouseUp.x - ptGridMouseDown.x;
                var yOffset = ptGridMouseUp.y - ptGridMouseDown.y;
                for (var i = 0; i < dtGrid.rows; i++) {
                    for (var j = 0; j < dtGrid.cols; j++) {
                        if (arrayTagOld[i][j]) {
                            //var dValue = dtGrid.grid[i][j].z;
                            var dValue = gridOld[i][j];
                            //dtGrid.grid[i][j].z = dValueDefault;
                            var ii = i + yOffset;
                            var jj = j + xOffset;
                            if (ii < 0 || ii >= dtGrid.rows || jj < 0 || jj >= dtGrid.cols)
                                continue;
                            dtGrid.grid[ii][jj].z = dValue;
                            t.arrayTag[ii][jj] = false;
                        }
                    }
                }

                for (var i = 0; i < dtGrid.rows; i++) {
                    for (var j = 0; j < dtGrid.cols; j++) {
                        if (arrayTagOld[i][j]) {
                            //dtGrid.grid[i][j].z = dValueDefault;

                            //线性插值
                            var nIndexLeft = j;
                            var nIndexRight = -1;
                            for (var k = nIndexLeft; k < dtGrid.cols; k++) {
                                if (!arrayTagOld[i][k]) {
                                    nIndexRight = k - 1;
                                    break;
                                }
                            }
                            if (nIndexRight == -1) {
                                nIndexRight = dtGrid.cols - 1;
                            }

                            if (nIndexLeft == 0 || nIndexRight == dtGrid.cols - 1 ||
                                gridOld[i][nIndexLeft - 1] == dtGrid.noDataValue || gridOld[i][nIndexRight + 1] == dtGrid.noDataValue) //在边界上
                            {
                                dtGrid.grid[i][k].z = dValueDefault;
                                t.arrayTag[i][k] = false;
                            }
                            else { //在中间
                                for (var k = nIndexLeft; k <= nIndexRight; k++) {
                                    if (!t.arrayTag[i][k])
                                        continue;

                                    var nIndexTop = -1;
                                    var nIndexBottom = -1;
                                    for (var l = i; l >= 0; l--) {
                                        if (!arrayTagOld[l][k]) {
                                            nIndexTop = l + 1;
                                            break;
                                        }
                                    }
                                    if (nIndexTop == -1) {
                                        nIndexTop = 0;
                                    }
                                    for (var l = nIndexTop; l < dtGrid.rows; l++) {
                                        if (!arrayTagOld[l][k]) {
                                            nIndexBottom = l - 1;
                                            break;
                                        }
                                    }
                                    if (nIndexBottom == -1) {
                                        nIndexBottom = dtGrid.rows - 1;
                                    }

                                    if (nIndexTop == 0 || nIndexBottom == dtGrid.rows - 1 ||
                                        gridOld[nIndexTop - 1][j] == dtGrid.noDataValue || gridOld[nIndexBottom + 1][j] == dtGrid.noDataValue) //在边界上
                                    {
                                        dtGrid.grid[i][k].z = dValueDefault;
                                        continue;
                                    }

                                    var weightX = (k - (nIndexLeft - 1)) / (nIndexRight + 1 - (nIndexLeft - 1));
                                    var weightY = (i - (nIndexTop - 1)) / (nIndexBottom + 1 - (nIndexTop - 1));
                                    var dValueX = gridOld[i][nIndexLeft - 1] * (1 - weightX) + gridOld[i][nIndexRight + 1] * weightX;
                                    var dValueY = gridOld[nIndexTop - 1][k] * (1 - weightY) + gridOld[nIndexBottom + 1][k] * weightY;
                                    dtGrid.grid[i][k].z = Math.round((dValueX + dValueY) / 2.0 * 10.0) / 10.0;
                                    if (dtGrid.grid[i][k].z > 25.0)
                                        t.arrayTag[i][k] = false;
                                    t.arrayTag[i][k] = false;
                                }
                            }
                        }
                    }
                }
                GDYB.GridProductClass.layerFillRangeColor.refresh();
                GDYB.GridProductClass.addLabel(null, map, null);

                gridOld = [];
                t.arrayTag = [];
                arrayTagOld = [];
            }
        });
    };

    this.pick = function(lonlat){
        var t = this;
        var map = t.map;
        if (GDYB.GridProductClass.datasetGrid != null) {
            var dtGrid = GDYB.GridProductClass.datasetGrid;
            if(GDYB.GridProductClass.currentGridValueDown == Math.abs(dtGrid))
                return;
            //var t.arrayTag = [];
            var arrayTack = [];
            for (var i = 0; i < dtGrid.rows; i++) {
                var arrayTagRow = [];
                var arrayTackRow = [];
                for (var j = 0; j < dtGrid.cols; j++) {
                    arrayTagRow.push(false);
                    arrayTackRow.push(false);
                }
                t.arrayTag.push(arrayTagRow);
                arrayTack.push(arrayTackRow);
            }
            var ptGrid = dtGrid.xyToGrid(lonlat.lon, lonlat.lat);
            if (ptGrid == null) {
                startDragMap();
                return;
            }
            var ga = new SuperMap.GridAnalyst();
            //ga.track(dtGrid, ptGrid.x, ptGrid.y, GDYB.GridProductClass.currentGridValueDown, dtGrid.dMax, t.arrayTag, arrayTack); //订正后最大值变了，这个dMax没有更新
            //ga.track(dtGrid, ptGrid.x, ptGrid.y, GDYB.GridProductClass.currentGridValueDown, GDYB.GridProductClass.currentGridValueUp, t.arrayTag, arrayTack); //指定的上限，不好操作
            ga.track(dtGrid, ptGrid.x, ptGrid.y, GDYB.GridProductClass.currentGridValueDown, Math.abs(dtGrid.noDataValue), t.arrayTag, arrayTack);

            //构线
            t.geoline = ga.gridToLine(t.arrayTag, dtGrid.left, dtGrid.top, dtGrid.deltaX, dtGrid.deltaY);
            if (t.geoline != null) {
                if (GDYB.GridProductClass.action == GDYB.CorrectAction.modifyLuoqu) //如果拾取成功，开始画线
                {
                    GDYB.GridProductClass.drawFreePath.activate();
                }
                var style = {
                    strokeColor: "black",
                    strokeWidth: 1
                };
//                var lineVector = new SuperMap.Feature.Vector(t.geoline, null);
//                lineVector.style=style;
                var lineVector = new SuperMap.Feature.Vector(t.geoline, {
                    FEATUREID: 0,
                    TIME: 1
                }, style); //实例化Feature，参数：geometry，attributes，style

                GDYB.GridProductClass.layerMagic.addFeatures([lineVector]);
                GDYB.GridProductClass.layerMagic.renderer.frameCount = 0;
                GDYB.GridProductClass.layerMagic.setZIndex(999);
                GDYB.GridProductClass.layerMagic.animator.start();
                stopDragMap();
            }
            else {
                startDragMap();
            }

            //t.arrayTag = null;
            arrayTack = null;
        }

        function stopDragMap() {
            for (var i = 0; i < map.events.listeners.mousemove.length; i++) {
                var handler = map.events.listeners.mousemove[i];
                if (handler.obj.CLASS_NAME == "SuperMap.Handler.Drag") {
                    handler.obj.active = false;
                }
            }
        }

        function startDragMap() {
            for (var i = 0; i < map.events.listeners.mousemove.length; i++) {
                var handler = map.events.listeners.mousemove[i];
                if (handler.obj.CLASS_NAME == "SuperMap.Handler.Drag") {
                    handler.obj.active = true;
                }
            }
        }
    };

    //更新格点
    this.updateGrid = function(dvalue, method){
        var element = GDYB.GridProductClass.currentElement;
        var bMinIsZero = element == "10uv" || element == "r1" || element == "r3" || element == "r6" || element == "r12" || element == "24";
        if(method == 0 && dvalue<0 && bMinIsZero)
            return false;
        for(var i=0; i<this.arrayTag.length; i++){
            for(var j=0; j<this.arrayTag[0].length; j++){
                if(this.arrayTag[i][j]){
                    var targetValue = GDYB.GridProductClass.datasetGrid.grid[i][j].z;
                    if(method == 0) //统一赋值，value=x
                    {
                        targetValue = dvalue;
                    }
                    else if(method == 1) //统一加减值，value+=x
                    {
                        targetValue += dvalue;
                    }
                    else if(method == 2) //统一增量（百分比），value*=(1+x)
                    {
                        targetValue*=(1+dvalue);
                    }
                    if(bMinIsZero && targetValue < 0)
                        targetValue = 0.0;
                    targetValue = Math.floor(targetValue*10)/10;
                    if(bMinIsZero && targetValue < 0)
                        targetValue = 0;
                    GDYB.GridProductClass.datasetGrid.grid[i][j].z = targetValue;
                }
            }
        }
    };

    //更新风场（仅订正风向）
    this.updateGridWind = function(geoline){
        for(var i=0; i<this.arrayTag.length; i++){
            for(var j=0; j<this.arrayTag[0].length; j++){
                if(this.arrayTag[i][j]){
                //计算格点到直线的最小距离，及对应线段
                var x0 = GDYB.GridProductClass.datasetGrid.grid[i][j].x;
                var y0 = GDYB.GridProductClass.datasetGrid.grid[i][j].y;
                var ptMin1;
                var ptMin2;
                var dMin = GDYB.GridProductClass.datasetGrid.width;
                var lineString = geoline;
                for (var kk = 1; kk < lineString.components.length; kk++) {
                    var pt1 = lineString.components[kk - 1];
                    var pt2 = lineString.components[kk];
                    //代入直线方程两点式，得一般式（Ax0+By0+C=0）的A B C
                    var a = pt1.y - pt2.y;
                    var b = pt2.x - pt1.x;
                    var c = pt1.x*pt2.y - pt1.y*pt2.x;
                    //根据点到直线距离公式d=Math.abs(A*x+B*y+C)/Math.sqrt(A*A+B*B)，得
                    var d=Math.abs(a*x0+b*y0+c)/Math.sqrt(a*a+b*b);
                    if(d < dMin){
                        dMin = d;
                        ptMin1 = pt1;
                        ptMin2 = pt2;
                    }
                }
                var direction = Math.atan2(ptMin2.y - ptMin1.y, ptMin2.x - ptMin1.x);
                direction = 270.0 - direction / Math.PI * 180;
                GDYB.GridProductClass.datasetGrid.grid[i][j].direction = direction;
                }
            }
        }
    };
}
