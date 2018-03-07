/**
 * @requires WeatherMap/Layer/CanvasLayer.js
 * @requires WeatherMap/Layer/Grid.js
 * @requires WeatherMap/Tile/Image.js
 */

/**
 * Class: WeatherMap.Layer.Tianditu
 * 天地图服务图层类。
 *     用于显示天地图的地图服务，使用<WeatherMap.Layer.Tianditu>的
 *     构造函数可以创建天地图图层，更多信息查看：
 *
 * Inherits from:
 *  - <WeatherMap.Layer.CanvasLayer>
 */
WeatherMap.Layer.LocalTiledCacheLayer = WeatherMap.Class(WeatherMap.CanvasLayer, {
    //dir:"tianditu/map/map/",
    dir: "MapCQ",
    format: "png",
    //scales:[1/295829355, 1/147914678,1/73957339, 1/36978669, 1/18489335,1/9244667,1/4622334,1/2311167,1/1155583,1/577792,1/288896,1/144448,1/72224,1/36112,1/18056,1/9026,1/4514],
    scales: [1 / 3000000, 1 / 1500000, 1 / 750000, 1 / 375000, 1 / 187500, 1 / 93750], //
    /**
     * APIProperty: layerType
     * {String} 图层类型.(vec:矢量图层，img:影像图层，ter:地形图层)
     */
    //layerType:"vec",    //(vec:矢量图层，cva:矢量标签图层，img:影像图层,cia:影像标签图层，ter:地形,cta:地形标签图层)

    /**
     * APIProperty: isLabel
     * {Boolean} 是否是标签图层.
     */
    //isLabel:false,

    /**
     * Property: attribution
     * {String} The layer attribution.
     */
    //attribution: "Data by <a style='white-space: nowrap' target='_blank' href='http://www.tianditu.com'>Tianditu</a>",

    /**
     * Property: url
     * {String} 图片url.
     */
    //url:"http://172.22.96.213:8080/TiledCacheService/TiledCacheServlet?dir=${dir}&scale=${scale}&row=${row}&col=${col}&format=${format}",
    //url:"http://172.24.176.84:8080/TiledCacheService/TiledCacheServlet?dir=${dir}&scale=${scale}&row=${row}&col=${col}&format=${format}",
    url: G.HOST + "TiledCacheService/TiledCacheServlet?dir=${dir}&scale=${scale}&row=${row}&col=${col}&format=${format}",
    //url:"http://10.158.30.222:8080/TiledCacheService/TiledCacheServlet?dir=${dir}&scale=${scale}&row=${row}&col=${col}&format=${format}",
    //cva_url:"http://t${num}.tianditu.com/DataServer?T=cva_${proj}&x=${x}&y=${y}&l=${z}",


    setService: function(serviceURL, dir) {
        if (serviceURL) this.url = serviceURL + "/TiledCacheServlet?dir=${dir}&scale=${scale}&row=${row}&col=${col}&format=${format}";
        if (dir) this.dir = dir;
    },

    initialize: function(options) {
        var me = this;
        me.name = "LocalTiledCache";
        var resolutions = [];
        for (var i = 0; i < me.scales.length; i++) {
            resolutions.push(WeatherMap.Util.getResolutionFromScaleDpi(1 / me.scales[i], 96, "degree"));
        }
        //        options = WeatherMap.Util.extend({
        //            maxExtent: new WeatherMap.Bounds(
        //                minX, minY, maxX, maxY
        //            ),
        //            tileOrigin:new WeatherMap.LonLat(minX, maxY),
        //            //maxResolution:maxResolution,
        //            //minResolution:minResolution,
        //            resolutions:resolutions,
        //            units:me.units,
        //            projection:me.projection
        //        }, options);
        options = WeatherMap.Util.extend({
            maxExtent: new WeatherMap.Bounds(-180, -90,
                180,
                90
            ),
            //maxExtent: new WeatherMap.Bounds(
            //    104.44779200000001,
            //    20.870612000000001,
            //    112.05645199999999,
            //    26.389068999999999
            //),
            tileOrigin: new WeatherMap.LonLat(-180, 90),
            resolutions: resolutions
                //第19级分辨率为0.298817952474，但由于绝大部分城市和地区在此级别都无图，所以暂不增加
                //            resolutions: [156605.46875, 78302.734375, 39151.3671875, 19575.68359375, 9787.841796875, 4893.9208984375, 2446.96044921875, 1223.48022460937, 611.740112304687, 305.870056152344, 152.935028076172, 76.4675140380859, 38.233757019043, 19.1168785095215, 9.55843925476074, 4.77921962738037, 2.38960981369019, 1.19480490684509, 0.597402453422546]
                //scales: [1/5000000,1/4000000,1/3000000,1/2500000,1/2000000,1/1600000,1/1000000,1/500000,1/300000]
        }, options);
        WeatherMap.CanvasLayer.prototype.initialize.apply(me, [me.name, me.url, null, options]);
        //this.scales = [1/5000000,1/5000000,1/4000000,1/3000000,1/2500000,1/2000000,1/1600000,1/1000000,1/500000,1/300000];
    },

    /**
     * Method: getTileUrl
     * 获取每个tile的图片url
     *
     * Parameters:
     * xyz - {Object}
     */
    getTileUrl: function(xyz) {
        var me = this;
        url = me.url;

        //var proj = this.projection;
        //if(proj.getCode){
        //    proj = proj.getCode();
        //}
        //
        //if(proj=="EPSG:4326"){
        //    var proj = "c"
        //}
        //else{
        //    var proj = "w";
        //}

        var x = xyz.x;
        var y = xyz.y;

        var z = xyz.z;
        var scale = 1 / this.scales[z];
        //var num = Math.abs((xyz.x + xyz.y) % 7);

        //var lt = this.layerType;
        //if(this.isLabel){
        //    if(this.layerType=="vec")lt="cva"
        //    if(this.layerType=="img")lt="cia"
        //    if(this.layerType=="ter")lt="cta"
        //}

        url = WeatherMap.String.format(url, {
            dir: this.dir,
            col: x,
            row: y,
            scale: Math.round(scale),
            format: this.format
        });
        return url;
    },

    /**
     * Method: setMap
     * Set the map property for the layer. This is done through an accessor
     *     so that subclasses can override this and take special action once
     *     they have their map variable set.
     *
     *     Here we take care to bring over any of the necessary default
     *     properties from the map.
     *
     * Parameters:
     * map - {<WeatherMap.Map>}
     */
    setMap: function(map) {
        WeatherMap.CanvasLayer.prototype.setMap.apply(this, [map]);
        //var proCode = null;
        //var proj = this.projection||map.projection;
        //if(proj){
        //    if(proj.getCode){
        //        proCode = proj.getCode();
        //    }
        //    else{
        //        proCode = proj;
        //    }
        //}
        //this.setTiandituParam(proCode);
    },

    CLASS_NAME: 'WeatherMap.Layer.LocalTiledCacheLayer'
});
