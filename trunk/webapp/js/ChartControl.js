/**
 * [ChartControl description]
 * @author rexer
 * @date   2016-08-01
 * @requires jQuery, Highcharts
 * @constructor
 */
var ChartControl = function(container) {
	this.$container = $(container);
	this.option = null;
	this.toolbar = Object.create(null);

	if (this.$container.length === 0)
		throw new Error('ChartControl, Cannot find container.');

	var instance;
	this.getInstance = function() {
		if (this.$container.data().hasOwnProperty('highchartsChart'))
			this.setInstance(this.$container.highcharts());
		return instance;
	};
	this.setInstance = function(para) {
		instance = para;
	};
	this.init();
};

/**
 * destroy
 */
ChartControl.prototype.destroy = function() {
	this.getInstance().destroy();
	this.setInstance(null);
	$.each(this.toolbar, function() {
		this.remove();
	});
	this.toolbar = null;
};

/**
 * init body
 * @private
 */
ChartControl.prototype.init = function() {
	var that = this;
	var $toolbar = $('.toolbar').addClass('chart');
	var group_html = '<div class="chart-bar chartcontrol tpl-toolbar-group"></div>';
	$toolbar.find('.chart-bar.chartcontrol').remove();
	//呈现方式
	var $types = this.toolbar.$types = $(group_html).appendTo($toolbar);
	$types.append('<span class="tpl-toolbar-title">呈现方式</span>')
		.append('<button class="chart-type tpl-btn btn-primary" value="column">柱状图</button>')
		.append('<button class="chart-type tpl-btn btn-primary" value="spline">曲线图</button>')
		.append('<button class="chart-type tpl-btn btn-primary" value="areaspline">曲面图</button>')
		// .append('<button class="chart-type-check tpl-btn btn-primary" value="3D">3D</button>')
		.on('click', '.chart-type', function(event) { //单选
			event.preventDefault();
			var $this = $(this);
			if ($this.hasClass('active')) event.stopImmediatePropagation();
			else $this.addClass('active').siblings('.chart-type.active').removeClass('active');
		}).on('click', '.chart-type-check', function(event) { //复选
			event.preventDefault();
			$(this).toggleClass('active').blur();
		}).on('click', 'button', function(event) { //更新
			event.preventDefault();
			var is3D = $('.chart-type-check[value="3D"]').hasClass('active');
			var chartType = $('.chart-type.active').val();
			that.updateSetting({ chart: { type: chartType, options3d: { enabled: is3D } } });
		});
	//控制
	var $ctrls = this.toolbar.$ctrls = $(group_html).appendTo($toolbar).append('<span class="tpl-toolbar-title">展示要素</span>');
	$('<button class="chart-plotline tpl-btn btn-primary active">参考线</button>').click(function(event) { //参考常量
		event.preventDefault();
		$(this).toggleClass('active').blur();
		var enabled = $(this).hasClass('active');
		that.togglePlotLines('xy', enabled, this);
	}).appendTo($ctrls);

	$('<button class="chart-label tpl-btn btn-primary">标注</button>').click(function(event) { //标注
		event.preventDefault();
		$(this).toggleClass('active').blur();
		var enabled = $(this).hasClass('active');
		var labels = { dataLabels: { enabled: enabled } };
		that.updateSetting({
			plotOptions: {
				column: labels,
				spline: labels,
				areaspline: labels
			}
		});
	}).appendTo($ctrls);

	$('<button class="tpl-btn btn-primary active">图例</button>').click(function(event) { //图例
		event.preventDefault();
		$(this).toggleClass('active').blur();
		var enabled = $(this).hasClass('active');
		that.updateSetting({ legend: { enabled: enabled } });
	}).appendTo($ctrls);

	var $edit = this.toolbar.$edit = $(group_html).appendTo($toolbar)
		.append('<span class="tpl-toolbar-title">编辑</span>')
		.append('<button class="chart-legend tpl-btn btn-primary">图例配色</button>')
		.on('click', '.chart-legend', function(event) {
			event.preventDefault();
			that.legend();
		});

	var $zoom = this.toolbar.$zoom = $(group_html).appendTo($toolbar)
		.append('<span class="tpl-toolbar-title">缩放</span>')
		.append('<button value="x" class="chart-zoom tpl-btn btn-primary active">X</button>')
		.append('<button value="y" class="chart-zoom tpl-btn btn-primary active">Y</button>')
		.append('<button class="fullScreen tpl-btn btn-primary">全屏</button>')
		.on('click', '.chart-zoom', function(event) {
			event.preventDefault();
			$(this).toggleClass('active').blur();
			var type = [];
			$zoom.find('.chart-zoom').each(function() {
				if ($(this).hasClass('active')) type.push($(this).attr('value'));
			});
			that.updateSetting({ chart: { zoomType: type.length ? type.join('') : 'none' } });
		}).on('click', '.fullScreen', function(event) {
			G.fullScreen(that.$container[0]);
			$(this).blur();
		});

	//最小值 最大值
	var $valueY = this.toolbar.$valueY = $(group_html).appendTo($toolbar)
		.append('<span class="tpl-toolbar-title">数值区间</span>')
		.append('<input type="number" placeHolder="默认" class="tpl-toolbar-item chart-minvalue">')
		.append('<span class="tpl-toolbar-item">至</span>')
		.append('<input type="number" placeHolder="默认" class="tpl-toolbar-item chart-maxvalue">')
		.on('change', '.chart-minvalue', function(event) {
			event.preventDefault();
			var minValue = $(this).val() || null;
			that.updateSetting({ yAxis: { min: minValue } });
		}).on('change', '.chart-maxvalue', function(event) {
			event.preventDefault();
			var maxValue = $(this).val() || null;
			that.updateSetting({ yAxis: { max: maxValue } });
		}).appendTo($toolbar);

	var $stepX = this.toolbar.$stepX = $(group_html).appendTo($toolbar)
		.append('<span class="tpl-toolbar-title">X轴显示间距</span>')
		.append('<input type="number" min="1" placeHolder="默认" class="tpl-toolbar-item">')
		.on('change', 'input', function(event) {
			event.preventDefault();
			var stepNum = Number($(this).val()) || null;
			that.updateSetting({
				xAxis: { labels: { step: stepNum } }
			});
		}).appendTo($toolbar);

	return this;
};

ChartControl.prototype.toolbarSync = function(option) {
	// 呈现方式
	var $type = $('.chart-type[value="' + this.option.chart.type + '"]');
	if ($type) $type.addClass('active');
	// 3D选项
	if (option.chart.options3d.enabled)
		$('.chart-type-check[value="3D"]').addClass('active');

	// 标注
	var $label = this.toolbar.$ctrls.find('.chart-label');
	if (option.plotOptions && option.plotOptions.column && option.plotOptions.column.dataLabels &&
		option.plotOptions.column.dataLabels.enabled) {
		$label.addClass('active');
	} else $label.removeClass('active');
	// 常量
	var $plotline = this.toolbar.$ctrls.find('.chart-plotline');
	if (option.yAxis && option.yAxis.plotLines &&
		$.isArray(option.yAxis.plotLines) && option.yAxis.plotLines.length > 0) {
		$plotline.addClass('active');
	} else $plotline.removeClass('active');
};

/**
 * init highchart
 * @param  {Object}   xAxis  [description]
 * @param  {Object}   yAxis  [description]
 * @param  {Array}   series [description]
 * @param  {Object}   opts   Highcharts参数
 */
ChartControl.prototype.render = function(xAxis, yAxis, series, opts) {
	this.option = $.extend(true, {}, ChartControl.defaults, opts, { xAxis: xAxis, yAxis: yAxis, series: series });
	this.toolbarSync(this.option);
	this.color();
	this.$container.highcharts(this.option);
};

/**
 * update highchart
 * @param  {[type]}   opts [description]
 * @return {[type]}        [description]
 */
ChartControl.prototype.updateSetting = function(opts) {
	$.extend(true, this.option, opts);
	this.toolbarSync(this.option);
	this.color();
	this.getInstance().destroy();
	this.$container.highcharts(this.option);
};

ChartControl.prototype.stylePlotLines = ChartControl.stylePlotLines;

/**
 * 常量开关
 * @param  {String}    xy       x/y轴
 * @param  {Boolean}   enabled  开关
 * @param  {Node}      cacheNode  缓存Dom
 */
ChartControl.prototype.togglePlotLines = function(xy, enabled, cacheNode) {
	var isArray = function(para) {
		return $.isArray(para) && para.length > 0;
	};
	var instance = this.getInstance();
	var $cache = $(cacheNode);
	var hasX = /x/.test(xy);
	var hasY = /y/.test(xy);
	var hasXPls = isArray(this.option.xAxis.plotLines);
	var hasYPls = isArray(this.option.yAxis.plotLines);
	var hasXCache = isArray($cache.data('XPls'));
	var hasYCache = isArray($cache.data('YPls'));
	if (!(hasXPls || hasXCache || hasYPls || hasYCache)) return;
	if (hasXPls && !hasXCache) {
		$cache.data('XPls', this.option.xAxis.plotLines);
	}
	if (hasYPls && !hasYCache) {
		$cache.data('YPls', this.option.yAxis.plotLines);
	}
	var x = $cache.data('XPls');
	var y = $cache.data('YPls');
	if (enabled) {
		var pls = {};
		if (hasX) pls.xAxis = { plotLines: x };
		if (hasY) pls.yAxis = { plotLines: y };
		return this.updateSetting(pls);
	}
	if (hasX && isArray(x)) {
		var pls = [];
		for (var i = x.length; i--;) {
			pls.unshift(x[i]);
			var id = x[i].id;
			instance.xAxis[0].removePlotLine(id);
		}
		$cache.data('XPls', pls);
	}
	if (hasY && isArray(y)) {
		var pls = [];
		for (var i = y.length; i--;) {
			pls.unshift(y[i])
			var id = y[i].id;
			instance.yAxis[0].removePlotLine(id);
		}
		$cache.data('YPls', pls);
	}
};

/**
 * 导出
 * @param  {[type]}   mimeType [description]
 * @param  {[type]}   filename [description]
 */
ChartControl.prototype.export = function(mimeType, filename, opt) {
	if (Highcharts.exporting.supports(mimeType)) {
		var instance = this.getInstance();
		var option = $.extend(true, {
			type: mimeType,
			filename: filename || this.option.title.text
		}, this.option.exportOpt, opt);
		instance.exportChartLocal(option);
	} else {
		throw new Error('ChartControl, Not support the mimeType: ' + mimeType);
	}
};

/**
 * 编辑图例
 */
ChartControl.prototype.legend = function() {
	var that = this;
	var series = this.option.series;
	var content = [];
	series.forEach(function(item, i) {
		var color = document.createElement('div');
		var span = document.createElement('span');
		var input = document.createElement('input');
		color.style.marginBottom = '20px';
		color.className = 'input-group mw100';
		span.className = 'input-group-addon';
		input.className = 'form-control chart-color-picker';
		span.innerText = item.name;
		input.setAttribute('value', item.color);
		input.setAttribute('data-index', i);
		color.appendChild(span);
		color.appendChild(input);
		content.push(color.outerHTML);
	});
	var handler = function($colors) {
		$colors.each(function(index, el) {
			var i = $(this).attr('data-index');
			var color = $(this).attr('value');
			series[i].color = color;
		});
		that.updateSetting({ series: series });
	};
	content = '<div style="min-height:250px;">' + content.join('') + '</div>';
	layer.confirm(content, {
		title: '图例编辑器',
		shift: 4,
		shade: 0,
		success: function(layero, index) {
			$(layero).find('.chart-color-picker').minicolors({
				control: 'wheel',
				letterCase: 'uppercase',
				theme: 'bootstrap',
				swatches: ChartControl.colors,
				change: function(hex, opacity) {
					if (!hex) return;
					this.setAttribute('value', hex);
				}
			});
		}
	}, function(index, layero) {
		handler($(layero).find('.chart-color-picker'));
		layer.close(index);
	});
};

/**
 * 分配颜色
 * @param  {[type]}   series [description]
 * @return {[type]}          [description]
 */
ChartControl.prototype.color = function(series) {
	series = series || this.option.series;
	var N = ChartControl.colors.length;
	series.forEach(function(item, i) {
		item.color = item.color || ChartControl.colors[i % N];
	});
	return series;
};

ChartControl.color = ChartControl.prototype.color;

/**
 * 生成PlotLines样式
 * @return {Array}   plotlines: Highcharts参数
 * @const
 */
ChartControl.stylePlotLines = function() {
	var pls = $.makeArray(arguments);
	return ChartControl.stylePlotLineArr(pls);
};

ChartControl.stylePlotLineArr = function(pls) {
	var plotlines = [];
	var N = ChartControl.plotLineColors.length;
	pls.forEach(function(item, i) {
		if ($.isArray(item)) plotlines.push({
			id: 'pl_' + i + Math.random().toString(16).slice(2, 12), //随机ID
			value: item[0],
			color: ChartControl.plotLineColors[i % N],
			dashStyle: 'shortdash',
			width: 2,
			zIndex: 5,
			label: { text: (item[1] || 'value') + ' = ' + item[0] }
		});
		else plotlines.push(item);
	});
	return plotlines;
};

/**
 * theme colors
 * @type {Array}
 * @const
 */
ChartControl.colors = ['#2196F3', '#E91E63', '#00BCD4', '#FF5722', '#009688', '#FFEB3B', '#3F51B5', '#F44336', '#00E676', '#9C27B0'];

/**
 * plotLine Colors
 * @type {Array}
 * @const
 */
ChartControl.plotLineColors = ['red', 'green', 'blue', 'orange', 'cyan', 'purple', 'black'];

/**
 * defualts
 * @type {Object}
 * @const
 */
ChartControl.defaults = {
	chart: {
		type: 'column',
		zoomType: 'xy',
		panning: true,
		panKey: 'ctrl',
		options3d: {
			enabled: false,
			alpha: 15,
			beta: 2,
			depth: 50,
			viewDistance: 25
		}
	},
	title: {
		text: ''
	},
	legend: {
		layout: 'vertical',
		align: 'right',
		verticalAlign: 'top',
		floating: true,
		y: -8,
		borderWidth: 0
	},
	plotOptions: {
		column: {
			pointPadding: 0.2,
			borderWidth: 0
		},
		series: {
			marker: {
				enabled: false
			}
		}
	},
	tooltip: {
		shared: true,
		crosshairs: true
	},
	credits: {
		enabled: false,
		text: 'Powered by SPD',
		href: ''
	},
	exporting: {
		enabled: false
	},
	exportOpt: { //自定义导出参数
		scale: 1, //缩放比例
		sourceWidth: 800, //输出宽度
		sourceHeight: 400 //输出高度
	}
};
