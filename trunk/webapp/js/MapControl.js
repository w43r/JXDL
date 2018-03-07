/**
 * MapControl
 * @author rexer
 * @date   2016-07-25
 * @param  {HTMLElement|jQuery|Selector}  container
 * @param  {Object}  opts
 * @constructor
 */
var MapControl = function(container, opts) {
	this.container = $(container)[0];
	if (!(this.container instanceof HTMLElement))
		throw new Error('MapControl, Cannot find container.');
	this.option = $.extend(true, {}, MapControl.defaults, opts);
	this.layerAuthority = null; //遮罩层
	this.layerText = null; //标注层
	this.layerFillRangeColor = null; //等直面
	this.layerContour = null; //等值线
	this.layerISO = null; //服务端插值图层
	this.LegendManager = null; //图例管理
	this.legend = null;
	this.TextFeatureData = null;
	this.isCorrectedText = false; //标注层偏移状态

	var instance;
	this.getInstance = function() {
		return instance;
	};
	this.setInstance = function(para) {
		instance = para;
	};

	// 生成extraStyles
	switch (this.option.meteoType) {
		case 'TEMP':
			this.option.extraStyles = [
				{ type: 'fill', name: '【国标】气温', styles: StyleManager.getStyleByName('tempStyles') },
				{ type: 'fill', name: '【国标】气温5~9月', styles: StyleManager.getStyleByName('temp5to9Styles') },
				{ type: 'fill', name: '【国标】气温3~4或10~11月', styles: StyleManager.getStyleByName('temp3to4or10to11Styles') },
				{ type: 'fill', name: '【国标】气温12月至2月', styles: StyleManager.getStyleByName('temp12to2Styles') },
				{ type: 'fill', name: '【国标】气温距平', styles: StyleManager.getStyleByName('tempAnomaly') }
			];
			break;
		case 'PRE':
			this.option.extraStyles = [
				{ type: 'fill', name: '【国标】1时降水', styles: StyleManager.getStyleByName('rain1hStyles') },
				{ type: 'fill', name: '【国标】3时降水', styles: StyleManager.getStyleByName('rain3hStyles') },
				{ type: 'fill', name: '【国标】6时降水', styles: StyleManager.getStyleByName('rain6hStyles') },
				{ type: 'fill', name: '【国标】12时降水', styles: StyleManager.getStyleByName('rain12hStyles') },
				{ type: 'fill', name: '【国标】24时降水', styles: StyleManager.getStyleByName('rain24hStyles') },
				{ type: 'fill', name: '【国标】48时降水', styles: StyleManager.getStyleByName('rain48hStyles') },
				{ type: 'fill', name: '【国标】日降水过程(夏秋季)', styles: StyleManager.getStyleByName('rainDaySummerAutumnStyles') },
				{ type: 'fill', name: '【国标】日降水过程(冬春季)', styles: StyleManager.getStyleByName('rainDayWinterSpringStyles') },
				{ type: 'fill', name: '【国标】降水距平率', styles: StyleManager.getStyleByName('rainAnomalyRateStyles2') }
			];
			break;
		case 'RHU':
			this.option.extraStyles = [
				{ type: 'fill', name: '【国标】相对湿度', styles: StyleManager.getStyleByName('rhStyles') }
			];
			break;
		case 'WIND':
			this.option.extraStyles = [
				{ type: 'fill', name: '【国标】风速', styles: StyleManager.getStyleByName('windVStyles') },
				{ type: 'fill', name: '【国标】风速等级', styles: StyleManager.getStyleByName('windSStyles') }
			];
			break;
	}
};

/**
 * destroy
 */
MapControl.prototype.destroy = function() {
	this.setInstance(null);
	this.layerAuthority = null;
	this.layerText = null;
	this.TextFeatureData = null;
	$(this.container).find('.map').remove();
	$('.map-bar.mapcontrol').remove();
};

/**
 * init
 */
MapControl.prototype.init = function() {
	this._init(this.option.title, this.option.subtitle);
	var that = this;
	var instance = new WeatherMap.Map('map', {
		controls: [
			new WeatherMap.Control.Navigation(),
			// new WeatherMap.Control.LayerSwitcher({ 'ascending': false }),
			new WeatherMap.Control.MousePosition({ prefix: 'E', separator: ', N', emptyString: '' })
		],
		projection: 'EPSG:4326'
	});
	var lyr = new WeatherMap.Layer.LocalTiledCacheLayer();
	lyr.isBaseLayer = true;
	instance.addLayer(lyr);
	instance.setCenter(new WeatherMap.LonLat(107.75, 30.20), 1);
	instance.zoomToScale(1 / 3000000, true);
	//coordinate
	instance.events.register('moveend', instance, $.proxy(this.updateGridLabel, this));
	instance.events.register('zoomend', instance, function() {
		that.updateGridLabel();
		var shouldCorrect = this.getZoom() <= 1; //需要偏移标注
		if (that.isCorrectedText != shouldCorrect) {
			// 重载标注层
			that.loadTextFeatures(null, shouldCorrect);
		}
	});
	this.setInstance(instance);
	this.updateGridLabel();
	this._addAuthLayer();
	this._toolbar();

	// 根据重庆最南部坐标，调整图例位置
	var extBounds = this.layerAuthority.EXTBOUNDS;
	var southLonLat = new WeatherMap.LonLat(extBounds.right, extBounds.bottom)
	setTimeout(function() {
		//长寿向下偏移
		if (G.User.getArea() == '500115') {
			$('#mapLegend').css('bottom', 0);
			return;
		}
		var pxY = $('#map').innerHeight(),
			px = instance.getViewPortPxFromLonLat(southLonLat),
			bottom = pxY - px.y - 4;
		if (bottom > 0 && bottom < pxY / 2) {
			$('#mapLegend').css('bottom', bottom);
		}
	}, 500);
};

/**
 * init body
 * @param   {[type]}   title    [description]
 * @param   {[type]}   subtitle [description]
 * @private
 */
MapControl.prototype._init = function(title, subtitle) {
	$(this.container).html(`
		<div class="map-header">
			<span class="map title">${title || ''}</span>
		</div>
		<div class="map-wrapper">
			<div id="latitude" class="coord nonselect latitude"></div>
			<div id="map" class="map map-fluid">
				<div id="mapLegend" class="map legend"></div>
			</div>
			<div id="longitude" class="coord nonselect longitude"></div>
		</div>
	`);

	this.LegendManager = new LegendManager(document.querySelector('#mapLegend'));

	//remove --> destroy
	$('.map-wrapper').off('remove').on('remove', $.proxy(this.destroy, this));
};

/**
 * 工具栏
 * @private
 */
MapControl.prototype._toolbar = function() {
	var that = this;
	var instance = this.getInstance();
	var group_html = '<div class="map-bar mapcontrol tpl-toolbar-group"></div>';
	// 标注
	var $tips = $(group_html).appendTo('.toolbar')
		.append('<span class="tpl-toolbar-title">标注</span>')
		.append('<button value="text" class="map-text tpl-btn btn-primary">站名</button>')
		.append('<button value="value" class="map-text tpl-btn btn-primary">数值</button>')
		.on('click', '.map-text', function(event) {
			event.preventDefault();
			$(this).toggleClass('active').blur();
			var values = [];
			$tips.find('.map-text.active').each(function() {
				values.push($(this).attr('value'));
			});
			that.updateTextLayerStyle(values.join(''));
		});
	// 操作
	var $ctrls = this.$ctrls = $(group_html).appendTo('.toolbar')
		.append('<span class="tpl-toolbar-title">操作</span>')
		.append('<button value="reset" class="map-ctrl tpl-btn btn-primary">全图</button>')
		.append('<button class="fullScreen tpl-btn btn-primary">全屏</button>')
		.on('click', '.map-ctrl', function(event) {
			if (that.layerAuthority && that.layerAuthority.EXTBOUNDS) {
				instance.zoomToExtent(that.layerAuthority.EXTBOUNDS);
			} else {
				instance.setCenter(new WeatherMap.LonLat(107.75, 30.20), 1);
				instance.zoomToScale(1 / 3000000, true);
			}
			$(this).blur();
		}).on('click', '.fullScreen', function(event) {
			G.fullScreen(that.container);
			$(this).blur();
		});
};

/**
 * 更新经纬网格label
 */
MapControl.prototype.updateGridLabel = function() {
	var bounds = this.getInstance().getExtent();
	if (!bounds) return;
	var XStart = bounds.left,
		XEnd = bounds.right,
		YStart = bounds.bottom,
		YEnd = bounds.top,
		gridXCnt = this.option.grid.x, //网格大小
		gridYCnt = this.option.grid.y, //网格大小
		XValue = XEnd - XStart,
		YValue = YEnd - YStart,
		$x = $('.coord.longitude').empty(),
		$y = $('.coord.latitude').empty(),
		i;

	for (i = 0; i < gridXCnt; i++) {
		var text = (XValue / (gridXCnt - 1) * i + XStart).toFixed(1) + 'E';
		$('<i></i>').appendTo($x)
			.append('<div class="symbol"></div>')
			.append('<span>' + text + '</span>');
	}

	for (i = gridYCnt; i--;) {
		var text = (YValue / (gridYCnt - 1) * i + YStart).toFixed(1) + 'N';
		$('<i></i>').appendTo($y)
			.append('<span>' + text + '</span>')
			.append('<div class="symbol"></div>');
	}
};

/**
 * 设置title
 * @param  {[type]}   title    [description]
 * @param  {[type]}   subtitle 可选
 */
MapControl.prototype.setTitle = function(title, subtitle) {
	if (title) this.container.querySelector('.map.title').innerText = title;
	// if (subtitle) this.container.querySelector('.map.subtitle').innerText = subtitle;
};

/**
 * 清空Features
 * @param  {[type]}   lyr [description]
 * @return {[type]}       [description]
 */
MapControl.prototype.clearFeatures = function(lyr) {
	if (lyr && lyr.removeAllFeatures) lyr.removeAllFeatures();
	return lyr;
};

/**
 * 添加图层
 * 在标注图层之下
 * @param  {[type]}   lyr [description]
 */
MapControl.prototype.addLayer = function(lyr) {
	var instance = this.getInstance();
	if ($.isArray(lyr)) instance.addLayers(lyr);
	else instance.addLayer(lyr);
	if (this.layerText && lyr != this.layerText) {
		var index = instance.getNumLayers() - 1;
		instance.setLayerIndex(this.layerText, index);
	}
	if (this.layerAuthority) {
		var index = instance.getNumLayers() - 1;
		instance.setLayerIndex(this.layerAuthority, index);
	}
};

MapControl.prototype.removeLayer = function(lyr) {
	var instance = this.getInstance();
	try {
		instance.removeLayer(lyr);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * 添加遮罩层
 * @private
 */
MapControl.prototype._addAuthLayer = function() {
	var areaCode = G.User.getArea();
	if (G.User.getAuthority().B) areaCode = '500000';
	var userRegion = this.getRegionByAreaCode(areaCode);
	if (!userRegion) return; //查询无边界
	var instance = this.getInstance();
	this.layerAuthority = new WeatherMap.Layer.Vector('layerAuthority', { renderers: ['Canvas'] });
	instance.addLayer(this.layerAuthority);
	var regionLines = userRegion[1]; //边界线
	var regionBounds = userRegion[0].bounds;

	instance.zoomToExtent(regionBounds);

	//外边界
	var outLinearRing = new WeatherMap.Geometry.LinearRing([
		new WeatherMap.Geometry.Point(-180, -90),
		new WeatherMap.Geometry.Point(180, -90),
		new WeatherMap.Geometry.Point(180, 90),
		new WeatherMap.Geometry.Point(-180, 90)
	]);

	var currLines = regionLines.concat(outLinearRing);
	var currRegion = new WeatherMap.Geometry.Polygon(currLines);
	currRegion.calculateBounds();

	var regionFeature = new WeatherMap.Feature.Vector(currRegion);
	regionFeature.style = {
		fill: true,
		fillColor: '#fff',
		stroke: true,
		strokeColor: '#333',
		strokeWidth: 1.5
	};
	this.layerAuthority.addFeatures([regionFeature]);
	this.layerAuthority.EXTBOUNDS = regionBounds;
	// 设置可见性
	// this.layerAuthority.setVisibility(!G.User.isCity());

	return true;
};

/**
 * 获取标注层Style
 * @param  {String}   para  [description]
 * @return {Style}          [description]
 */
MapControl.prototype.getTextLayerStyle = function(para) {
	var hasValue = /value/.test(para);
	var hasText = /text/.test(para);
	var dataSchema = this.option.dataSchema;
	return StyleManager.getStationStyle(hasValue, hasText, this.option.labelStyle);
};

/**
 * 更新标注层Style
 * @param  {[type]}   para [description]
 * @return {[type]}        [description]
 */
MapControl.prototype.updateTextLayerStyle = function(para) {
	this.layerText.renderer.styles = this.getTextLayerStyle(para);
	this.layerText.redraw();
};

/**
 * 加载标注Features
 * @param  {Array}    data       标注数据
 * @param  {Boolean}  shouldCorrect 是否需要偏移
 */
MapControl.prototype.loadTextFeatures = function(data, shouldCorrect) {
	if (data) this.TextFeatureData = data; //缓存数据
	if (!this.TextFeatureData) return;

	if (!this.layerText) {
		this.layerText = new WeatherMap.Layer.Vector('标注层', { renderers: ['Plot'] });
		this.layerText.renderer.styles = this.getTextLayerStyle(this.option.initLabelStyle);
		this.layerText.renderer.plotWidth = 12;
		this.layerText.renderer.plotHeight = 12;
		this.addLayer(this.layerText);
	} else this.layerText.removeAllFeatures();
	this.isCorrectedText = shouldCorrect; //更新标注层偏移状态
	var addTextFeatures = $.proxy(this.addTextFeatures, this);
	if (shouldCorrect) {
		$.getJSON(MapControl.defaults.stationDataURL, addTextFeatures);
	} else {
		tpl.ext.loadStation(addTextFeatures);
	}
};

/**
 * 添加标注Features至地图
 * @param  {Array}   stations 站点数据
 */
MapControl.prototype.addTextFeatures = function(stations) {
	console.time('addTextFeatures');
	var features = [];
	var data = this.TextFeatureData; //数据
	var dataSize = data.length;
	var dataSchema = this.option.dataSchema; //数据schema
	var dataSchemaDefault = MapControl.defaults.dataSchema; //默认schema
	var userAreaCode = G.User.getArea();
	var authority = !G.User.getAuthority().B && !G.User.isCity();

	// 预估国家站+区域站情况
	var dataCompleted = dataSize > 34;

	// 遍历所有站点
	for (var i = 0, l = stations.length; i < l; i++) {
		var station = stations[i],
			stationCode = station[dataSchemaDefault.station],
			areaCode = station[dataSchemaDefault.code],
			stationName = station[dataSchemaDefault.text];

		// 权限过滤站点
		if (authority && areaCode != userAreaCode) {
			continue;
		}

		// 过滤区域站
		if (!dataCompleted && stationCode.substr(0, 1) == 'A') {
			continue;
		}

		var longitude = parseFloat(station[dataSchemaDefault.lon]),
			latitude = parseFloat(station[dataSchemaDefault.lat]),
			point = new WeatherMap.Geometry.Point(longitude, latitude),
			pointVector = new WeatherMap.Feature.Vector(point);

		// 添加属性
		pointVector.attributes['areaCode'] = areaCode;
		pointVector.attributes['stationCode'] = stationCode;
		pointVector.attributes['stationName'] = stationName;

		// 遍历所有数据 添加站点数值
		for (var j = 0; j < dataSize; j++) {
			var item = data[j],
				value = item[dataSchema.value],
				dataStation = item[dataSchema.station];
			if (dataStation == stationCode) {
				pointVector.attributes['value'] = value;
				break;
			}
		}

		features.push(pointVector);
	}
	this.layerText.addFeatures(features);

	console.timeEnd('addTextFeatures');
};

/**
 * 绘制边界线
 */
MapControl.prototype.getBorders = function(style) {
	var borderVectors = [];
	var xml = MapControl.getRegionXML();
	var lines = [];
	var areas = xml.querySelectorAll('province:not([areacode="500000"])');
	if (!areas || areas.length === 0) return [];
	for (var i = 0; i < areas.length; i++) {
		var area = areas[i];
		var coordinatesHTML = area.querySelector('coordinates').innerHTML;
		if (!coordinatesHTML) continue;
		var coordinates = coordinatesHTML.split(';');
		coordinates.forEach(function(coordinate) { //region
			var coords = coordinate.split(' ');
			var pts = [];
			coords.forEach(function(iCoord) {
				var coord = iCoord.split(',');
				var pt = new WeatherMap.Geometry.Point(Number(coord[0]), Number(coord[1]));
				pts.push(pt);
			});
			var line = new WeatherMap.Geometry.LinearRing(pts);
			lines.push(line);
		});
		var geoRegion = new WeatherMap.Geometry.Polygon(lines);
		geoRegion.calculateBounds();
		var vector = new WeatherMap.Feature.Vector(geoRegion);
		vector.style = style;
		borderVectors.push(vector);
	}

	return borderVectors;
};

/**
 * 按站点所在区域据要素值填色
 * 单值填色
 * @param  {Array}   	data 	数据
 * @param  {Function}   render  样式Fn
 */
MapControl.prototype.fillRegionColor = function(data, render, filter, defaultStyle) {
	var featureLayer = new WeatherMap.Layer.Vector('单值填色面', {
		renderers: ['Canvas']
	});
	this.addLayer(featureLayer);
	var dataSchema = this.option.dataSchema;
	if (!filter) filter = [];
	var filterKey = filter[0] || 'areacode',
		filterValue = filter[1] || dataSchema.code;

	var xml = MapControl.getRegionXML();
	var features = [];
	if (defaultStyle) { //默认填充
		var area = xml.querySelector('province[areacode="500000"]');
		var coordinatesHTML = area.querySelector('coordinates').innerHTML;
		if (!coordinatesHTML) return;
		var coordinates = coordinatesHTML.split(';');
		coordinates.forEach(function(coordinate) { //region
			var coords = coordinate.split(' ');
			var pts = [];
			coords.forEach(function(iCoord) {
				var coord = iCoord.split(',');
				var pt = new WeatherMap.Geometry.Point(Number(coord[0]), Number(coord[1]));
				pts.push(pt);
			});
			var line = new WeatherMap.Geometry.LinearRing(pts);
			var geoRegion = new WeatherMap.Geometry.Polygon([line]);
			geoRegion.calculateBounds();
			var regionFeature = new WeatherMap.Feature.Vector(geoRegion);
			regionFeature.style = defaultStyle;
			features.push(regionFeature);
		});
	}
	data.forEach(function(item, dataIndex) {
		var iCode = item[filterValue];
		var iValue = Number(item[dataSchema.value]);
		var area = xml.querySelector('province[' + filterKey + '="' + iCode + '"]');
		if (!area) return;
		var areaName = area.getAttribute('name');
		var coordinatesHTML = area.querySelector('coordinates').innerHTML;
		if (!coordinatesHTML) return;
		var coordinates = coordinatesHTML.split(';');
		coordinates.forEach(function(coordinate) { //region
			var coords = coordinate.split(' ');
			var pts = [];
			coords.forEach(function(iCoord) {
				var coord = iCoord.split(',');
				var pt = new WeatherMap.Geometry.Point(Number(coord[0]), Number(coord[1]));
				pts.push(pt);
			});
			var line = new WeatherMap.Geometry.LinearRing(pts);
			var geoRegion = new WeatherMap.Geometry.Polygon([line]);
			geoRegion.calculateBounds();
			var regionFeature = new WeatherMap.Feature.Vector(geoRegion);
			regionFeature.attributes.areaCode = iCode;
			regionFeature.attributes.areaName = areaName;
			regionFeature.style = render(iValue, dataIndex, item);
			features.push(regionFeature);
		});
	});
	featureLayer.addFeatures(features);
};

/**
 * 等直面|线 图层
 * @param  {Array}   results  插值结果：[等直面,等值线]
 * @param  {Object}  option   样式 图层属性
 * @Deprecated
 */
MapControl.prototype.fillRangeColor = function(results, option) {
	option = option || {};
	var datasetGrid = results[0], //等直面网格
		contours = results[1]; //等值线

	// 等直面图层
	if (this.layerFillRangeColor) {
		this.clearFeatures(this.layerFillRangeColor);
	} else { //渐变样式
		this.layerFillRangeColor = new WeatherMap.Layer.FillRangeColorLayer('等直面');
		this.layerFillRangeColor.isSmooth = true;
		this.layerFillRangeColor.isAlwaySmooth = true;
		this.layerFillRangeColor.isShowGridline = false;
		this.layerFillRangeColor.isShowLabel = false;
		this.layerFillRangeColor.deltaPixel = 1;
		this.addLayer(this.layerFillRangeColor);
	}
	if (option.type === 'fill') { //填充样式
		// this.layerFillRangeColor.alpha = 255;
		this.layerFillRangeColor.isGradient = false;
	}
	if (option.fillRangeColorLayer) { //图层属性
		$.extend(this.layerFillRangeColor, option.fillRangeColorLayer);
	}
	// 样式
	this.layerFillRangeColor.items = option.styles;
	this.layerFillRangeColor.setDatasetGrid(datasetGrid);
	this.layerFillRangeColor.refresh();

	// 边界线
	if (option.border) {
		// 边界图层
		var borderLayer = new WeatherMap.Layer.Vector('边界线', {
			renderers: ['Canvas']
		});
		this.addLayer(borderLayer);

		// 边界样式
		var hasBorderStyle = typeof(option.border) === 'object';
		var borderStyle = $.extend(true, {
			strokeColor: '#000',
			stroke: true,
			fill: false,
			strokeWidth: 1,
			strokeOpacity: 0.5
		}, hasBorderStyle ? option.border : {});
		// 添加边界Feature
		var borderVectors = this.getBorders(borderStyle);
		borderLayer.addFeatures(borderVectors);
	}

	// 不展示等值线
	if (!contours || option.contourLayer === false) {
		// 清除等值线图层
		if (this.layerContour) {
			this.getInstance().removeLayer(this.layerContour);
			this.layerContour = null;
		}
		return;
	}

	// 等值线图层
	if (this.layerContour) {
		this.clearFeatures(this.layerContour);
	} else {
		this.layerContour = new WeatherMap.Layer.Vector('等值线', {
			renderers: ['Contour']
		});
		this.layerContour.renderer.labelField = '值';
		this.layerContour.style = $.extend({
			fontFamily: 'Arial',
			fontColor: '#333',
			strokeColor: '#ff0000',
			strokeWidth: 1.0
		}, option.contourLayer);
		this.addLayer(this.layerContour);
	}
	this.layerContour.renderer.labelField = 'dZValue';
	this.layerContour.addFeatures(contours);
};

/**
 * 获取等值线数组
 * @param  {[type]}   styles [description]
 * @return {[type]}          [description]
 */
MapControl.prototype.getContourValuesByStyle = function(styles) {
	var contours = [];
	for (var i = 0, len = styles.length; i < len; i++) {
		var contour = styles[i],
			a = contour[0],
			b = contour[1];
		if (Math.abs(a) < Infinity) {
			contours.push(a);
		}
		if (Math.abs(b) < Infinity) {
			contours.push(b);
		}
	}
	// 去重排序转数组
	return G.unique(contours).sort(function(a, b) {
		return a > b;
	}).join(' ');
}

/**
 * 展示插值结果
 * @param  {[type]}   features [description]
 */
MapControl.prototype.fillISOLayer = function(features) {
	if (!this.layerISO) {
		this.layerISO = new WeatherMap.Layer.Vector('插值等直面', {
			renderers: ['Canvas']
		});
		this.addLayer(this.layerISO);
	}
	this.layerISO.removeAllFeatures();
	this.layerISO.addFeatures(features);
}

/**
 * 服务端插值
 * @param  {[type]}   features [description]
 * @param  {[type]}   styles   [description]
 * @return {[type]}            [description]
 */
MapControl.prototype.interpolateByServer = function(features, styles) {
	var me = this;
	var defer = new $.Deferred();
	var url = G.URL.getISOService() + this.option.ISOService;
	var dataSchema = this.option.dataSchema;
	var points = [];
	for (var i = 0, len = features.length; i < len; i++) {
		var ptVector = features[i],
			pt = ptVector.geometry;
		points.push({
			x: pt.x,
			y: pt.y,
			z: ptVector.attributes[dataSchema.value]
		});
	}
	$.post(url, G.paramize({
			element: 'z',
			contourValues: this.getContourValuesByStyle(styles),
			datetime: moment().format('YYYY-MM-DD 00:00:00'),
			points: points,
			areaCode: G.User.getArea()
		}))
		.done(function(data) {
			if (!data) {
				defer.reject(false);
				return;
			}
			var polygonFeatures = me.getIsoRegionFeatures(data, styles);
			defer.resolve(polygonFeatures);
		})
		.fail(function(a, b, c) {
			defer.reject(a, b, c);
		});

	return defer.promise();
};

/**
 * 插值结果转Feature
 * @param  {[type]}   datas  [description]
 * @param  {[type]}   styles [description]
 * @return {[type]}          [description]
 */
MapControl.prototype.getIsoRegionFeatures = function(datas, styles) {
	var featureUtility = new FeatureUtilityClass();
	var result = featureUtility.getRecordsetFromJson(datas);
	var features = [];
	var len = result.features.length;
	for (var i = 0; i < len; i++) {
		var feature = result.features[i];
		var fAttributes = feature.attributes;
		fAttributes['FEATUREID'] = i;
		var fromMinValue = true;
		var value = fAttributes['最小值'];
		if (value == undefined || value == -Infinity) {
			value = fAttributes['最大值'];
			fromMinValue = false;
		}
		// 默认配色 值为0|null
		feature.style = StyleManager.plainStyle;
		//value = fAttributes['dMinZValue']; //如果服务端提取等值线采用setInterval，字段是DMINVALUE；反之，如果是setExpectedZValues，字段是dMinZValue
		if (styles != null) {
			value = Number(value);
			var flag = false;
			for (var j = 0; j < styles.length; j++) {
				var minValue = styles[j][0];
				var maxValue = styles[j][1];
				var style = styles[j][2];
				if ((fromMinValue && value >= minValue && value < maxValue) || 　 //因为value是取下限，所以这里是>=minValue
					(!fromMinValue && value > minValue && value <= maxValue)) { //因为value是取上限，所以这里是<=maxValue
					feature.style = style;
					flag = true;
					break;
				}
			}
			if (!flag) {
				console.log('不匹配', value, fAttributes);
			}
		} else console.log('不合法', value, fAttributes);
		features.push(feature);
	}
	return features;
};
/**
 * 插值分析: 等值线 & 等直面
 * @param  {Array}   features  离散点
 * @param  {[Array|undefined]}  dZValues|不加载
 * @return {Array} 等直面,等值线
 * @Deprecated
 */
MapControl.prototype.interpolate = function(features, dZValues) {
	//插值分析
	// datasetGrid = interpolate.run(features, fieldName, bounds, deltaX, deltaY, pointCount, maxRadius);
	var fieldName = this.option.dataSchema.value;
	var pointCount = 6; //搜索点数
	var maxRadius = features.length > 35 ? undefined : 5; //搜索半径
	var clipRegion = this.getRegionByAreaCode('500000')[0]; // 裁剪区域
	var bounds = clipRegion.bounds;
	bounds.right = bounds.right + 1.0;
	bounds.top = bounds.top + 1.0;

	// FIXME 不裁剪结果，避免边缘锯齿，添加遮罩层解决
	var interpolate = new Interpolate();
	var datasetGrid = interpolate.run(features, fieldName, bounds, 0.05, 0.05, pointCount, maxRadius);

	// 不计算等值线
	if (!dZValues) return [datasetGrid, null];

	// 计算等值线
	var Contour = new WeatherMap.Analysis.Contour();
	var resultContours = Contour.analysis(datasetGrid, dZValues, 6, 0.5); //6为平滑度

	var contours = []; //等值线
	resultContours.forEach(function(item) {
		var geoline = item.geoline;
		var dZValue = item.dZValue;
		geoline.calculateBounds();
		var bounds = geoline.bounds;
		if (!bounds) return;
		var feature = new WeatherMap.Feature.Vector(geoline);
		feature.attributes.dZValue = dZValue.toString();
		var width = bounds.right - bounds.left;
		var height = bounds.top - bounds.bottom;
		if (width < 0.05 && height < 0.05) {
			return;
		}
		contours.push(feature);
	});

	return [datasetGrid, contours];
};

/**
 * 将统计数据转化为GeoFeatures
 */
MapControl.prototype.getGeoFromJson = function(data, callback) {
	var dataSchema = this.option.dataSchema;
	var self = this;
	// 加载站点数据
	tpl.ext.loadStation(function(stations) {
		var getStation = function(value) {
			for (var i = stations.length; i--;) {
				var item = stations[i];
				if (item[dataSchema.station] === value) {
					stations.splice(i, 1);
					return item;
				}
			}
			return null;
		};
		var features = [];
		data.forEach(function(item) {
			var stationCode = item[dataSchema.station];
			var value = item[dataSchema.value];
			var station = getStation(stationCode);
			if (station && value != null) {
				features.push(self.toGeoPoint(station, item));
			}
		});
		callback(features);
	});
};

/**
 * 将站点及其数据转换为Vector
 */
MapControl.prototype.toGeoPoint = function(station, attr) {
	var dataSchema = this.option.dataSchema;
	var point = new WeatherMap.Geometry.Point(parseFloat(station[dataSchema.lon]), parseFloat(station[dataSchema.lat]));
	if (!attr) { //无数据
		attr = {};
		attr[dataSchema.value] = 0;
	}
	var pointVector = new WeatherMap.Feature.Vector(point, attr);
	return pointVector;
};

/**
 * 根据区域代码获取该区域GeoRegion
 * @param  {String}   areaCode [description]
 * @return {Array}    [Polygon, LinearRing]
 */
MapControl.prototype.getRegionByAreaCode = function(areaCode) {
	var xml = MapControl.getRegionXML();
	var lines = [];
	var area = xml.querySelector('province[areacode="' + areaCode + '"]');
	if (!area) return;
	var coordinatesHTML = area.querySelector('coordinates').innerHTML;
	if (!coordinatesHTML) return;
	var coordinates = coordinatesHTML.split(';');
	coordinates.forEach(function(coordinate) { //region
		var coords = coordinate.split(' ');
		var pts = [];
		coords.forEach(function(iCoord) {
			var coord = iCoord.split(',');
			var pt = new WeatherMap.Geometry.Point(Number(coord[0]), Number(coord[1]));
			pts.push(pt);
		});
		var line = new WeatherMap.Geometry.LinearRing(pts);
		lines.push(line);
	});
	var geoRegion = new WeatherMap.Geometry.Polygon(lines);
	geoRegion.calculateBounds();
	return [geoRegion, lines];
};

/**
 * 导出成图片
 * @param  {String}  selector  导出元素 optional
 * @param  {String}  filename  导出文件名 optional
 */
MapControl.prototype.exportToImage = function(selector, filename) {
	var ele = selector ? document.querySelector(selector) : this.container.parentElement;
	var name = (filename || this.option.title) + '.png';
	html2canvas(ele).then(function(canvas) {
		if (canvas.msToBlob) {
			var blob = canvas.msToBlob();
			G.download(blob, name);
		} else {
			var toBlob = canvas.toBlob || G.canvas2Blob;
			toBlob.call(canvas, function(blob) {
				G.download(blob, name);
			});
		}
	});
};

/**
 * defaults
 * @type {Object}
 * @const
 */
MapControl.defaults = {
	initLabelStyle: 'none', //标注层初始样式 text,value
	labelStyle: {}, //标注层样式
	meteoType: '', //气象要素类型
	// 地图默认样式：按值计算暖色系配色
	style: { type: 'auto', option: { colorType: 'w' } },
	grid: { x: 7, y: 5 }, //经纬网格大小
	dataSchema: { //数据中字段值说明
		// 站号的字段值
		station: 'station_Id_C',
		// 纬度的字段值
		lat: 'lat',
		// 经度的字段值
		lon: 'lon',
		// 站名的字段值
		text: 'station_Name',
		// 数据的字段值
		value: 'value',
		// 区域代码的字段值
		code: 'areaCode'
	},
	ISOService: 'TextDataService/getIsoRegion', //插值服务
	regionXML: 'data/provinceInfo.xml', //地理数据
	stationDataURL: 'data/stations.maplabel.json' //校正标注站点位置信息
};


/**
 * 获取区域信息XML
 * @export
 *
 * @return {Document} XML文档对象
 */
MapControl.getRegionXML = function() {
	var cacheKey = 'REGION_XML';
	var url = MapControl.defaults.regionXML || 'data/provinceInfo.xml';
	var xml = window.localStorage.getItem(cacheKey); // 尝试读取缓存
	if (xml) {
		// 已有缓存
	} else {
		xml = G.getSync(url, null, { dataType: 'text' }); // 请求xml
		window.localStorage.setItem(cacheKey, xml); // 存入缓存
	}

	try { // 解析XML
		var parser = new DOMParser();
		return parser.parseFromString(xml, 'text/xml');
	} catch (e) {
		console.error(e);
	}
}
