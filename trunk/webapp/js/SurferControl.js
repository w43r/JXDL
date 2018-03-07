/**
 * SurferControl
 * @author rexer
 * @date   2016-12-08
 */

function SurferControl(container, option) {
	this.$container = $(container);
	this.option = $.extend({
		type: 'OTHER', // 'MCI','PRE'
		fillColor: 'Greens',
		levelsCnt: 5,
		gridXCnt: 300,
		gridYCnt: 300,
		method: 'Kriging', //克里金插值法
		displayStationInfo: false, //站点标注
		displayValueInfo: false, //站号标注
		areaCode: G.User.getArea(),
		minValue: 0,
		maxValue: 0,
		data: ''
	}, option);

	var userBounds = tpl.ext.getUserArea();

	this.option.xMin = userBounds[0] - 0.1;
	this.option.yMin = userBounds[1] - 0.1;
	this.option.xMax = userBounds[2] + 0.1;
	this.option.yMax = userBounds[3] + 0.1;

	// 初始化配色方案
	this.option.fillColors = [];
	for (var k in SurferControl.COLOR_SCHEMA) {
		this.option.fillColors.push(k);
	}
	// FIXME 暂时不做适配 默认全部添加所有自定义样式
	// this.addFillColor({ eleType: ['TEMP', 'WIND', 'RHU', 'MCI', 'PRE'] });

	// 结果缓存
	this.SURFER_RESULTS = {};

	/**
	 * 事件派发
	 */
	var HOOKS = {
		// 成功
		done: function(res) { console.log(res); },
		// 失败
		fail: function(err) { console.error(err); },
		// 准备
		prepare: function() {}
	};
	this.done = function(handler) {
		if (arguments.length === 1 && G.isFunction(handler)) {
			HOOKS.done = handler;
		} else {
			HOOKS.done.apply(this, arguments);
		}
		return this;
	};
	this.fail = function(handler) {
		if (arguments.length === 1 && G.isFunction(handler)) {
			HOOKS.fail = handler;
		} else {
			HOOKS.fail.apply(this, arguments);
		}
		return this;
	};
	this.prepare = function(handler) {
		if (arguments.length === 1 && G.isFunction(handler)) {
			HOOKS.prepare = handler;
		} else {
			HOOKS.prepare.apply(this, arguments);
		}
		return this;
	};
}

/**
 * 创建工具栏
 * @param  {HTMLElement}  container 工具栏容器
 * @param  {Object}   	  [option]  控制选项
 * @return {Object}		  工具栏项目
 */
SurferControl.prototype.toolbar = function(container, option) {
	this.$toolbar = $(container);
	option = option || {};
	var self = this;
	var toolbars = {};

	this.$toolbar.addClass('surfer')
		.find('.surfer-bar.surfercontrol').remove();

	var group_html = '<div class="surfer-bar surfercontrol tpl-toolbar-group"></div>';

	// 添加工具栏项目
	// 导出
	if (option.export !== false) {
		toolbars.export = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">导出</span>')
			.append('<button class="surfer-export tpl-toolbar-item tpl-btn btn-primary" value="image">图片</button>')
			.append('<button class="surfer-export tpl-toolbar-item tpl-btn btn-primary" value="srf">SRF</button>')
			.on('click', '.surfer-export', function(event) {
				event.preventDefault();
				var exportType = this.value;
				var file = self.SURFER_RESULTS[exportType];
				if (!file) {
					G.tip('导出失败，请重试！', false);
					return;
				}
				var filename = file.substr(file.lastIndexOf('/') + 1);
				G.downloading(file, filename);
			});
	}
	// 操作
	if (option.ctrl !== false) {
		// 全屏控制
		var fullScreenCtrl = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">操作</span>')
			.append('<button class="fullScreen tpl-btn btn-primary">全屏</button>')
			.on('click', '.fullScreen', function(event) {
				G.fullScreen(self.$container[0]);
				$(this).blur();
			});

		// 标注控制
		var labelCtrl = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">标注</span>')
			.append('<button class="surfer-labelCtrl station tpl-toolbar-item tpl-btn btn-primary" value="displayStationInfo">站点</button>')
			.append('<button class="surfer-labelCtrl value tpl-toolbar-item tpl-btn btn-primary" value="displayValueInfo">数值</button>')
			.on('click', '.surfer-labelCtrl', function(event) {
				event.preventDefault();
				var $this = $(this);
				$this.toggleClass('active').blur();
				var enabled = $this.hasClass('active'),
					paraKey = $this.val(),
					opt = {};
				opt[paraKey] = enabled;
				self.surfer2(opt);
			});
		// 默认值
		if (this.option.displayStationInfo)
			labelCtrl.find('button.station').addClass('active');
		if (this.option.displayValueInfo)
			labelCtrl.find('button.value').addClass('active');

		toolbars.ctrl = { label: labelCtrl, fullScreen: fullScreenCtrl };
	}
	// 插值方法
	if (option.calc !== false) {
		toolbars.calc = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">插值方法</span>')
			.append(
				'<select class="surfer-calc tpl-toolbar-item">' +
				'<option value="Kriging">克里金插值法</option>' +
				'<option value="InverseDistancePower">反距离加权插值法</option>' +
				'<option value="MinimumCurvature">最小曲率</option>' +
				'<option value="ModifiedShepard">改进谢别德法</option>' +
				'<option value="NaturalNeighbor">自然邻点插值法</option>' +
				'<option value="NearestNeighbor">最近邻点插值法</option>' +
				'<option value="PolynomialRegression">多元回归法</option>' +
				'<option value="RadialBasisFunction">径向基函数法</option>' +
				'<option value="TriangulationLinearInterpolation">线性插值三角网法</option>' +
				'<option value="MovingAverage">移动平均法</option>' +
				'<option value="LocalPolynomial">局部多项式法</option>' +
				'</select>'
			).on('change', '.surfer-calc', function(event) {
				self.surfer2({
					method: this.value
				});
				event.preventDefault();
			});
		toolbars.calc.find('option[value="' + this.option.method + '"]').prop('selected');
	}
	// 配色方案
	if (option.color !== false) {
		toolbars.color = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">配色方案</span>')
			.append('<select class="surfer-color tpl-toolbar-item"></select>');
		var $select = toolbars.color.find('select');
		this.option.fillColors.forEach(function(item) {
			var color = SurferControl.COLOR_SCHEMA[item];
			$('<option></option>')
				.val(item)
				.text(color.name)
				.attr('title', color.name)
				.css({
					background: 'linear-gradient(to right, ' + color.color + ')',
					color: '#fff',
					'text-shadow': '2px 2px 1px #000',
					'border-bottom': '1px solid #e6e6e6'
				})
				.appendTo($select);
		});
		$select.selectpicker({
			width: 'fit',
			dropupAuto: false,
			size: false
		}).selectpicker('val', this.option.fillColor).on('changed.bs.select', function() {
			self.surfer2({ fillColor: this.value });
		});
	}
	// 网格大小
	if (option.grid !== false) {
		toolbars.grid = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">网格大小</span>')
			.append('<label>X(行)</label>')
			.append('<input class="surfer-grid x tpl-toolbar-item" type="number" data-xy="x">')
			.append('<label>Y(列)</label>')
			.append('<input class="surfer-grid y tpl-toolbar-item" type="number" data-xy="y">')
			.on('change', '.surfer-grid', function(event) {
				event.preventDefault();
				var xy = $(this).attr('data-xy'),
					opt = {};
				opt[xy] = this.value;
				self.surfer2(opt);
			});
		toolbars.grid.find('input.x').val(this.option.gridXCnt);
		toolbars.grid.find('input.y').val(this.option.gridYCnt);
	}
	// 等值线分段
	if (option.contour !== false) {
		toolbars.contour = $(group_html).appendTo(this.$toolbar)
			.append('<span class="tpl-toolbar-title">等值线分段</span>')
			.append('<input class="surfer-contour tpl-toolbar-item" type="number">')
			.on('change', '.surfer-contour', function(event) {
				event.preventDefault();
				self.surfer2({
					levelsCnt: this.value
				});
			});
		toolbars.contour.find('input').val(this.option.levelsCnt);
	}


	this.toolbar = toolbars;

	return toolbars;
};

/**
 * 增加配色方案
 * @param  {Object|String}   para 要素类型
 */
SurferControl.prototype.addFillColor = function(para) {
	var colors = [];
	// 处理参数
	if (!para) return;
	if (typeof para === 'string' || G.isPretty(para)) {
		colors = colors.concat(para);
	}
	if (typeof(para.eleType) === 'string' || G.isPretty(para.eleType)) {
		[].concat(para.eleType).forEach(function(type) {
			switch (type) {
				case 'TEMP':
					colors.push('TMP1', 'TMP25to9', 'TMP23to4And11to12', 'TMP212to2');
					return;
				case 'WIND':
					colors.push('WIND');
					return;
				case 'RHU':
					colors.push('RHU');
					return;
				case 'MCI':
					colors.push('MCI');
					return;
				case 'PRE':
					colors.push('PRE');
					return;
			}
		});
	}
	if (typeof(para.color) === 'string' || G.isPretty(para.color)) {
		colors = colors.concat(para.color);
	}
	// 添加至列表
	var fillColors = [];
	colors.forEach(function(color) {
		var text = SurferControl.FILL_COLORS_CUSTOM[color];
		if (text) {
			fillColors.push({ value: color, text: text, custom: true });
		}
	});
	// 插入前置
	this.option.fillColors = fillColors.concat(this.option.fillColors);
	return fillColors;
};

/**
 * 回调方式
 * @param  {[type]}   option [description]
 * @return {[type]}          [description]
 */
SurferControl.prototype.surfer2 = function(option) {
	this.prepare()
		.surfer(option)
		.then(
			this.done.bind(this),
			this.fail.bind(this)
		);
};

/**
 * 异步请求Surfer出图
 * @param  {Object}   option 参数
 * @return {Deferred}
 */
SurferControl.prototype.surfer = function(option) {
	var defer = $.Deferred();
	if (option) $.extend(this.option, option);
	if (!this.option.data) {
		defer.reject(new Error('数据无效'));
		return defer.promise();
	}
	var self = this;

	// 处理参数
	var para = $.extend({}, this.option);
	// 检验fillColor是否有效
	var colorKey = para.fillColor.replace(/.clr/, ''); //兼容写法
	var color = SurferControl.COLOR_SCHEMA[colorKey];
	if (color) {
		if (color.custom) {
			para.type = color.value;
			para.fillColor = SurferControl.COLOR_SCHEMA.Greens.value;
		} else {
			para.type = 'OTHER';
		}
	} else {
		defer.reject(new Error('配色方案无效'));
		return defer.promise();
	}
	//移除无效参数
	delete para.fillColors;

	$.post(G.URL.getSurferService() + 'contour', G.paramize(para), function(res) {
		if (!$.isArray(res) || res.length < 2 || !res[0]) {
			defer.reject(new Error('No Content'));
			return;
		}
		var host = G.URL.getSurferHost();
		var image = host + res[0],
			srf = host + res[1];
		$.get(image).done(function() {
			self.SURFER_RESULTS = {
				image: image,
				srf: srf
			};
			defer.resolve(image, srf);
		}).fail(function() {
			defer.reject(arguments[2]);
		});
	}).fail(function() {
		defer.reject(arguments[2]);
	});

	return defer.promise();
};

/**
 * 处理数据
 * 添加站点信息，转成Surfer所需格式
 * @param  {Array}   data   [description]
 * @param  {Object}   option [description]
 * @return {Deferred}
 */
SurferControl.prototype.dealWiz = function(data, option) {
	var defer = $.Deferred();
	if (!G.isPretty(data)) {
		defer.reject(new Error('数据无效'));
		return defer.promise();
	}
	if (!option) option = {};
	// 键值
	var stationCodeKey = option.stationCode || 'station_Id_C',
		stationNameKey = option.stationName || 'station_Name',
		valueKey = option.value || 'value',
		latKey = option.lat || 'lat',
		lonKey = option.lon || 'lon';

	tpl.ext.loadStation(function(stations) {
		function getStation(value) {
			for (var i = stations.length; i--;) {
				var item = stations[i];
				if (item[stationCodeKey] === value) {
					stations.splice(i, 1);
					return item;
				}
			}
			return null;
		}

		var results = [];
		var minValue = maxValue = Number(data[0][valueKey].toFixed(1));
		data.forEach(function(item) {
			var stationCode = item[stationCodeKey];
			var value = item[valueKey];
			var station = getStation(stationCode);
			if (station && value != null) {
				value = Number(value.toFixed(1)); // 保留一位小数
				var stationName = station[stationNameKey],
					lon = station[lonKey],
					lat = station[latKey];
				results.push([value, stationCode, stationName, lon, lat].join('\t'));

				if (minValue > value) minValue = value;
				if (maxValue < value) maxValue = value;
			}
		});
		// 标记解决
		defer.resolve({
			data: results.join('\n'),
			minValue: minValue,
			maxValue: maxValue
		});
	});

	return defer.promise();
};

/**
 * 展示结果图片
 * @author rexer
 * @param  {URL}   url
 */
SurferControl.prototype.display = function(url) {
	url = url || this.SURFER_RESULTS.image;
	this.$container.empty().append(
		'<div class="full center"><img id="surfer-result" class="h img-thumbnail img-responsive" src="' + url + '"></div>'
	);
};

SurferControl.getTempFillColor = function(startMonth, endMonth) {
	if (startMonth >= 5 && endMonth <= 9) return 'TMP25to9';
	else if (startMonth >= 3 && endMonth <= 4 || (startMonth >= 11 && endMonth <= 12)) return 'TMP23to4And11to12';
	else if (startMonth === 12 || (startMonth <= 1 && startMonth <= 2) && endMonth <= 2) return 'TMP212to2';
	else return 'TMP1';
}

/**
 * 配色方案
 * @type {Object}
 */
SurferControl.COLOR_SCHEMA = {
	"TMP1": {
		"value": "TMP1",
		"name": "气温",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ffff00,#ff00ff,#800040,#ff0000"
	},
	"TMP25to9": {
		"value": "TMP25to9",
		"name": "气温5-9月",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040,#ff0000"
	},
	"TMP23to4And11to12": {
		"value": "TMP23to4And11to12",
		"name": "气温3~4月、11~12月",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040,#ff0000"
	},
	"TMP212to2": {
		"value": "TMP212to2",
		"name": "气温12~2月",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040,#ff0000"
	},
	"RHU": {
		"value": "RHU",
		"name": "相对湿度",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040"
	},
	"WIND": {
		"value": "WIND",
		"name": "风",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040"
	},
	"PRE": {
		"value": "PRE",
		"name": "降水",
		"custom": true,
		"color": "#a6f28f,#3dba3d,#61b8ff,#0000ff,#ff00ff,#800040"
	},
	"MCI": {
		"value": "MCI",
		"name": "干旱",
		"custom": true,
		"color": "#700016,#fe0000,#fe9533,#ffff8b"
	},
	"Greens": {
		"value": "Greens.clr",
		"name": "Greens",
		"custom": false,
		"color": "rgb(229,254,250),rgb(198,230,208),rgb(173,208,88),rgb(0,153,51)"
	},
	"AngledBlack": {
		"value": "AngledBlack.clr",
		"name": "AngledBlack",
		"custom": false,
		"color": "rgb(0,0,0),rgb(25,25,25),rgb(51,51,51),rgb(77,77,77),rgb(102,102,102),rgb(128,128,128),rgb(153,153,153),rgb(179,179,179),rgb(204,204,204),rgb(230,230,230),rgb(51,51,51),rgb(51,51,51),rgb(51,51,51),rgb(77,77,77),rgb(102,102,102),rgb(128,128,128),rgb(153,153,153),rgb(179,179,179),rgb(204,204,204),rgb(230,230,230),rgb(255,255,255)"
	},
	"BluSteel": {
		"value": "BluSteel.clr",
		"name": "BluSteel",
		"custom": false,
		"color": "rgb(0,0,0),rgb(204,204,255),rgb(153,153,153),rgb(204,204,204),rgb(230,230,230)"
	},
	"BrownBlue": {
		"value": "BrownBlue.clr",
		"name": "BrownBlue",
		"custom": false,
		"color": "rgb(145,79,50),rgb(198,154,107),rgb(249,220,195),rgb(236,249,252),rgb(142,214,239),rgb(94,179,227),rgb(47,104,179)"
	},
	"BrownYellow": {
		"value": "BrownYellow.clr",
		"name": "BrownYellow",
		"custom": false,
		"color": "rgb(88,50,16),rgb(173,104,79),rgb(239,183,123),rgb(255,204,153),rgb(255,242,170),rgb(255,255,192),rgb(255,255,227)"
	},
	"BYWaves": {
		"value": "BYWaves.clr",
		"name": "BYWaves",
		"custom": false,
		"color": "rgb(102,102,255),rgb(255,255,0),rgb(102,102,255),rgb(255,255,0),rgb(102,102,204),rgb(255,255,0),rgb(102,51,0)"
	},
	"Carnival": {
		"value": "Carnival.clr",
		"name": "Carnival",
		"custom": false,
		"color": "rgb(78,218,146),rgb(47,120,194),rgb(218,48,185),rgb(253,3,47),rgb(205,165,47),rgb(205,218,176),rgb(44,218,47),rgb(205,218,18),rgb(70,218,47),rgb(205,172,47),rgb(205,218,47),rgb(47,213,141),rgb(205,94,47),rgb(198,59,162),rgb(205,218,59),rgb(52,205,247),rgb(71,5,47)"
	},
	"ChromaDepth": {
		"value": "ChromaDepth.clr",
		"name": "ChromaDepth",
		"custom": false,
		"color": "rgb(0,0,0),rgb(0,0,0),rgb(0,0,136),rgb(0,0,220),rgb(0,136,136),rgb(0,220,220),rgb(0,136,0),rgb(0,220,0),rgb(136,136,0),rgb(220,220,0),rgb(136,0,0),rgb(220,0,0),rgb(136,0,136),rgb(216,0,216)"
	},
	"Cold": {
		"value": "Cold.clr",
		"name": "Cold",
		"custom": false,
		"color": "rgb(0,80,250),rgb(0,137,245),rgb(29,188,239),rgb(115,224,241),rgb(183,244,247),rgb(214,251,252),rgb(219,255,253),rgb(229,254,250),rgb(248,250,234),rgb(230,230,230),rgb(248,250,234),rgb(229,254,250),rgb(219,255,253),rgb(214,251,252),rgb(183,244,247),rgb(115,224,241),rgb(29,188,239),rgb(0,137,245),rgb(0,80,250)"
	},
	"Colors1": {
		"value": "Colors1.clr",
		"name": "Colors1",
		"custom": false,
		"color": "rgb(179,179,179),rgb(0,0,255),rgb(0,255,0),rgb(255,0,0),rgb(255,0,255),rgb(153,0,204),rgb(255,102,0),rgb(255,153,204),rgb(204,204,255),rgb(0,204,255)"
	},
	"Colors2": {
		"value": "Colors2.clr",
		"name": "Colors2",
		"custom": false,
		"color": "rgb(255,255,204),rgb(0,0,255),rgb(0,255,0),rgb(255,255,0),rgb(255,0,0),rgb(255,0,255),rgb(153,0,204),rgb(255,102,0),rgb(255,153,204),rgb(153,255,153),rgb(204,153,51)"
	},
	"CottonCandy": {
		"value": "CottonCandy.clr",
		"name": "CottonCandy",
		"custom": false,
		"color": "rgb(52,209,165),rgb(113,200,164),rgb(209,189,127),rgb(101,186,113),rgb(216,128,113),rgb(216,209,188),rgb(75,209,113),rgb(216,209,154),rgb(225,209,113),rgb(216,120,113),rgb(216,209,113),rgb(113,204,240),rgb(216,107,113),rgb(222,145,179),rgb(216,209,244),rgb(196,216,129),rgb(133,10,113)"
	},
	"CyanBands": {
		"value": "CyanBands.clr",
		"name": "CyanBands",
		"custom": false,
		"color": "rgb(0,0,0),rgb(0,0,51),rgb(0,0,102),rgb(0,0,153),rgb(0,0,204),rgb(0,0,255),rgb(0,51,0),rgb(0,51,51),rgb(0,51,102),rgb(0,51,153),rgb(0,51,204),rgb(0,51,255),rgb(0,102,0),rgb(0,102,51),rgb(0,102,102),rgb(0,102,153),rgb(0,102,204),rgb(0,102,255),rgb(0,153,0),rgb(0,153,51),rgb(0,153,102),rgb(0,153,153),rgb(0,153,204),rgb(0,153,255),rgb(0,204,0),rgb(0,204,51),rgb(0,204,102),rgb(0,204,153),rgb(0,204,204),rgb(0,204,255),rgb(0,255,0),rgb(0,255,51),rgb(0,255,102),rgb(0,255,153),rgb(0,255,204),rgb(0,255,255),rgb(51,0,0),rgb(51,0,51),rgb(51,0,102),rgb(51,0,153),rgb(51,0,204),rgb(51,0,255),rgb(51,51,0),rgb(51,51,51),rgb(51,51,102),rgb(51,51,153),rgb(51,51,204),rgb(51,51,255),rgb(51,102,0),rgb(51,102,51),rgb(51,102,102),rgb(51,102,153),rgb(51,102,204),rgb(51,102,255),rgb(51,153,0),rgb(51,153,51),rgb(51,153,102),rgb(51,153,153),rgb(51,153,204),rgb(51,153,255),rgb(51,204,0),rgb(51,204,51),rgb(51,204,102),rgb(51,204,153),rgb(51,204,204),rgb(51,204,255),rgb(51,255,0),rgb(51,255,51),rgb(51,255,102),rgb(51,255,153),rgb(51,255,204),rgb(51,255,255),rgb(102,0,0),rgb(102,0,51),rgb(102,0,102),rgb(102,0,153),rgb(102,0,204),rgb(102,0,255),rgb(102,51,0),rgb(102,51,51),rgb(102,51,102),rgb(102,51,153),rgb(102,51,204),rgb(102,51,255),rgb(102,102,0),rgb(102,102,51),rgb(102,102,102),rgb(102,102,153),rgb(102,102,204),rgb(102,102,255),rgb(102,153,0),rgb(102,153,51),rgb(102,153,102),rgb(102,153,153),rgb(102,153,204),rgb(102,153,255),rgb(102,204,0),rgb(102,204,51),rgb(102,204,102),rgb(102,204,153),rgb(102,204,204),rgb(102,204,255),rgb(102,255,0),rgb(102,255,51),rgb(102,255,102),rgb(102,255,153),rgb(102,255,204),rgb(102,255,255),rgb(153,0,0),rgb(153,0,51),rgb(153,0,102),rgb(153,0,153),rgb(153,0,204),rgb(153,0,255),rgb(153,51,0),rgb(153,51,51),rgb(153,51,102),rgb(153,51,153),rgb(153,51,204),rgb(153,51,255),rgb(153,102,0),rgb(153,102,51),rgb(153,102,102),rgb(153,102,153),rgb(153,102,204),rgb(153,102,255),rgb(153,153,0),rgb(153,153,51),rgb(153,153,102),rgb(153,153,153),rgb(153,153,204),rgb(153,153,255),rgb(153,204,0),rgb(153,204,51),rgb(153,204,102),rgb(153,204,153),rgb(153,204,204),rgb(153,204,255),rgb(153,255,0),rgb(153,255,51),rgb(153,255,102),rgb(153,255,153),rgb(153,255,204),rgb(153,255,255),rgb(204,0,0),rgb(204,0,51),rgb(204,0,102),rgb(204,0,153),rgb(204,0,204),rgb(204,0,255),rgb(204,51,0),rgb(204,51,51),rgb(204,51,102),rgb(204,51,153),rgb(204,51,204),rgb(204,51,255),rgb(204,102,0),rgb(204,102,51),rgb(204,102,102),rgb(204,102,153),rgb(204,102,204),rgb(204,102,255),rgb(204,153,0),rgb(204,153,51),rgb(204,153,102),rgb(204,153,153),rgb(204,153,204),rgb(204,153,255),rgb(204,204,0),rgb(204,204,51),rgb(204,204,102),rgb(204,204,153),rgb(204,204,204),rgb(204,204,255),rgb(204,255,0),rgb(204,255,51),rgb(204,255,102),rgb(204,255,153),rgb(204,255,204),rgb(204,255,255),rgb(255,0,0),rgb(255,0,51),rgb(255,0,102),rgb(255,0,153),rgb(255,0,204),rgb(255,0,255),rgb(255,51,0),rgb(255,51,51),rgb(255,51,102),rgb(255,51,153),rgb(255,51,204),rgb(255,51,255),rgb(255,102,0),rgb(255,102,51),rgb(255,102,102),rgb(255,102,153),rgb(255,102,204),rgb(255,102,255),rgb(255,153,0),rgb(255,153,51),rgb(255,153,102),rgb(255,153,153),rgb(255,153,204),rgb(255,153,255),rgb(255,204,0),rgb(255,204,51),rgb(255,204,102),rgb(255,204,153),rgb(255,204,204),rgb(255,204,255),rgb(255,255,0),rgb(255,255,51),rgb(255,255,102),rgb(255,255,153),rgb(255,255,204),rgb(255,255,255)"
	},
	"Dirt": {
		"value": "Dirt.clr",
		"name": "Dirt",
		"custom": false,
		"color": "rgb(153,102,51),rgb(230,230,230)"
	},
	"Electric": {
		"value": "Electric.clr",
		"name": "Electric",
		"custom": false,
		"color": "rgb(0,204,255),rgb(153,0,204),rgb(255,255,0),rgb(0,0,255),rgb(0,255,0),rgb(255,0,0),rgb(255,0,0),rgb(204,153,51)"
	},
	"Forest": {
		"value": "Forest.clr",
		"name": "Forest",
		"custom": false,
		"color": "rgb(103,211,187),rgb(57,181,148),rgb(211,251,0),rgb(241,148,57),rgb(42,116,57),rgb(42,211,109),rgb(91,211,57),rgb(42,211,154),rgb(152,211,57),rgb(42,107,57),rgb(42,211,57),rgb(57,3,26),rgb(42,153,57),rgb(61,28,10),rgb(42,211,98),rgb(49,42,8),rgb(224,67,57)"
	},
	"GrassWhite": {
		"value": "GrassWhite.clr",
		"name": "GrassWhite",
		"custom": false,
		"color": "rgb(153,102,51),rgb(0,102,51),rgb(117,193,120),rgb(255,255,255),rgb(153,102,51),rgb(0,102,51),rgb(117,193,120),rgb(255,255,255),rgb(153,102,51),rgb(0,102,51),rgb(117,193,120),rgb(255,255,255),rgb(153,102,51),rgb(0,102,51),rgb(117,193,120),rgb(255,255,255),rgb(153,102,51),rgb(0,102,51),rgb(117,193,120),rgb(255,255,255),rgb(153,102,51)"
	},
	"Grayscale": {
		"value": "Grayscale.clr",
		"name": "Grayscale",
		"custom": false,
		"color": "rgb(0,0,0),rgb(255,255,255)"
	},
	"HighPoints": {
		"value": "HighPoints.clr",
		"name": "HighPoints",
		"custom": false,
		"color": "rgb(0,255,0),rgb(0,255,0),rgb(38,255,0),rgb(76,255,0),rgb(114,255,0),rgb(152,255,0),rgb(190,255,0),rgb(229,255,0),rgb(255,243,0),rgb(255,205,0),rgb(255,167,0),rgb(255,128,0),rgb(255,90,0),rgb(255,52,0),rgb(255,14,0),rgb(230,0,0),rgb(192,0,0),rgb(154,0,0),rgb(115,0,0),rgb(77,0,0),rgb(39,0,0),rgb(0,0,0),rgb(0,0,0)"
	},
	"HighPoints2": {
		"value": "HighPoints2.clr",
		"name": "HighPoints2",
		"custom": false,
		"color": "rgb(0,0,0),rgb(102,102,255),rgb(0,51,153),rgb(51,102,102),rgb(255,255,0),rgb(255,0,0)"
	},
	"Land": {
		"value": "Land.clr",
		"name": "Land",
		"custom": false,
		"color": "rgb(0,255,0),rgb(51,204,51),rgb(153,102,51),rgb(255,255,204),rgb(255,255,255),rgb(204,204,255)"
	},
	"LandArid": {
		"value": "LandArid.clr",
		"name": "LandArid",
		"custom": false,
		"color": "rgb(153,204,102),rgb(255,255,153),rgb(153,102,51),rgb(255,255,204),rgb(255,255,255),rgb(204,204,255)"
	},
	"LandSea": {
		"value": "LandSea.clr",
		"name": "LandSea",
		"custom": false,
		"color": "rgb(0,0,0),rgb(0,51,153),rgb(0,255,255),rgb(102,51,0),rgb(255,255,102)"
	},
	"Midnight": {
		"value": "Midnight.clr",
		"name": "Midnight",
		"custom": false,
		"color": "rgb(155,3,219),rgb(105,248,80),rgb(3,227,215),rgb(6,162,105),rgb(18,7,105),rgb(18,3,148),rgb(3,3,105),rgb(18,3,22),rgb(89,3,105),rgb(18,208,105),rgb(18,3,105),rgb(105,10,224),rgb(18,52,105),rgb(15,87,115),rgb(18,3,66),rgb(226,18,12),rgb(107,72,105)"
	},
	"Mist": {
		"value": "Mist.clr",
		"name": "Mist",
		"custom": false,
		"color": "rgb(165,4,13),rgb(132,233,162),rgb(4,110,5),rgb(61,99,132),rgb(88,166,132),rgb(88,4,199),rgb(5,4,132),rgb(88,4,210),rgb(35,4,132),rgb(88,161,132),rgb(88,4,132),rgb(132,140,250),rgb(88,118,132),rgb(54,76,199),rgb(88,4,87),rgb(122,88,155),rgb(26,251,132)"
	},
	"Pastel1": {
		"value": "Pastel1.clr",
		"name": "Pastel1",
		"custom": false,
		"color": "rgb(230,230,230),rgb(204,204,255),rgb(153,204,204),rgb(204,255,204),rgb(255,255,204),rgb(255,204,204),rgb(255,255,255),rgb(255,255,255)"
	},
	"Pastel2": {
		"value": "Pastel2.clr",
		"name": "Pastel2",
		"custom": false,
		"color": "rgb(255,255,192),rgb(151,195,157),rgb(123,220,255),rgb(142,123,167),rgb(239,88,164)"
	},
	"PinkPea": {
		"value": "PinkPea.clr",
		"name": "PinkPea",
		"custom": false,
		"color": "rgb(242,113,120),rgb(239,176,192),rgb(186,204,204),rgb(200,215,133),rgb(173,208,88)"
	},
	"PurpleBands": {
		"value": "PurpleBands.clr",
		"name": "PurpleBands",
		"custom": false,
		"color": "rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255),rgb(153,0,204),rgb(0,0,102),rgb(204,204,255)"
	},
	"PurpleGreen": {
		"value": "PurpleGreen.clr",
		"name": "PurpleGreen",
		"custom": false,
		"color": "rgb(88,82,116),rgb(142,123,167),rgb(195,195,224),rgb(249,249,255),rgb(198,230,208),rgb(151,195,157),rgb(57,98,54)"
	},
	"Rainbow": {
		"value": "Rainbow.clr",
		"name": "Rainbow",
		"custom": false,
		"color": "rgb(153,102,255),rgb(0,0,255),rgb(0,255,0),rgb(255,255,0),rgb(255,102,0),rgb(255,0,0)"
	},
	"Rainbow2": {
		"value": "Rainbow2.clr",
		"name": "Rainbow2",
		"custom": false,
		"color": "rgb(0,0,0),rgb(0,0,255),rgb(0,255,255),rgb(0,153,0),rgb(255,255,0),rgb(255,0,0),rgb(255,255,255),rgb(255,255,255)"
	},
	"RedHot": {
		"value": "RedHot.clr",
		"name": "RedHot",
		"custom": false,
		"color": "rgb(255,0,0),rgb(255,255,0)"
	},
	"RedZebra": {
		"value": "RedZebra.clr",
		"name": "RedZebra",
		"custom": false,
		"color": "rgb(0,0,0),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,0)"
	},
	"Swamp": {
		"value": "Swamp.clr",
		"name": "Swamp",
		"custom": false,
		"color": "rgb(187,164,208),rgb(116,31,183),rgb(164,95,165),rgb(233,226,116),rgb(7,8,116),rgb(7,164,197),rgb(114,164,116),rgb(7,164,1),rgb(58,164,116),rgb(7,106,116),rgb(7,164,116),rgb(116,39,234),rgb(7,127,116),rgb(61,192,231),rgb(7,164,54),rgb(8,7,196),rgb(58,141,116)"
	},
	"Taffy": {
		"value": "Taffy.clr",
		"name": "Taffy",
		"custom": false,
		"color": "rgb(153,153,255),rgb(0,255,0),rgb(255,153,204),rgb(153,153,255),rgb(255,255,255),rgb(102,153,255),rgb(255,153,204),rgb(0,255,0),rgb(102,102,204),rgb(255,153,204),rgb(255,0,255),rgb(0,204,255),rgb(255,255,0),rgb(230,230,230),rgb(255,0,255),rgb(0,255,255),rgb(255,0,255),rgb(255,153,204),rgb(0,255,255),rgb(102,153,255),rgb(0,255,0)"
	},
	"Terrain": {
		"value": "Terrain.clr",
		"name": "Terrain",
		"custom": false,
		"color": "rgb(200,215,133),rgb(171,217,177),rgb(124,196,120),rgb(117,193,120),rgb(175,204,166),rgb(219,208,78),rgb(241,207,14),rgb(242,167,0),rgb(192,159,13),rgb(211,192,112),rgb(240,219,161),rgb(252,236,192),rgb(248,250,234),rgb(229,254,250),rgb(219,255,253),rgb(214,251,252),rgb(183,244,247),rgb(115,224,241),rgb(29,188,239),rgb(0,137,245),rgb(0,80,250)"
	},
	"Terrain2": {
		"value": "Terrain2.clr",
		"name": "Terrain2",
		"custom": false,
		"color": "rgb(153,0,0),rgb(171,217,177),rgb(124,196,120),rgb(117,193,120),rgb(175,204,166),rgb(219,208,78),rgb(241,207,14),rgb(102,153,255),rgb(192,159,13),rgb(211,192,112),rgb(240,219,161),rgb(252,236,192),rgb(248,250,234),rgb(200,215,133),rgb(255,153,153),rgb(255,255,153),rgb(183,244,247),rgb(115,224,241),rgb(29,188,239),rgb(0,137,245),rgb(0,80,250)"
	},
	"TieDie": {
		"value": "TieDie.clr",
		"name": "TieDie",
		"custom": false,
		"color": "rgb(255,255,255),rgb(0,0,255),rgb(0,255,255),rgb(0,255,0),rgb(255,255,0),rgb(255,0,0),rgb(255,0,255),rgb(153,0,204),rgb(255,102,0),rgb(255,153,204),rgb(255,255,255),rgb(0,0,255),rgb(0,255,255),rgb(0,255,0),rgb(255,255,0),rgb(255,0,0),rgb(255,0,255),rgb(153,0,204),rgb(255,102,0),rgb(255,153,204),rgb(255,255,255)"
	},
	"USflag": {
		"value": "USflag.clr",
		"name": "USflag",
		"custom": false,
		"color": "rgb(0,51,153),rgb(0,0,255),rgb(0,0,255),rgb(0,0,255),rgb(0,0,255),rgb(102,153,255),rgb(255,255,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(255,255,255),rgb(255,0,0)"
	},
	"USzebra": {
		"value": "USzebra.clr",
		"name": "USzebra",
		"custom": false,
		"color": "rgb(0,0,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,255),rgb(255,255,255),rgb(255,0,0),rgb(255,255,255),rgb(0,0,255)"
	},
	"Zebra": {
		"value": "Zebra.clr",
		"name": "Zebra",
		"custom": false,
		"color": "rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0),rgb(255,255,255),rgb(0,0,0)"
	}
};
