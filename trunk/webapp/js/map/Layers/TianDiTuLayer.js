
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
//var formatType = "vec";
WeatherMap.Layer.TianDiTuLayer = WeatherMap.Class(WeatherMap.CanvasLayer, {
    //dir:"Map",
    format:"vec",
	levelOffset:1,
	//isLabel:true,
    scales_1:[1/295829355.45,1/147914677.73,1/73957338.86,1/36978669.43,1/18489334,1/9244667.36,1/4622333.68,1/2311166.84,1/1155583.42,
			1/577791.71,1/288895.85,1/144447.93,1/72223.96,1/36111.98,1/18055.99,1/9028.00,1/4514.00,1/2257.00,1/1128.50,1/564.25],
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
    /**
     * Property: url
     * {String} 图片url.
     */
	url:"http://t${subdomain}.tianditu.com/DataServer?T=${layerType}_${proj}&x=${row}&y=${col}&l=${level}",
    //cva_url:"http://t${num}.tianditu.com/DataServer?T=cva_${proj}&x=${x}&y=${y}&l=${z}",

    /**
     * Property: zOffset
     * {Number} 图片url中z值偏移量
     */
    //zOffset:1,
    /**
     * Constructor: WeatherMap.Layer.Tianditu
     * 创建天地图图层
     *
     * Example:
     * (code)
     * var tiandituLayer = new WeatherMap.Layer.Tianditu();
     * (end)
     */
    initialize: function (options) {
        var me = this;
        me.name = "TiledTDTLayer";
		var lt = this.format;
		var resStart;
		var resLength;
		if(lt=="vec"){
				resStart = 0;
				resLength = 17;
				levelOffset = 1;
			}
			else if(lt=="img"){
				resStart = 0;
				resLength = 17;
				levelOffset = 1;
			}
			else if(lt=="ter"){
				resStart = 0;
				resLength = 13;
				levelOffset = 1;
			}
        var resolutions = [];
        var scales = [1/295829355.45,1/147914677.73,1/73957338.86,1/36978669.43,1/18489334,1/9244667.36,1/4622333.68,1/2311166.84,1/1155583.42,
			1/577791.71,1/288895.85,1/144447.93,1/72223.96,1/36111.98,1/18055.99,1/9028.00,1/4514.00,1/2257.00,1/1128.50,1/564.25];//,
        for(var i=resStart;i<=resLength;i++){
            resolutions.push(WeatherMap.Util.getResolutionFromScaleDpi(1/scales[i],96,"degree"));
        }

        options = WeatherMap.Util.extend({
            maxExtent: new WeatherMap.Bounds(
                -180,
                -90,
                180,
                90
            ),

            tileOrigin:new WeatherMap.LonLat(-180,90),
            resolutions:resolutions
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
    getTileUrl:function(xyz){
        var me = this;
        url = me.url;
        var x = xyz.x;
        var y = xyz.y;

        var z = xyz.z+this.levelOffset;
		var lt = this.format;
//		if(this.isLabel){
//				if(lt=="vec")lt = "cva";
//				if(lt=="img")lt = "cia";
//				if(lt=="ter")lt = "cta";
//			}
        url = WeatherMap.String.format(url, {
            subdomain:Math.round(Math.random() * 7).toString(),
            col: y,
            row: x,
            level: z,
            layerType:lt,
			proj:"c"
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
    },

    setFormat: function(format){
      this.format = format;
    },

    CLASS_NAME: 'WeatherMap.Layer.TianDiTuLayer'
});
