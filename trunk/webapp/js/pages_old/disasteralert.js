/**
 * 气象灾害预警
 * @author rexer
 * @date   2016-09-28
 */

var corePage;

function run() {
	corePage = new tpl('气象灾害预警').ready(function() {
		$.getJSON('data/dataschema/disasteralert.json', function(json) {
			corePage.WarnInfo = noticeWarnHandle(); //预警信息
			corePage.FieldMap = json; //字典
			corePage.Alert = new tpl.Plugin.alert('#mainContent');
			corePage.menu([{ text: '区域预警情况', value: 'menu_1', handler: initPage }]);
		});
	});
}

/**
 * 标记消息处理
 * 预警信息按时间降序
 * @return {Array}   预警信息
 */
function noticeWarnHandle() {
	var STORAGE_KEY = 'WARNING_NOTICE',
		NOTICE = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
	if (!NOTICE.visited) { //关闭已读消息
		NOTICE.visited = true;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(NOTICE));
		G.BModule.notify(5, 0);
	}
	// 预警信息时间降序
	var warnInfo = NOTICE.data;
	if (warnInfo && warnInfo.length > 0) {
		var temp;
		for (var i = 0; i < warnInfo.length; i++) {
			for (var j = 0; j < warnInfo.length - i - 1; j++) {
				if (moment(warnInfo[j].ForecastDate).isBefore(warnInfo[j + 1].ForecastDate)) {
					temp = warnInfo[j];
					warnInfo[j] = warnInfo[j + 1];
					warnInfo[j + 1] = temp;
				}
			}
		}
		return warnInfo;
	}
	return [];
}

/**
 * 列表页面生成
 */
function initPage() {
	corePage.$menu.find('.tpl-menu-item').html('区域预警情况');
	corePage.clear();
	corePage.$page.empty();
	if (corePage.WarnInfo.length == 0) {
		try{
			return corePage.Alert.show('该时段（条件）没有统计结果...');
		}catch(e){
			console.error(new Error('该时段（条件）没有统计结果...'));
		}
	}

	var $section = $('<section id="warn-notice" class="notice-collapse w"></section>').appendTo(corePage.$page);
	var createAlert = function(title, value) {
		return '<div class="warn-notice-content"><span class="warn-notice-title">' + title + '</span>' + '<span class="warn-noticec-value">' + value + '</span></div>'
	};
	//预警列表生成
	corePage.WarnInfo.forEach(function(item) {
		var $alert = $('<div class="warn-notice animated rotateInDownLeft"></div>')
			.appendTo($section)
			.append('<i class="warn-notice-time">' + item.ForecastDate + '</i>')
			.append('<i class="warn-notice-dot"></i>');

		var content = [];
		// 类型字段
		content.push('<div class="warn-notice-type">' + corePage.FieldMap.field[item.type] + '</div>');
		// 固定顺序字段
		corePage.FieldMap.sorts.forEach(function(key) {
			if (item.hasOwnProperty(key))
				content.push(createAlert(corePage.FieldMap.field[key], item[key]));
		});
		// 余下字段
		var field_expr = new RegExp(corePage.FieldMap.hides.concat(corePage.FieldMap.sorts).join('|'));
		for (var key in item) {
			if (field_expr.test(key)) continue;
			content.push(createAlert(corePage.FieldMap.field[key], item[key]));
		}
		$alert.append(content.join('')).data('WARNING_NOTICE', item).click(function(event) {
			event.preventDefault();
			var para = $(this).data('WARNING_NOTICE');
			tpl.ext.query('DisasterAlertService/getStationAlert', {
				type: para.type,
				ForecastDate: para.ForecastDate
			}, function(data) {
				initDetailPage(data, para.type);
			});
		});
	});
}

/**
 * 详情页面生成
 */
function initDetailPage(warndata, warntype) {
	var title = '单站预警 - ' + corePage.FieldMap.field[warntype];
	/*菜单*/
	corePage.$menu.find('.tpl-menu-item').html(title);
	/*装载页面*/
	var htmlPage = `
<div id="resultContent" class="resultContent tpl-content" allowFullScreen="true" style="width: calc(100% - 122px);">
    <div class="resultPanel"></div>
</div>
<div id="toolbarContent" class="tpl-toolbar">
      <div class="toolbar-title nonselect">
          <i class="icon fa fa-wrench" aria-hidden="true"></i>
          <span>工具栏</span>
      </div>
      <div class="toolbar"></div>
  </div>
	`;
	corePage.page(htmlPage);

	if (warndata.length == 0) return corePage.Alert.show('该时段（条件）没有统计结果...');

	/**
	 * 工具栏配置
	 * @type {Array}
	 */
	var toolbarConfig = [{ //返回列表页
		items: [{ text: '<i class="fa fa-undo" aria-hidden="true"></i>', color: 'info' }],
		handler: initPage
	}, { // 展示方式切换
		title: '展示',
		items: [
			{ text: '表格', attr: { 'data-type': 'grid' } },
			{ text: '分布图', attr: { 'data-type': 'map' } }
		],
		handler: function(event) {
			var $this = $(this);
			if ($this.hasClass('active')) return;
			$this.addClass('active').siblings('button').removeClass('active');
			display($this.attr('data-type'));
		}
	}];

	/**
	 * display
	 * @param  {[type]}   displayType [description]
	 * @return {[type]}               [description]
	 */
	var display = function(displayType) {
		if (displayType === 'grid') {
			toolbarConfig[1].items[0].className = 'active';
			delete toolbarConfig[1].items[1].className;
			corePage.toolbar(toolbarConfig.concat(tpl.TOOLBAR.grid));
			corePage.Grid = initGrid(warndata);
		} else if (displayType === 'map') {
			toolbarConfig[1].items[1].className = 'active';
			delete toolbarConfig[1].items[0].className;
			corePage.toolbar(toolbarConfig.concat(tpl.TOOLBAR.map));
			corePage.Map = initMap(warndata, title);
		}
	};

	display('grid');
}

function initGrid(warndata) {
	var cols = []; // 字段列
	var keys = warndata[0];
	for (var key in keys) { // 查询字典获取字段中文名
		cols.push({ title: corePage.FieldMap.field[key], data: key });
	}
	return corePage.grid(cols, warndata);
}

function initMap(warndata, title) {
	// MapControl实例
	var MC = corePage.map({
		title: title,
		labelStyle: {
			style: {
				fontColor: '#000',
				fontSize: '14px'
			}
		},
		dataSchema: {
			code: 'Station_Id_C',
			station: 'Station_Id_C',
			value: 'AvgTmp'
		}
	}, warndata, false);
	// 区域填色图
	var dataSchema = MC.option.dataSchema;
	var featureLayer = new WeatherMap.Layer.Vector('featureLayer', { renderers: ['Canvas'] });
	MC.addLayer(featureLayer);

	$.get(MapControl.defaults.regionXML, function(xml) {
		var features = [];
		warndata.forEach(function(item) {
			var iCode = item[dataSchema.code];
			var value = item[dataSchema.value];
			var area = xml.querySelector('province[stationcode="' + iCode + '"]');
			if (!area) return;
			var areaName = area.getAttribute('name');
			var coordinates = area.querySelector('coordinates').innerHTML.split(';');
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
				regionFeature.attributes.value = value;
				regionFeature.style = { //地图样式
					strokeColor: '#eee',
					strokeWidth: 0.2,
					fillColor: '#FF5722',
					fillOpacity: '0.8'
				};
				features.push(regionFeature);
			});
		});
		featureLayer.addFeatures(features);
	});
	return MC;
}
