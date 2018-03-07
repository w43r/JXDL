/* COPYRIGHT 2012 SUPERMAP
 * 本程序只能在有效的授权许可下使用。
 * 未经许可，不得以任何手段擅自使用或传播。*/

/**
 * @requires WeatherMap/BaseTypes/Class.js
 * @requires WeatherMap/Util.js
 * @requires WeatherMap/Layer.js
 */

/**
 * Class: WeatherMap.Layer.FillColorLayer
 * 填色图层。
 * 提供对热点信息的添加删除操作和渲染展示。
 * 由于使用canvas绘制，所以不支持直接修改操作。
 */
WeatherMap.Layer.FillColorLayer = WeatherMap.Class(WeatherMap.Layer, {

    /**
     * APIProperty: colors
     * {Array(<WeatherMap.REST.ServerColor>)} 颜色线性渐变数组 ，默认为null。
     * 用于表示数据权重的渐变，此参数不设置的情况颜色由绿（低权重）到红（高权重）。
     * 此参数长度大于1时颜色渐变由数组决定，否则使用默认渐变。
     *
     * (start code)
     * //需要设置可以为如下方式：
     * //feature.attributes中表示权重的字段为height,则在FillColorLayer的featureWeight参数赋值为"height"
     * feature1.attributes.height = 7.0;
     * feature2.attributes.height = 6.0;
     * var FillColorLayer = new WeatherMap.Layer.FillColorLayer("FillColorLayer",{"featureWeight":"height"});
     * var colors = [
     *      new  WeatherMap.REST.ServerColor(170,240,233),
     *      new  WeatherMap.REST.ServerColor(180,245,185),
     *      new  WeatherMap.REST.ServerColor(223,250,177)
     * ];
     * FillColorLayer.colors = colors;
     * FillColorLayer.addFeatures([feature1,feature2]);
     *
     * (end)
     *
     */
    colors: null,

    /**
     * APIProperty: radius
     * {Number} 热点渲染的最大半径（热点像素半径），默认为 50。
     * 热点显示的时候以精确点为中心点开始往四周辐射衰减，
     * 其衰减半径和权重值成比列。
     * 注：如果指定了热点地理半径字段名称，即设置了属性featureRadius，那么将按照指定的地理半径字段的值绘制热点图，此时radius将无效。
     */
    radius: 50,

    /**
     * APIProperty: features
     * {Array(<WeatherMap.Feature.Vector>)} 热点信息数组，记录存储图层上添加的所有热点信息。
     */
    features: null,

    /**
     * APIProperty: maxWeight
     * {Number} 设置权重最大值。如果不设置此属性，将按照当前屏幕范围内热点所拥有的权重最大值绘制热点图。。
     */
    maxWeight: null,
    /**
     * APIProperty: minWeight
     * {Number} 设置权重最小值。如果不设置此属性，将按照当前屏幕范围内热点所拥有的权重最小值绘制热点图。
     */
    minWeight: null,

    /**
     * APIProperty: featureWeight
     * {String} 对应feature.attributes中的热点权重字段名称，feature.attributes中权重参数的类型为float
     * (start code)
     * //例如：
     * //feature.attributes中表示权重的字段为height,则在FillColorLayer的featureWeight参数赋值为"height"
     * feature1.attributes.height = 7.0;
     * feature2.attributes.height = 6.0;
     * var FillColorLayer = new WeatherMap.Layer.FillColorLayer("FillColorLayer",{"featureWeight":"height"});
     * FillColorLayer.addFeatures([feature1,feature2]);
     * (end)
     */
    featureWeight: null,

    /**
     * APIProperty: featureRadius
     * {String} 对应feature.attributes中的热点地理半径字段名称，feature.attributes中热点地理半径参数的类型为float
     * (start code)
     * //例如：
     * //feature.attributes中表示热点地理半径的字段为radius,则在FillColorLayer的featureRadius参数赋值为"radius"
     * //feature.attributes.radius与 FillColorLayer.radius（热点像素半径）属性二者只能选其一，当同时设置时，首选 feature.attributes.radius 属性。默认情况下使用 FillColorLayer.radius 像素半径。
     * feature1.attributes.radius = 7.0;
     * feature2.attributes.radius = 6.0;
     * var FillColorLayer = new WeatherMap.Layer.FillColorLayer("FillColorLayer",{"featureRadius":"radius"});
     * FillColorLayer.addFeatures([feature1,feature2]);
     * (end)
     */
    featureRadius: null,

    /**
     * 监听一个自定义事件可用如下方式:
     * (code)
     * layer.events.register(type, obj, listener);
     * (end)
     *
     * 热点图自定义事件信息，事件调用时的属性与具体事件类型相对应。
     *
     * All event objects have at least the following properties:
     * object - {Object} A reference to layer.events.object.
     * element - {DOMElement} A reference to layer.events.element.
     *
     * 支持的事件如下 (另外包含 <WeatherMap.Layer 中定义的其他事件>):
     * featuresadded - 热点添加完成时触发。传递参数为添加的热点信息数组和操作成功与否信息。
     *         参数类型：{features: features, succeed: succeed}
     * featuresremoved - 热点被删除时触发。传递参数为删除的热点信息数组和操作成功与否信息。
     *         参数类型：{features: features, succeed: succeed}
     * featuresdrawcompleted - 热点图渲染完成时触发，没有额外属性。
     */
    EVENT_TYPES: ["featuresadded","featuresremoved","featuresdrawcompleted"],

    /**
     * Proterty: supported
     * {Boolean} 当前浏览器是否支持canvas绘制，默认为false。
     * 决定了热点图是否可用，内部判断使用。
     */
    supported: false,

    /**
     * Proterty: rootCanvas
     * {Canvas} 热点图主绘制面板。
     */
    rootCanvas: null,

    /**
     * Proterty: rootCanvas
     * {Canvas} 热点图主绘制对象。
     */
    canvasContext: null,

    /**
     * Proterty: pixelHeatPoints
     * {Array(Object)} 记录热点在具体分辨率下的像素坐标位置，方便渲染使用。
     */
    pixelHeatPoints: null,

    /**
     * Proterty: alphaValues
     * {Array(Array(Number))} 记录热点渲染后每个像素点的透明度信息。
     */
    alphaValues: null,

    /**
     * Proterty: colorValues
     * {Array(Array(Number))} 记录热点渲染后每个像素点的颜色权重信息。
     */
    colorValues: null,

    /**
     * Proterty: imgData
     * {ImageData)} 记录当前屏幕所要绘制的热点图位图信息。
     */
    imgData: null,



    /**
     * Proterty: maxWidth
     * {Number)} 当前绘制面板宽度。和当前 map 窗口宽度一致。
     */
    maxWidth: null,

    /**
     * Proterty: maxHeight
     * {Number)} 当前绘制面板宽度。和当前 map 窗口高度一致。
     */
    maxHeight: null,

    /*
    *
    * 无效值
    *
    * */
    noDataValue:9999,

    /*
     *
     * 格点数据集
     *
     * */
    datasetGrid:null,

    /*
     *
     * 转换为屏幕坐标的格点
     *
     * */
    gridS:null,

    /*
     *
     * X方向格点像素间距
     *
     * */
    deltaX:null,

    /*
     *
     * Y方向格点像素间距
     *
     * */
    deltaY:null,

    /*
    *
    * 格点像素范围
    *
    * */
    left:null,
    bottom:null,
    right:null,
    top:null,

    /*
     * 透明度
     * */
    alpha:125,

    /*
     * 是否显示网格线
     * */
    isShowGridline:true,

    /*
     * 是否显示标签
     * */
    isShowLabel:true,

    /*
    * 标签等样式
    * */
    style: {
        labelAlign: "cm",
        fontFamily:"Arial",
        fontColor:"#333",
        fontSize:"14px",
        fill: false,
        stroke: false
    },

    /*
     * 是否平滑（ture-双线性内插平滑，false-马赛克效果）
     * */
    isSmooth:false,

    /*
    * 是否风场
    * */
    isWind:false,

    /*
    * 图标宽高
    * */
    imageWidth:12,
    imageHeight:24,

    /*
    * 图标偏移量
    * */
    imageOffsetX:-6,
    imageOffsetY:-24,

    /**
     * Constructor: WeatherMap.Layer.FillColorLayer
     * 创建一个热点图层。
     * (start code)
     * //创建一个名为“FillColorLayer” 的热点渲染图层。
     *  var FillColorLayer = new WeatherMap.Layer.FillColorLayer("FillColorLayer");
     * (end)
     *
     * Parameters:
     * name - 此图层的图层名 {String}
     * options - {Object} 设置此类上没有默认值的属性。
     *
     * Returns:
     * {<WeatherMap.Layer.FillColorLayer>} 新的热点图层。
     */
    initialize: function(name, options) {
        this.EVENT_TYPES =
            WeatherMap.Layer.FillColorLayer.prototype.EVENT_TYPES.concat(
            WeatherMap.Layer.prototype.EVENT_TYPES
        );

        WeatherMap.Layer.prototype.initialize.apply(this, arguments);

        //热点图要求使用canvas绘制，判断是否支持
        this.rootCanvas = document.createElement("canvas");
        if (!this.rootCanvas.getContext) {
            return;
        }
        this.supported = true;
        //构建绘图面板
        this.rootCanvas.id = "Canvas_" + this.id;
        this.rootCanvas.style.position = "absolute";
        this.div.appendChild(this.rootCanvas);
        this.canvasContext = this.rootCanvas.getContext('2d');
    },

    /**
     * APIMethod: addFeatures
     * 添加热点信息。
     *
     * Parameters:
     * features - {Array<WeatherMap.Feature.Vector>} 热点信息数组。
     *
     * (start code)
     * var feature1 = new WeatherMap.Feature.Vector();
     * feature1.geometry = new WeatherMap.Geometry.Point(0,0);    //只支持point类型
     * feature1.attributes.height = 9;
     * var FillColorLayer = new WeatherMap.Layer.FillColorLayer("FillColorLayer",{"featureWeight":"height"});
     * FillColorLayer.addFeatures([feature1]);
     * (end)
     */
    addFeatures: function(features){//addHeatPoints
        if (!(WeatherMap.Util.isArray(features))) {
            features = [features];
        }
        this.features = this.features || [];
        if(0 == this.features.length){
            this.features = features;
        }else{
            this.features.concat(features);
        }
        this.events.triggerEvent("featuresadded", {features: features, succeed: true});
        this.refresh();
    },

    /**
     * APIMethod: removeFeatures
     * 移除指定的热点信息。
     *
     * Parameters:
     * features - {Array<WeatherMap.Feature.Vector>} 热点信息数组。
     */
    removeFeatures: function(features){//removeHeatPoints
        if(!features || features.length === 0 || !this.features || this.features.length === 0) {
            return;
        }
        if (features === this.features) {
            return this.removeAllFeatures();
        }
        if (!(WeatherMap.Util.isArray(features))) {
            features = [features];
        }
        var heatPoint, index, heatPointsFailedRemoved = [];
        for(var i=0, len=features.length; i<len; i++){
            heatPoint = features[i];
            index = WeatherMap.Util.indexOf(this.features, heatPoint);
            //找不到视为删除失败
            if(index === -1) {
                heatPointsFailedRemoved.push(heatPoint);
                continue;
            }
            //删除热点
            this.features.splice(index, 1);
        }
        var succeed = heatPointsFailedRemoved.length == 0? true : false;
        this.refresh();

        this.events.triggerEvent("featuresremoved", {features: heatPointsFailedRemoved, succeed: succeed});
    },

    /**
     * APIMethod: removeAllFeatures
     * 移除全部的热点信息。
     */
    removeAllFeatures: function(){//removeAllHeatPoints
        if(this.features && this.features.length > 0){
            for(var i=0, len= this.features.length; i < len; i++){
                this.features[i].destroy();
                this.features[i] = null;
            }
        }
        this.features = [];
        this.refresh();
    },

    /**
     * APIMethod: refresh
     * 强制刷新当前热点显示，在图层热点数组发生变化后调用，即使更新显示。
     */
    refresh: function(){
        if(this.map){
            var extent = this.map.getExtent();
            this.updateHeatPoints(extent);
        }
    },

    /**
     * APIMethod: destroy
     * 销毁图层，释放资源。
     */
    destroy: function() {
        if(this.features && this.features.length > 0){
            for(var i=0, len= this.features.length; i < len; i++){
                this.features[i].destroy();
                this.features[i] = null;
            }
        }
        this.colors = null;
        this.features = null;
        this.radius = null;
        this.supported = null;
        this.canvasContext = null;
        this.pixelHeatPoints = null;
        this.rootCanvas = null;
        this.alphaValues = null;
        this.colorValues = null;
        this.imgData = null;
        this.maxWeight = null;
        this.minWeight = null;
        this.maxWidth = null;
        this.maxHeight = null;
        this.featureRadius = null;
        WeatherMap.Layer.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: setMap
     * 图层已经添加到Map中。
     *
     * 如果当前浏览器支持canvas，则开始渲染要素；如果不支持则移除图层。
     *
     * Parameters:
     * map - {<WeatherMap.Map>}需要绑定的map对象。
     */
    setMap: function(map) {
        WeatherMap.Layer.prototype.setMap.apply(this, arguments);
        if(!this.supported){
            this.map.removeLayer(this);
        }else{
            this.redraw();
        }
    },

    setDatasetGrid:function(datasetGrid){
        this.datasetGrid = datasetGrid;
        if(datasetGrid != null)
        {
            this.noDataValue = datasetGrid.noDataValue;
            this.gridS = null;
        }
        if(this.visibility)
            this.refresh();
    },

    /**
     * Method: moveTo
     * 重置当前热点图层的div，再一次与Map控件保持一致。
     * 修改当前显示范围，当平移或者缩放结束后开始重绘热点图的渲染效果。
     *
     * Parameters:
     * bounds - {<WeatherMap.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo: function(bounds, zoomChanged, dragging) {
        WeatherMap.Layer.prototype.moveTo.apply(this, arguments);
        if(!this.supported){
            return;
        }
        this.zoomChanged = zoomChanged;
        if(!dragging){
            this.div.style.visibility = "hidden";
            this.div.style.left = -parseInt(this.map.layerContainerDiv.style.left) + "px";
            this.div.style.top = -parseInt(this.map.layerContainerDiv.style.top) + "px";
            var size = this.map.getSize();
            this.rootCanvas.width = parseInt(size.w);
            this.rootCanvas.height = parseInt(size.h);
            this.maxWidth = size.w;
            this.maxHeight = size.h;
            this.div.style.visibility = "visible";
            if(!zoomChanged){
                this.updateHeatPoints(bounds);
            }
        }

        if(zoomChanged){
            this.updateHeatPoints(bounds);
        }
    },

    /**
     * Method: updateHeatPoints
     * 刷新热点图显示
     *
     * Parameters:
     * bounds - {<WeatherMap.Bounds>} 当前显示范围
     */
    updateHeatPoints: function(bounds){
//        this.pixelHeatPoints = [];
//        if(this.features && this.features.length > 0){
//            // var date = new Date();
//            this.convertToPixelPoints(bounds);
//            this.drawHeatPoints(bounds);
//            // alert(new Date() - date);
//        }else{
//            this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxWidth);
//        }

        if(this.datasetGrid != null && this.datasetGrid.grid.length > 0)
        {
            this.updateGrid(bounds);

            this.drawHeatPoints(bounds);
            if(this.isWind) {
                this.drawWind(bounds);
            }
            else
            {
                if (this.isShowGridline && this.map.getResolution() < 0.003) //太密了也没有必要显示啦
                    this.drawGridLine(bounds);
                if(this.isShowLabel)
                    this.drawLabel(bounds);
            }
        }
        else
            this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxWidth);
    },

    /**
     * Method: convertToPixelPoints
     * 过滤位于当前显示范围内的热点，并转换其为当前分辨率下的像素坐标。
     *
     * Parameters:
     * bounds - {<WeatherMap.Bounds>} 当前显示范围
     */
    convertToPixelPoints: function(bounds){
        var maxTemp,minTemp,resolution = this.map.getResolution();
        for(var i = this.features.length - 1; i >= 0; i--){
            var f = this.features[i];
            var point = f.geometry;
            //过滤，只显示当前范围
            if(bounds.contains(point.x, point.y)){
                var pixelPoint = this.getPixelXY(point.x, point.y, bounds, resolution);
                pixelPoint.weight = f.attributes[this.featureWeight];//point.value;
                var geoRadius = this.featureRadius&&f.attributes[this.featureRadius]?f.attributes[this.featureRadius]:null;
                //半径只考虑非整型
                pixelPoint.geoRadius = geoRadius? parseInt(geoRadius/resolution): geoRadius;
                this.pixelHeatPoints.push(pixelPoint);
                maxTemp = maxTemp?maxTemp:pixelPoint.weight;
                minTemp = minTemp?minTemp:pixelPoint.weight;
                maxTemp = Math.max(maxTemp, pixelPoint.weight);
                minTemp = Math.min(minTemp, pixelPoint.weight);
            }
        }
        this.maxWeight = this.maxWeight ? this.maxWeight : maxTemp;
        this.minWeight = this.minWeight ? this.minWeight : minTemp;
        this.tempValue = this.maxWeight - this.minWeight;
    },

    updateGrid:function(bounds){
//        var date1=new Date();    //开始时间，test
        var resolution = this.map.getResolution();
        var bFirst = false;
        if(this.gridS == null) {
            this.gridS = [];
            bFirst = true;
        }
        if(this.datasetGrid != null && this.datasetGrid.grid.length > 0)
        {
            //不能采用逐个格点转为像素点，因为四舍五入或取整，导致格点间距不一致。故采用下面方法：
            var pixelPointLeftTop = this.getPixelXY(this.datasetGrid.left, this.datasetGrid.top, bounds, resolution);
            var pixelPointRightBottom = this.getPixelXY(this.datasetGrid.right, this.datasetGrid.bottom, bounds, resolution);
            this.deltaX = Math.abs(pixelPointRightBottom.x - pixelPointLeftTop.x) / (this.datasetGrid.cols - 1);
            this.deltaY = Math.abs(pixelPointRightBottom.y - pixelPointLeftTop.y) / (this.datasetGrid.rows - 1);
            this.left = pixelPointLeftTop.x - this.deltaX / 2;
            this.bottom = pixelPointRightBottom.y + this.deltaY / 2;
            this.right = pixelPointRightBottom.x + this.deltaX / 2;
            this.top = pixelPointLeftTop.y - this.deltaY / 2;
            for(var i=0;i<this.datasetGrid.rows;i++) {
                var gridRow = this.datasetGrid.grid[i];
                var gridRowS = [];
                for (var j = 0; j < this.datasetGrid.cols; j++) {
                    if(this.isWind) {
                        if (bFirst) {
                            gridRowS.push({
                                "x": this.left + this.deltaX * j,
                                "y": this.top + this.deltaY * i,
                                "z": gridRow[j].z,
                                "direction": gridRow[j].direction
                            });
                        }
                        else {
                            this.gridS[i][j].x = this.left + this.deltaX * j;
                            this.gridS[i][j].y = this.top + this.deltaY * i;
                            this.gridS[i][j].z = gridRow[j].z;
                            this.gridS[i][j].direction = gridRow[j].direction;
                        }
                    }
                    else {
                        if (bFirst) {
                            gridRowS.push({
                                "x": this.left + this.deltaX * j,
                                "y": this.top + this.deltaY * i,
                                "z": gridRow[j].z
                            });
                        }
                        else{
                            this.gridS[i][j].x = this.left + this.deltaX * j;
                            this.gridS[i][j].y = this.top + this.deltaY * i;
                            this.gridS[i][j].z = gridRow[j].z;
                        }
                    }
                }
                if(bFirst)
                    this.gridS.push(gridRowS);
            }
        }

//        var date2=new Date();    //结束时间，test
//        alert("updateGrid耗时：" + (date2.getTime()-date1.getTime()));
    },

    /**
     * Method: drawHeatPoints
     * 完成绘制热点图的初始工作，逐一完成热点的渲染
     *
     * Parameters:
     * bounds - {<WeatherMap.Bounds>} 当前显示范围
     */
    drawHeatPoints:function(bounds){
        //var date1=new Date();  //开始时间,test
        //清空上次的bitmap信息
        if(this.imgData == null || this.imgData.width != this.maxWidth || this.imgData.height != this.maxHeight)
            this.imgData = this.canvasContext.createImageData(this.maxWidth, this.maxHeight);

        this.alphaValues = [];
        this.colorValues = [];
        var noDataColor = {r: 0, g: 0, b: 0, a: 0};
        var maxHeight = this.maxHeight;
        var maxWidth = this.maxWidth;
        var value = null;
        var colorObj = null;
        var pixelIndex = null;
        var pixelIndexFullRow = null;
        var deltaPixel = 3;
        for(var i = 0; i < maxHeight; i+=deltaPixel){
            for(var j = 0; j < maxWidth; j+=deltaPixel)
            {
                value = this.getValue(j, i);
                if(value == this.noDataValue)
                    colorObj = noDataColor;//continue;
                else
                    colorObj = this.convertValueToColor(value);

                for(var r=0;r<deltaPixel;r++){
                    var row = i+r;
                    if(row >= maxHeight)
                        break;
                    pixelIndexFullRow = row*maxWidth*4;
                    for(var c=0;c<deltaPixel;c++){
                        var col = j+c;
                        if(col >= maxWidth)
                            break;
                        pixelIndex =pixelIndexFullRow + col*4;
                        this.imgData.data[pixelIndex] = colorObj.r;
                        this.imgData.data[pixelIndex + 1] = colorObj.g;
                        this.imgData.data[pixelIndex + 2] = colorObj.b;
                        this.imgData.data[pixelIndex + 3] = colorObj.a;
                    }
                }
            }
        }

        this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxHeight);
        this.canvasContext.putImageData(this.imgData, 0, 0);
        this.events.triggerEvent("featuresdrawcompleted");

//        var date2=new Date();    //结束时间，test
//        alert("填色绘制耗时：" + (date2.getTime()-date1.getTime()));
    },

    getValue:function(x, y){
        var result = this.noDataValue;
        var gridS = this.gridS;
        if(gridS == null || gridS.length == 0)
            return result;

        if(x < this.left || x > this.right || y< this.top || y>this.bottom)
            return result;

        var xRelative = x - this.left;
        var yRelative = y - this.top;

//        var deltaX = Math.abs(gridS[1][1].x - gridS[0][0].x);
//        var deltaY = Math.abs(gridS[1][1].y - gridS[0][0].y);
        var xIndex = xRelative <0 ? 0 : Math.floor(xRelative/this.deltaX); //列
        var yIndex = yRelative <0 ? 0 : Math.floor(yRelative/this.deltaY); //行

        //左上
        if(xIndex<0 && yIndex < 0)
        {
            return gridS[0][0].z;
        }

        //左下
        if(xIndex<0 && yIndex>=gridS.length - 1)
        {
            return gridS[gridS.length - 1][0].z;
        }

        //右下
        if(xIndex>=gridS[0].length - 1 && yIndex>=gridS.length - 1)
        {
            return gridS[gridS.length - 1][gridS[0].length - 1].z;
        }

        //右上
        if(xIndex>=gridS[0].length - 1 && yIndex<0)
        {
            return gridS[0][gridS[0].length - 1].z;
        }


        if(!this.isSmooth && this.map.getResolution() < 0.003)
        {
            result = gridS[yIndex][xIndex].z;
        }
        else //进行双线性插值
        {
            //左、右边缘
            if (xIndex < 0 || xIndex >= gridS[0].length - 1) {
                var yTop = gridS[yIndex][xIndex < 0 ? 0 : gridS[yIndex].length - 1].y;
                var zTop = gridS[yIndex][xIndex < 0 ? 0 : gridS[yIndex].length - 1].z;
                var yBottom = gridS[yIndex + 1][xIndex < 0 ? 0 : gridS[yIndex].length - 1].y;
                var zBottom = gridS[yIndex + 1][xIndex < 0 ? 0 : gridS[yIndex].length - 1].z;
                result = Math.abs(yBottom - y) / this.deltaY * zTop + Math.abs(yTop - y) / this.deltaY * zBottom;
                result = Math.round(result * 10) / 10; //保留1位小数
                return result;
            }

            //上、下边缘
            if (yIndex < 0 || yIndex >= gridS.length - 1) {
                var xLeft = gridS[yIndex < 0 ? 0 : gridS.length - 1][xIndex].x;
                var zLeft = gridS[yIndex < 0 ? 0 : gridS.length - 1][xIndex].z;
                var xRight = gridS[yIndex < 0 ? 0 : gridS.length - 1][xIndex + 1].x;
                var zRight = gridS[yIndex < 0 ? 0 : gridS.length - 1][xIndex + 1].z;
                result = Math.abs(xRight - x) / this.deltaX * zLeft + Math.abs(xLeft - x) / this.deltaX * zRight;
                result = Math.round(result * 10) / 10; //保留1位小数
                return result;
            }

            var xLeftTop = gridS[yIndex][xIndex].x;
            var yLeftTop = gridS[yIndex][xIndex].y;
            var zLeftTop = gridS[yIndex][xIndex].z;

            var xRightTop = gridS[yIndex][xIndex + 1].x;
            var yRightTop = gridS[yIndex][xIndex + 1].y;
            var zRightTop = gridS[yIndex][xIndex + 1].z;

            var xLeftBottom = gridS[yIndex + 1][xIndex].x;
            var yLeftBottom = gridS[yIndex + 1][xIndex].y;
            var zLeftBottom = gridS[yIndex + 1][xIndex].z;

            var xRightBottom = gridS[yIndex + 1][xIndex + 1].x;
            var yRightBottom = gridS[yIndex + 1][xIndex + 1].y;
            var zRightBottom = gridS[yIndex + 1][xIndex + 1].z;

            if(zLeftTop == this.noDataValue || zRightTop == this.noDataValue || zLeftBottom == this.noDataValue || zRightBottom == this.noDataValue)
                result = gridS[yIndex][xIndex].z;
            else
                result = Math.abs(yLeftBottom - y) / this.deltaY * (Math.abs(xRightTop - x) / this.deltaX * zLeftTop + Math.abs(xLeftTop - x) / this.deltaX * zRightTop)
                    + Math.abs(yLeftTop - y) / this.deltaY * (Math.abs(xRightBottom - x) / this.deltaX * zLeftBottom + Math.abs(xLeftBottom - x) / this.deltaX * zRightBottom);
        }
        result = Math.round(result * 10) / 10; //保留1位小数
        return result;
    },

    //绘制网格线
    drawGridLine:function(bounds){
        var nleft = Math.floor((bounds.left - this.datasetGrid.left + this.datasetGrid.deltaX / 2)/this.datasetGrid.deltaX);
        if(nleft < 0)
            nleft = 0;
        var nRight = Math.floor((bounds.right - this.datasetGrid.left + this.datasetGrid.deltaX / 2)/this.datasetGrid.deltaX);
        if(nRight <= 0)
            return;
        else if(nRight >= this.datasetGrid.cols)
            nRight = this.datasetGrid.cols - 1;
        var nTop = Math.floor((this.datasetGrid.top + this.datasetGrid.deltaY / 2 - bounds.top)/this.datasetGrid.deltaY);
        if(nTop < 0)
            nTop = 0;
        var nBottom = Math.floor((this.datasetGrid.top + this.datasetGrid.deltaY / 2 - bounds.bottom)/this.datasetGrid.deltaY);
        if(nBottom <= 0)
            return;
        else if(nBottom >= this.datasetGrid.rows)
            nBottom = this.datasetGrid.rows - 1;

        var left = this.gridS[nTop][nleft].x;
        var top = this.gridS[nTop][nleft].y;
        var right = this.gridS[nBottom][nRight].x;
        var bottom = this.gridS[nBottom][nRight].y;
        this.canvasContext.save();
        //this.canvasContext.strokeStyle = "rgba(199,153,68, 255)";
        this.canvasContext.strokeStyle = "rgba(220,210,170, 255)";
        this.canvasContext.width = 0.1;
        for(var i=nleft; i<=nRight; i++){
            this.canvasContext.beginPath();
            this.canvasContext.moveTo(this.gridS[nTop][i].x, top);
            this.canvasContext.lineTo(this.gridS[nTop][i].x, bottom);
            this.canvasContext.stroke();
        }
        for(var j=nTop; j<=nBottom; j++){
            this.canvasContext.beginPath();
            this.canvasContext.moveTo(left, this.gridS[j][nleft].y);
            this.canvasContext.lineTo(right, this.gridS[j][nleft].y);
            this.canvasContext.stroke();
        }
    },

    drawLabel:function(){
        var rows = this.gridS.length;
        var cols = this.gridS[0].length;
        var left = 0;
        var top = 0;
        var right = this.maxWidth;
        var bottom =  this.maxHeight;
        var xIndexStart = left < this.left ? 0 : Math.floor((left-this.left)/this.deltaX);
        var yIndexStart = top < this.top ? 0 : Math.floor((top-this.top)/this.deltaY);
        var xIndexEnd = right > this.right ? cols-1 : Math.floor((right-this.left)/this.deltaX);
        var yIndexEnd = bottom > this.bottom ? rows-1 : Math.floor((bottom-this.top)/this.deltaY);
        if(xIndexStart > (cols-1) || yIndexStart > (rows-1) || xIndexEnd <= 0 || yIndexEnd <=0 || xIndexStart==xIndexEnd || yIndexStart==yIndexEnd)
            return;

        var fontWidth = this.canvasContext.measureText("999.9").width;
        this.canvasContext.textAlign =
            WeatherMap.Renderer.Canvas.LABEL_ALIGN[this.style.labelAlign[0]] ||
            "center";
        this.canvasContext.textBaseline =
            WeatherMap.Renderer.Canvas.LABEL_ALIGN[this.style.labelAlign[1]] ||
            "middle";

        var intervalX = Math.floor(fontWidth/this.deltaX) + 1;
        var intervalY = Math.floor(fontWidth/this.deltaY) + 1;
        var offsetX = this.deltaX/2;
        var offsetY = this.deltaY/2;

        for(var i=yIndexStart; i<=yIndexEnd; i++) {
            if((i-yIndexStart)%intervalY == 0)
            {
                for(var j=xIndexStart; j<=xIndexEnd; j++){
                    if((j-xIndexStart)%intervalX == 0)
                    {
                        if(this.gridS[i][j].z == this.datasetGrid.noDataValue)
                            continue;
                        this.canvasContext.fillText(this.gridS[i][j].z,
                                this.gridS[i][j].x + offsetX,
                                this.gridS[i][j].y + offsetY);
                    }
                }
            }
        }
    },


    /*
    *
    * 绘制风场
    * */
    drawWind:function(bounds){
        //this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxHeight);
        var rows = this.gridS.length;
        var cols = this.gridS[0].length;
        var left = 0;
        var top = 0;
        var right = this.maxWidth;
        var bottom =  this.maxHeight;
        var xIndexStart = left < this.left ? 0 : Math.floor((left-this.left)/this.deltaX);
        var yIndexStart = top < this.top ? 0 : Math.floor((top-this.top)/this.deltaY);
        var xIndexEnd = right > this.right ? cols-1 : Math.floor((right-this.left)/this.deltaX);
        var yIndexEnd = bottom > this.bottom ? rows-1 : Math.floor((bottom-this.top)/this.deltaY);
        if(xIndexStart > (cols-1) || yIndexStart > (rows-1) || xIndexEnd <= 0 || yIndexEnd <=0 || xIndexStart==xIndexEnd || yIndexStart==yIndexEnd)
            return;
//        var xIndexStartEntire = Math.floor((left-this.left)/this.deltaX);
//        var yIndexStartEntire = Math.floor((top-this.top)/this.deltaY);
//        var xIndexEndEntire = Math.floor((right-this.left)/this.deltaX);
//        var yIndexEndEntire = Math.floor((bottom-this.top)/this.deltaY);
        var intervalX = Math.floor(this.imageWidth/this.deltaX) + 1;
        var intervalY = Math.floor(this.imageHeight/this.deltaY) + 1;
        for(var i=yIndexStart; i<=yIndexEnd; i++) {
            if((i-yIndexStart)%intervalY == 0)
            {
                for(var j=xIndexStart; j<=xIndexEnd; j++){
                    if((j-xIndexStart)%intervalX == 0)
                    {
                        if(this.gridS[i][j].z == this.datasetGrid.noDataValue || this.gridS[i][j].direction == this.datasetGrid.noDataValue)
                            continue;
                        var externalGraphic = this.getGraphic(this.gridS[i][j].z);
                        this.drawExternalGraphic(this.gridS[i][j].x, this.gridS[i][j].y, this.gridS[i][j].direction, externalGraphic);
                    }
                }
            }
        }
        this.events.triggerEvent("featuresdrawcompleted");
    },

    /*
    * 绘制图像
    * */
    drawExternalGraphic: function(x, y, rotation, externalGraphic) {
        var t = this;
        var img = new Image();
        //t.londingimgs[featureId] = img;

        var onLoad = function() {
            var x = this.x;
            var y = this.y;
            var rotation = this.rotation;
            var img = this.img;

            //t.londingimgs[featureId] = null;

            var width = t.imageWidth;
            var height = t.imageHeight;
            var opacity = 1.0;
            var xOffset = t.imageOffsetX;
            var yOffset = t.imageOffsetY;

            if(!isNaN(x) && !isNaN(y)) {
                var canvas = t.canvasContext;
                //Canvas添加旋转图片的功能
                canvas.save();
                var rotation = this.rotation/180*Math.PI;
                canvas.translate(x,y);
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
            }
        };

        img.onload = WeatherMap.Function.bind(onLoad, {
            x:x,
            y:y,
            rotation:rotation,
            img:img
        });
        img.src = externalGraphic;
    },

    getGraphic:function(value){
        var me = this;
        var result;
        if(me.items)
        {
            var len = me.items.length;
            for(var i = 0;i<len;i++)
            {
                if(value >= me.items[i].start && value <= me.items[i].end)
                {
                    result = me.items[i].image;
                    break;
                }
            }
        }
        else
        {

        }
        return result;
    },

    /**
     * Method: showPoint
     * 实现单个热点的绘制方法。
     * 热点向四周辐射渲染，半径越大值越小，透明度越小。
     *
     * Parameters:
     * x - {Number} 热点的像素 x 坐标。
     * y - {Number} 热点的像素 y 坐标。
     * value - {Number} 热点的权重值。
     * geoRadius - {Number} 热点的地理半径，如果设置了geoRadius则忽略使用value和radius计算出来的半径值。
     */
    showPoint: function(x, y, value, geoRadius) {
        var radiusTemp = this.radius;
//        for(var i=0; i < radiusTemp; i++) {
//            for (var j = 0; j <= radiusTemp; j++) {
//                this.setPixelColorByValue(x-i, y-j, value);
//                this.setPixelColorByValue(x-i, y+j, value);
//                this.setPixelColorByValue(x+i, y-j, value);
//                this.setPixelColorByValue(x+i, y+j, value);
//            }
//        }

        var left = x-radiusTemp,right = x+radiusTemp, bottom = y - radiusTemp, top = y + radiusTemp;
        for(var i= left; i < right; i++) {
            for (var j = bottom; j <= top; j++) {
                this.setPixelColorByValue(i, j, value);
            }
        }

//        //根据权重计算热点的中心值和半径范围，
//        var valueWeight = (value - this.minWeight)/this.tempValue,
//            //radiusTemp = 3 + parseInt(this.radius*valueWeight),
//            radiusTemp = this.radius,
//            distance,
//            alphaTemp,
//            colorTemp;
//        // if(geoRadius != "undefined" && geoRadius != null){
//            // radiusTemp = geoRadius;
//        // }
//        //如果设置了geoRadius则忽略使用value和radius计算出来的半径值。
//        if(geoRadius || 0 == geoRadius){
//            radiusTemp = geoRadius;
//        }
//        for(var i=0; i < radiusTemp; i++){
//            for(var j=0; j <= radiusTemp; j++){
//                // 计算半径，对应四个位置的值可用，x,y; -x,y;x,-y;-x,-y;
//                // 这里主要考虑求根算法过慢，加之循环次数太多做优化
//                if(i && j){
//                    distance =  1 - Math.sqrt(i*i + j*j)/radiusTemp;
//                    if(distance <= 0){
//                        alphaTemp = 0;
//                        colorTemp = 0;
//                    }else{
//                        //颜色权重正比，透明权重考虑边缘可见性确保其最小为0.1
//                        colorTemp = distance * valueWeight;
//                        alphaTemp = distance*distance*(0.1 + 0.9*valueWeight);
//                    }
//                    if(colorTemp <= 0 ){
//                        break;
//                    }
//                    //设置具体像素位置的颜色和透明度
//                    this.setPixelColor(x-i, y-j, alphaTemp, colorTemp);
//                    this.setPixelColor(x-i, y+j, alphaTemp, colorTemp);
//                    this.setPixelColor(x+i, y-j, alphaTemp, colorTemp);
//                    this.setPixelColor(x+i, y+j, alphaTemp, colorTemp);
//
//                }else if(!j){
//                    //    j为0的情况下考虑y轴可能的重复绘制做判断
//                    distance = 1 - i/radiusTemp;
//                    colorTemp = distance * valueWeight;
//                    alphaTemp = distance*distance*(0.1 + 0.9*valueWeight);
//                    if(0 != i){
//                    //j为0，绘制x轴上两个点
//                        this.setPixelColor(x+i, y, alphaTemp, colorTemp);
//                        this.setPixelColor(x-i, y, alphaTemp, colorTemp);
//                    }else{
//                        //x,y都为0的话则只绘制一个点
//                        this.setPixelColor(x, y, alphaTemp, colorTemp);
//                    }
//
//                }else if(!i){
//                //i为0，绘制y轴上两个点
//                    distance = 1 - j/radiusTemp;
//                    colorTemp = distance * valueWeight;
//                    alphaTemp = distance*distance*(0.1 + 0.9*valueWeight);
//                    this.setPixelColor(x, y-j, alphaTemp, colorTemp);
//                    this.setPixelColor(x, y+j, alphaTemp, colorTemp);
//                }
//            }
//        }
    },

    setPixelColorByValue: function(x, y, value){
        //范围外不予处理
        if( x >= 0 && x < this.maxWidth && y >= 0 && y < this.maxHeight){
            var    canvasData = this.imgData;
            var    pixelColorIndex = y*this.maxWidth*4 + x*4;
            var colorObj = this.convertValueToColor(value);
            //填充颜色和透明度的具体值
            canvasData.data[pixelColorIndex] = colorObj.r;
            canvasData.data[pixelColorIndex+1] = colorObj.g;
            canvasData.data[pixelColorIndex+2] = colorObj.b;
            //imgData.data[pixelColorIndex+3] = alpha*255;
            canvasData.data[pixelColorIndex+3] = 125;
        }
    },

    /**
     * Method: setPixelColor
     * 设置单个像素点的颜色和透明度.
     *
     * Parameters:
     * x - {int} 热点的像素 x 坐标。
     * y - {int} 热点的像素 y 坐标。
     * alphaTemp - {Number} 热点的颜色权重。
     * colorTemp - {Number} 热点的透明度权重。
     */
    setPixelColor: function(x, y, alphaTemp, colorTemp){
        //范围外不予处理
        if( x >= 0 && x < this.maxWidth && y >= 0 && y < this.maxHeight){
            var alpha = this.alphaValues[x][y];
            var    color = this.colorValues[x][y];
            var    pixelColorIndex = y*this.maxWidth*4 + x*4;
            var    canvasData = this.imgData;
            //叠加颜色和透明权重，颜色权重使用明度的叠加算法；
            //透明度叠加使用透明度叠加算法。两者基本一致
            if(alpha){
                alpha = alpha + alphaTemp - alphaTemp*alpha;
                color = color + colorTemp - colorTemp*color;
            }else{
                alpha = alphaTemp;
                color = colorTemp;
            }

            //记录权重值
            this.alphaValues[x][y] = alpha;
            this.colorValues[x][y] = color;


            var colorObj = this.convertWeightToColor(color);
            //填充颜色和透明度的具体值
            canvasData.data[pixelColorIndex] = colorObj.r;
            canvasData.data[pixelColorIndex+1] = colorObj.g;
            canvasData.data[pixelColorIndex+2] = colorObj.b;
            //imgData.data[pixelColorIndex+3] = alpha*255;
            canvasData.data[pixelColorIndex+3] = 125;
        }
    },

    /**
     * Method: convertWeightToColor
     * 将颜色权重转成具体的颜色。
     * 考虑更广泛和支持自定义行这个方法可能会做扩展支持，暂且不论。
     *
     * Parameters:
     * value - {Number} 颜色权重。
     */
    convertWeightToColor:function(value){
        var r, g, b,me = this;
        //转换颜色,这里是用颜色权重的三次方作为依据，已达到中心到边缘过渡的更迅速，重点突出（三次方效果）
        value = value*value*value;
        //如果设置了参数，且为数组，长度大于1，按照参数来
        if(me.colors && WeatherMap.Util.isArray(me.colors) && me.colors.length>1)
        {
            var startC,endC,len = me.colors.length;
            var index = parseInt((value - value%(1/(len-1)))/(1/(len-1)));
            if(index === len-1)
            {
                index--;
            }
            startC =  me.colors[index];
            endC = me.colors[index+1];
            r = startC.red + (endC.red - startC.red)*value;
            g = startC.green + (endC.green - startC.green)*value;
            b = startC.blue + (endC.blue - startC.blue)*value;
        }
        //默认没有设置就按照绿到蓝，保持以前的不变
        else
        {
            if(value < 0.65)
            {
                g = 240;
                r = 370 * value;
            }
            else
            {
                r = 240;
                g = 50+(636 - 636*value);
            }
        }

        return {"r": r, "g": g,"b":b};
    },

    /**
     * Method: getPixelXY
     * 转换地理坐标为相对于当前窗口左上角的像素坐标
     *
     * Parameters:
     * x - {int} 热点的像素 x 坐标。
     * y - {int} 热点的像素 y 坐标。
     * bounds - {WeatherMap.Bounds} 当前地图显示范围。
     * resolution - {Number} 当前地图分辨率。
     */
    getPixelXY: function(x, y, bounds, resolution) {
        var x = (x / resolution + (-bounds.left / resolution));
        var y = ((bounds.top / resolution) - y / resolution);
        return {x: parseInt(x), y: parseInt(y)};
    },

    CLASS_NAME: "WeatherMap.Layer.FillColorLayer"
});
