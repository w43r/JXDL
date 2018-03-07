/**
 * 灾害评估
 * @author rexer
 * @date   2016-07-28
 */

var corePage;
var run = function() {
	corePage = new tpl('灾害评估').ready(function() {
		corePage.StationData = null;
		corePage.Grid = null;
		corePage.Chart = null;
		corePage.Map = null;
		corePage.Alert = new tpl.Plugin.alert('.resultPanel');
		corePage.menu([
			{ text: '高温评估', value: 'menu_1', handler: highTempAssessPage },
			{ text: '干旱评估', value: 'menu_2', handler: mciAssessPage },
			{ text: '秋雨评估', value: 'menu_3', handler: autumnRainAssessPage },
			{ text: '暴雨评估', value: 'menu_4', handler: rainStormAssessPage },
			{ text: '连阴雨评估', value: 'menu_5', handler: continueRainAssessPage },
			{ text: '强降温评估', value: 'menu_6', handler: strongCoolingAssessPage },
			{ text: '低温评估', value: 'menu_7', handler: lowTempAssessPage },
			{ text: '降雪评估', value: 'menu_8', handler: snowAssessPage }
		]);
	});
};

/**
 * 激活单选项触发事件
 * @param  {[type]}   $ele [description]
 * @return {[type]}        [description]
 */
var triggerActiveRadio = function($ele) {
	$ele.siblings('.active').removeClass('active').click();
};

/**
 * 序列化表单项
 */
var serializeObject = function($ele) {
	var obj = {};
	$ele.each(function(index, el) {
		var $self = $(el),
			key = $self.attr('name'),
			value = $self.val(); // TODO 为空的情况
		if (!key) return;
		switch ($self.attr('type')) {
			case 'number':
				value = Number(value);
				break;
		}
		obj[key] = value;
	});
	return obj;
};

var highTempAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		highTmpRangeAreaResultList: [
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续时间', data: 'persistDays' },
			{ title: '区域高温指数', data: 'rI', type: 'numeric', format: '0.000' },
			{ title: '高温等级', data: 'level' }
		],
		highTmpRangeStationResultList: [
			{ title: '站号', data: 'station_Id_C' },
			{ title: '站名', data: 'station_Name' },
			{ title: '地区', data: 'area' },
			{ title: '单站高温强度指标', data: 'si', type: 'numeric' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '高温等级', data: 'level' }
		],
		yearsResult: [
			{ title: '年份', data: 'year' },
			{ title: '过程次数', data: 'cnt', type: 'numeric' },
			{ title: '常年次数', data: 'yearCnt', type: 'numeric', format: '0.00' },
			{ title: '综合指数', data: 'yHI', type: 'numeric', format: '0.000' },
			{ title: '常年指数', data: 'yearYHI', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' },
		]
	};
	var getCondition = function() {
		// 区域时段
		var $picker = queryType === 'highTmpRangeAreaResultList' ? $datepicker2 : $datepicker;
		var para = {
			startTimeStr: $picker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $picker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.date),
			_service_: 'highTmpByRange'
		};
		if (queryType === 'yearsResult') {
			var $YHI = $('.query-type-yhi');
			$.extend(para, {
				startYear: Number($year_h.find('.start').val()),
				endYear: Number($year_h.find('.end').val()),
				perennialStartYear: Number($year_p.find('.start').val()),
				perennialEndYear: Number($year_p.find('.end').val()),
				YHILevel1: Number($YHI.eq(0).val()) / 100.0,
				YHILevel2: Number($YHI.eq(1).val()) / 100.0,
				YHILevel3: Number($YHI.eq(2).val()) / 100.0,
				_service_: 'highTmpByYears'
			});
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	// 仅历年同期出柱状图
	var initChart = function(data) {
		var x_years = [],
			y_series = [];
		data.forEach(function(item) {
			x_years.push(item.year);
			y_series.push(Number(item.yHI));
		});
		corePage.Chart = corePage.Chart = corePage.chart({ categories: x_years }, {
			title: { text: false },
		}, [{ data: y_series, name: '综合指数' }], {
			title: { text: '高温评估' },
			subtitle: { text: '历年同期' }
		});
	};
	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		var _data = data[queryType] || data;
		switch (displayType) {
			case 'grid':
				initGrid(_data);
				break;
			case 'chart':
				if (queryType != 'yearsResult') {
					$display.eq(0).click();
					return;
				}
				initChart(_data);
				break;
		}
		if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '区域', attr: { data: '.query-item-1', value: 'highTmpRangeAreaResultList' } },
			{ text: '单站', attr: { data: '.query-item-2', value: 'highTmpRangeStationResultList' } },
			{ text: '历年同期', attr: { data: '.query-item-0', value: 'yearsResult' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			var isPretty = queryType !== 'yearsResult';
			queryType = $(this).val();
			if (isPretty && queryType !== 'yearsResult' && !corePage.qCondition.change() && queryData)
				display(queryData);
			else corePage.onStatistics();
		}
	});
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-2 query-item-0', type: 'date',
    config:{
     locale:{
      format:'MM-DD'
     },
      minDate: moment('2017-01-01'),
      maxDate: moment('2017-12-31')
    }
   });
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });

	var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', start: 1961, className: 'query-item-0' });
	var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-0' });

	var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart'], 'query-item-0').click(function(event) {
		displayType = $(this).val();
		if (!corePage.qCondition.change() && queryData)
			display(queryData);
		else corePage.onStatistics();
	});

	tpl.Plugin.index(this.$condition, {
		title: '综合评估指标(YHI)',
		className: 'query-item-0',
		items: [{
			title: '轻度',
			content: '上限阀值<input class="singleTime sm query-type-yhi" value="60" type="number"><sub>%</sub>'
		}, {
			title: '中度',
			content: '上限阀值<input class="singleTime sm query-type-yhi" value="80" type="number"><sub>%</sub>'
		}, {
			title: '重度',
			content: '上限阀值<input class="singleTime sm query-type-yhi" value="95" type="number"><sub>%</sub>'
		}]
	});


	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query('DisasterEvaluateService/' + para['_service_'], para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});
	//默认
	triggerActiveRadio($typeRadios);
};


var autumnRainAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		all: [
			{ title: '年份', data: 'year' },
			{ title: '开始日期', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '常年开始日期', data: 'yearsStartTime' },
			{ title: '常年结束日期', data: 'yearsEndTime' },
			{ title: '持续天数', data: 'persistDays', type: 'numeric' },
			{ title: '长度指数', data: 'lengthIndexI', type: 'numeric', format: '0.00' },
			{ title: '长度等级', data: 'lengthLevel' },
			{ title: '秋雨量', data: 'pre', type: 'numeric', format: '0.0' },
			{ title: '雨量指数', data: 'preIndex', type: 'numeric', format: '0.00' },
			{ title: '雨量等级', data: 'preLevel' },
			{ title: '综合强度指数', data: 'intensityIndex', type: 'numeric', format: '0.000' },
			{ title: '综合等级', data: 'intensityLevel' }
		],
		date: [
			{ title: '日期', data: 'datetimeStr' },
			{ title: '区域雨量', data: 'pres' },
			{ title: '站数', data: 'stationCnt' }
		],
		year: [
			{ title: '日期', data: 'datetime' },
			{ title: '平均雨量', data: 'avgPre' },
			{ title: '大于0.1站数', data: 'cnt' },
			{ title: '是否在多雨期', data: 'inRainRange' },
		]
	};
	var getCondition = function() {
		var para;
		if (queryType === 'all') {
			var $index = $('.query-type-rain');
			para = {
				level1: Number($index.eq(0).val()),
				level2: Number($index.eq(1).val()),
				level3: Number($index.eq(2).val()),
				level4: Number($index.eq(3).val()),
				_service_: 'DisasterEvaluateService/autumnRains'
			};
		} else if (queryType === 'date') {
			para = {
				startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
				endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
				_service_: 'DisasterEvaluateService/autumnRainsByTimes'
			};
		} else if (queryType === 'year') {
			para = {
				year: Number($year_s.val()),
				_service_: 'DisasterEvaluateService/autumnRainsByYear'
			}
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initChartToolbar = function() {
		$('<div class="btn-group"></div>')
			.prependTo(corePage.$toolbar)
			.append('<span class="btn label-group-addon">类型</span>')
			.append(
				'<select class="tpl-chart-ele tpl-toolbar-item">' +
				'<option value="date" checked>日期序列</option>' +
				'<option value="index">指数序列</option>' +
				'</select>'
			).on('change', 'select', function(event) {
				initChart(queryData);
			});
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	var initChart = function(data) {
		var _data = data['autumnRainsItemResultList'];
		var type = $('.tpl-chart-ele').find('option:checked').val();
		if (type === 'date') {
			var xAxis = [],
				start = [],
				end = [];
			_data.forEach(function(item) {
				xAxis.push(item.year);
				start.push(moment(item.startTime).dayOfYear());
				end.push(moment(item.endTime).dayOfYear());
			});
			var series = [
				{ data: start, name: '开始日期' },
				{ data: end, name: '结束日期' }
			];
			var CC = new ChartControl(corePage.$panel);
			CC.render({ categories: xAxis }, { title: { text: '天数/年' }, min: 1, max: 365, plotLines: null }, series, {
				title: { text: '日期序列' },
				tooltip: {
					formatter: function() {
						var tips = [this.x + '年'];
						var year = moment().year(this.x);
						$.each(this.points, function() {
							var date = year.dayOfYear(this.y);
							tips.push(this.series.name + ' : ' + date.format('YYYY-MM-DD'));
						});
						return tips.join('<br/>');
					}
				}
			});
			corePage.Chart = CC;
		} else if (type === 'index') {
			var lengthIndexI = [],
				preIndex = [],
				intensityIndex = [];
			_data.forEach(function(item) {
				lengthIndexI.push(item.lengthIndexI);
				preIndex.push(item.preIndex);
				intensityIndex.push(item.intensityIndex);
			});
			var series = [
				{ data: lengthIndexI, name: '长度指数' },
				{ data: preIndex, name: '雨量指数' },
				{ data: intensityIndex, name: '综合强度指数' }
			];
			corePage.Chart.updateSetting({
				series: series,
				yAxis: {
					plotLines: ChartControl.stylePlotLines([data.contrastIntensityIndex, '长度指数'], [data.contrastLengthIndexI, '雨量指数'], [data.contrastPreIndex, '综合强度指数']),
					min: null,
					max: null
				},
				tooltip: { formatter: null },
				title: { text: '指数序列' }
			});
		}
	};

	var display = function(data) {
		if (queryType === 'all') {
			corePage.toolbar(tpl.TOOLBAR[displayType]);
			var _data = data['autumnRainsItemResultList'] || [];
			switch (displayType) {
				case 'grid':
					initGrid(_data);
					break;
				case 'chart':
					initChartToolbar();
					initChart(data);
					break;
			}
			if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
		} else {
			corePage.toolbar(tpl.TOOLBAR.grid);
			initGrid(data);
			if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
		}
	};

	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '查看全部', attr: { data: '.query-item-0', value: 'all' } },
			{ text: '时段查询', attr: { data: '.query-item-1', value: 'date' } },
			{ text: '年度查询', attr: { data: '.query-item-2', value: 'year' } },

		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date', className: 'query-item-1' });
	var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart'], 'query-item-0').click(function(event) {
		displayType = $(this).val();
		if (queryData) display(queryData);
		else corePage.onStatistics();
	});
	var $year_s = tpl.Plugin.customize(this.$condition, '<input type="Number" value="2015" class="year singleTime compareTime">', { title: '年份', className: 'query-item-2' }).find('input');
	tpl.Plugin.index(this.$condition, {
		title: '雨量指数',
		className: 'query-item-0',
		items: [{
			title: '一级',
			content: '<input class="singleTime sm query-type-rain" value="1.5" type="number"><sub>mm</sub>'
		}, {
			title: '二级',
			content: '<input class="singleTime sm query-type-rain" value="0.5" type="number"><sub>mm</sub>'
		}, {
			title: '三级',
			content: '<input class="singleTime sm query-type-rain" value="-0.5" type="number"><sub>mm</sub>'
		}, {
			title: '四级',
			content: '<input class="singleTime sm query-type-rain" value="-1.5" type="number"><sub>mm</sub>'
		}]
	});
	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};

/** 干旱评估 */
var mciAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		mciStationByTimes: [
			{ title: '站号', data: 'station_Id_C' },
			{ title: '站名', data: 'station_Name' },
			{ title: '地区', data: 'area' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续天数', data: 'days' },
			{ title: '单站强度', data: 'singleStrength', type: 'numeric', format: '0.00' },
			{ title: '单站综合强度', data: 'singleSynthStrength', type: 'numeric', format: '0.00' },
			{ title: '过程累积强度', data: 'sumStrength', type: 'numeric', format: '0.00' },
			{ title: '强度等级', data: 'strengthLevel', type: 'numeric', format: '0.00' },
			{ title: '标准化数值', data: 'standardValue', type: 'numeric', format: '0.00' },
			{ title: '位次', data: 'rank' }
		],
		mciStationByYears: [
			{ title: '年份', data: 'year' },
			{ title: '累积强度', data: 'sumStrength', type: 'numeric', format: '0.0' },
			{ title: '位次', data: 'rank' }
		],
		mciAreaByTimes: [
			{ title: '年份', data: 'year' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续天数', data: 'days' },
			{ title: '影响站数', data: 'stationCnts', type: 'numeric' },
			{ title: '累积强度', data: 'sumStrength', type: 'numeric', format: '0.0' },
			{ title: '综合强度', data: 'strength', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' },
			{ title: '位次', data: 'rank' }
		],
		mciAreaByYears: [
			{ title: '年份', data: 'year' },
			{ title: '累积强度', data: 'sumStrength', type: 'numeric', format: '0.0' },
			{ title: '位次', data: 'rank' }
		],
		mciAreasByYears: [
			{ title: '年份', data: 'year' },
			{ title: '过程次数', data: 'cnt' },
			{ title: '综合指数', data: 'strength', type: 'numeric', format: '0.0' },
			{ title: '常年指数', data: 'yearsStrength', type: 'numeric', format: '0.0' },
			{ title: '标准化强度', data: 'standardStrength', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' }
		]
	};
	var getCondition = function() {
		var para = { _service_: 'DisasterEvaluateService/' + queryType };
		// 区域时段
		var $picker = queryType === 'mciAreaByTimes' ? $datepicker2 : $datepicker;
		if (/ByYears/.test(queryType)) {
			para.startYear = Number($year.find('.start').val());
			para.endYear = Number($year.find('.end').val());
		} else {
			para.startTimeStr = $picker.customDatePicker('getStartTime').format(tpl.FORMATTER.date);
			para.endTimeStr = $picker.customDatePicker('getEndTime').format(tpl.FORMATTER.date);
		}
		if(queryType==='mciAreasByYears'){
			para.startTimeStr = $datepicker2.customDatePicker('getStartTime').format(tpl.FORMATTER.date);
			para.endTimeStr = $datepicker2.customDatePicker('getEndTime').format(tpl.FORMATTER.date);
			para.startYear = Number($year.find('.start').val());
			para.endYear = Number($year.find('.end').val());
			para.standardStartYear = Number($year2.find('.start').val());
			para.standardEndYear = Number($year2.find('.end').val());
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		if (displayType === 'grid') {
			initGrid(data);
		}
		// else if (displayType === 'map') {
		//     initMap(data);
		// } else if (displayType === 'chart') {
		//     initChart(data);
		// }
		if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '单站时段', attr: { data: '.query-item-0', value: 'mciStationByTimes' } },
			{ text: '单站年度', attr: { data: '.query-item-1', value: 'mciStationByYears' } },
			{ text: '区域时段', attr: { data: '.query-item-2', value: 'mciAreaByTimes' } },
			{ text: '区域年度', attr: { data: '.query-item-1', value: 'mciAreaByYears' } },
			{ text: '区域历年同期', attr: { data: '.query-item-3', value: 'mciAreasByYears' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0', type: 'date' });
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-2 query-item-3', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });
	var $year = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1 query-item-3' });
	var $year2 = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1 query-item-3' });
	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};

/*暴雨*/
var rainStormAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		areaStormByTimes: [
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '总降水量', data: 'totalPre', type: 'numeric', format: '0.0' },
			{ title: '最大降水量', data: 'maxPre', type: 'numeric', format: '0.0' },
			{ title: '范围', data: 'stations' },
			{ title: '持续时间(日数)', data: 'persistDays' },
			{ title: '等权指标', data: 'index1', type: 'numeric', format: '0.000' },
			{ title: '不等权指标', data: 'index2', type: 'numeric', format: '0.000' },
			{ title: '暴雨强度', data: 'level' }
		],
		stationStormByTimes: [
			{ title: '单点暴雨总量', data: 'preTotal', type: 'numeric', format: '0.0' },
			{ title: '年发生站数', data: 'stationCnt', type: 'numeric' },
			{ title: '强度', data: 'strength', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' }
		],
		rainstormByYears: [ // 暴雨年度评估
			{ title: '年份', data: 'year', type: 'numeric' },
			{ title: '次数', data: 'cnt', type: 'numeric' },
			{ title: '常年次数', data: 'yearCnt', type: 'numeric', format: '0.0' },
			{ title: '次数距平', data: 'anomalyCnt', type: 'numeric', format: '0.0' },
			{ title: '评估值', data: 'index', type: 'numeric', format: '0.00' },
			{ title: '常年评估值', data: 'yearIndex', type: 'numeric', format: '0.0' },
			{ title: '评估值距平', data: 'anomalyIndex', type: 'numeric', format: '0.00' }
		]
	};

	var getCondition = function() {
		var $picker = queryType === 'areaStormByTimes' ? $datepicker2 : $datepicker;
		var para = {
			_service_: 'DisasterEvaluateService/' + queryType,
			startTimeStr: $picker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $picker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
			startYear: Number($year.find('.start').val()),
			endYear: Number($year.find('.end').val()),
			perennialStartYear: Number($year_p.find('.start').val()),
			perennialEndYear: Number($year_p.find('.end').val())
		};
		if (/area|Years/.test(queryType)) {
			$.extend(para, serializeObject($('.query-type-area')), { type: $indexRadios.siblings('.active').val() });
		} else {
			$.extend(para, serializeObject($('.query-type-station')));
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};

	function initValuesChart(data) {
		var size = data.length,
			para = getCondition(),
			subtitle = '历年：' + para.startYear + '~' + para.endYear + ', 同期：' + moment(para.startTimeStr).format('MM-DD') + '~' + moment(para.endTimeStr).format('MM-DD'),
			xAxis = [], //X轴
			yAxis = [], //Y轴
			i, j;

		for (i = 0; i < size; i++) {
			var item = data[i];
			xAxis.push(item.year);
			yAxis.push(item.index);
		}
		// 排序
		var sortedData = yAxis.slice(0); //clone
		for (var i = 0; i < size - 1; i++) {
			for (var j = 0; j < size - 1 - i; j++) {
				if (sortedData[j] > sortedData[j + 1]) {
					var temp = sortedData[j];
					sortedData[j] = sortedData[j + 1];
					sortedData[j + 1] = temp;
				}
			}
		}
		// 排位
		var rank60 = sortedData[Math.round(size * .6)],
			rank80 = sortedData[Math.round(size * .8)],
			rank95 = sortedData[Math.round(size * .95)],
			rank60Arr = G.fillArray(size, rank60),
			rank80Arr = G.fillArray(size, rank80),
			rank95Arr = G.fillArray(size, rank95);

		// var plotLines = ChartControl.stylePlotLineArr([
		// 	[rank60, '60百分位'],
		// 	[rank80, '80百分位'],
		// 	[rank95, '95百分位']
		// ]);

		corePage.Chart = corePage.chart({ categories: xAxis }, { title: { text: '暴雨评估值' } }, [
			{ name: '暴雨评估值', data: yAxis },
			{ name: '60百分位', data: rank60Arr, type: 'line', dashStyle: 'shortdash' },
			{ name: '80百分位', data: rank80Arr, type: 'line', dashStyle: 'shortdash' },
			{ name: '95百分位', data: rank95Arr, type: 'line', dashStyle: 'shortdash' }
		], {
			title: { text: '历年暴雨评估值统计图' },
			subtitle: { text: subtitle }
		});
	}

	function initTimesChart(data) {
		var size = data.length,
			para = getCondition(),
			subtitle = '历年：' + para.startYear + '~' + para.endYear + ', 同期：' + moment(para.startTimeStr).format('MM-DD') + '~' + moment(para.endTimeStr).format('MM-DD'),
			xAxis = [], //X轴
			yAxis = [], //Y轴
			i;
		for (i = 0; i < size; i++) {
			var item = data[i];
			xAxis.push(item.year);
			yAxis.push(item.cnt);
		}
		// 排序
		var sortedData = yAxis.slice(0); //clone
		for (var i = 0; i < size - 1; i++) {
			for (var j = 0; j < size - 1 - i; j++) {
				if (sortedData[j] > sortedData[j + 1]) {
					var temp = sortedData[j];
					sortedData[j] = sortedData[j + 1];
					sortedData[j + 1] = temp;
				}
			}
		}
		// 排位
		var rank60 = sortedData[Math.round(size * .6)],
			rank80 = sortedData[Math.round(size * .8)],
			rank95 = sortedData[Math.round(size * .95)],
			rank60Arr = G.fillArray(size, rank60),
			rank80Arr = G.fillArray(size, rank80),
			rank95Arr = G.fillArray(size, rank95);


		corePage.Chart = corePage.chart({ categories: xAxis }, {
			title: { text: '暴雨次数' }
		}, [
			{ name: '暴雨次数', data: yAxis },
			{ name: '60百分位', data: rank60Arr, type: 'line', dashStyle: 'shortdash' },
			{ name: '80百分位', data: rank80Arr, type: 'line', dashStyle: 'shortdash' },
			{ name: '95百分位', data: rank95Arr, type: 'line', dashStyle: 'shortdash' }
		], {
			title: { text: '历年暴雨次数统计图' },
			subtitle: { text: subtitle },
		});
	}

	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		var _data = $.isArray(data) ? data : [data];
		switch (displayType) {
			case 'grid':
				initGrid(_data);
				break;
			case 'chart':
				if (queryType != 'rainstormByYears') {
					$display.eq(0).click();
					return;
				}
				// 增加toolbar项: 类型选择
				corePage.toolbarItem({
					title: '要素',
					items: [
						{ text: '暴雨次数', className: 'active', attr: { 'value': 'times' } },
						{ text: '暴雨评估', attr: { 'value': 'values' } }
					],
					handler: function() {
						var $this = $(this);
						$this.blur();
						if ($this.hasClass('active')) return;
						var chartType = $this.val();
						$this.addClass('active').siblings('.tpl-toolbar-item').removeClass('active');
						if (chartType === 'values') initValuesChart(_data);
						else if (chartType === 'times') initTimesChart(_data);
					}
				});
				initTimesChart(_data);
				break;
		}
		if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '区域时段', attr: { data: '.query-item-0', value: 'areaStormByTimes' } },
			{ text: '单点时段', attr: { data: '.query-item-1', value: 'stationStormByTimes' } },
			{ text: '历年同期', attr: { data: '.query-item-2', value: 'rainstormByYears' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	var $indexRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '标准',
		className: 'query-item-0 query-item-2',
		items: [
			{ text: '气候中心标准', className: 'line', attr: { value: 'PRE' }, css: { width: '50%' } },
			{ text: '气象台标准（2020）', className: 'line', attr: { value: '2020' }, css: { width: '50%' } },
			{ text: '气象台标准（0808）', className: 'line', attr: { value: '0808' }, css: { width: '50%' } }
		],
		handler: function() {
			corePage.onStatistics();
		}
	});
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1 query-item-2', type: 'date' });
	var $year = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-2' });
	var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-2' });

	var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart'], 'query-item-2').click(function(event) {
		displayType = $(this).val();
		if (!corePage.qCondition.change() && queryData)
			display(queryData);
		else corePage.onStatistics();
	});

	var $index1 = tpl.Plugin.index(this.$condition, {
		title: '区域暴雨指标',
		className: 'query-item-0 query-item-2',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">最大总降水量<input name="maxPre" class="singleTime query-type-area" value="30528" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大单站降水量<input name="maxSignalPre" class="singleTime query-type-area" value="306.9" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大持续时间<input name="maxPersistDays" class="singleTime query-type-area" value="7" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大站数<input name="maxStationCnt" class="singleTime query-type-area" value="31" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">最小总降水量<input name="minPre" class="singleTime query-type-area" value="2175" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小单站降水量<input name="minSignalPre" class="singleTime query-type-area" value="50" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小持续时间<input name="minPersistDays" class="singleTime query-type-area" value="1" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小站数<input name="minStationCnt" class="singleTime query-type-area" value="4" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">暴雨总量权重<input name="weight1" class="singleTime query-type-area" value="0.25" type="number"></span>',
			'<span style="margin-bottom: 2px;">范围权重<input name="weight2" class="singleTime query-type-area" value="0.25" type="number"></span>',
			'<span style="margin-bottom: 2px;">日降水量极值权重<input name="weight3" class="singleTime query-type-area" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">持续时间权重<input name="weight4" class="singleTime query-type-area" value="0.1" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>暴雨等级:</b><br>',
			'<span style="margin-left: 13px;">轻度</span>',
			'<span style="margin-left: 50px;">中度</span>',
			'<span style="margin-left: 54px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="level1" class="singleTime query-type-area" value="0" type="number">',
			'<input name="level2" style="margin-left:12px;" class="singleTime query-type-area" value="0.15" type="number">',
			'<input name="level3" style="margin-left:12px;" class="singleTime query-type-area" value="0.25" type="number">',
			'<input name="level4" style="margin-left:12px;" class="singleTime query-type-area" value="0.4" type="number">',
			'</div>',
			'</div>'
		].join('')
	});
	var $index2 = tpl.Plugin.index(this.$condition, {
		title: '单点暴雨指标',
		className: 'query-item-1',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">最大暴雨总量<input name="maxStationPreTotal" class="singleTime query-type-station" value="3463.9" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小暴雨总量<input name="minStationPreTotal" class="singleTime query-type-station" value="800" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">最大站点总和<input name="maxStationCntTotal" class="singleTime query-type-station" value="43" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小站点总和<input name="minStationCntTotal" class="singleTime query-type-station" value="15" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>暴雨等级:</b>',
			'<span style="margin-left: 13px;">轻度</span>',
			'<span style="margin-left: 50px;">中度</span>',
			'<span style="margin-left: 54px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="level1" class="singleTime query-type-station" value="0" type="number">',
			'<input name="level2" style="margin-left:12px;" class="singleTime query-type-station" value="0.4" type="number">',
			'<input name="level3" style="margin-left:12px;" class="singleTime query-type-station" value="0.55" type="number">',
			'<input name="level4" style="margin-left:12px;" class="singleTime query-type-station" value="0.7" type="number">',
			'</div>',
			'</div>'
		].join('')
	});
	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};


/*连阴雨*/
var continueRainAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		continueRainStatiionByTimes: [
			{ title: '站号', data: 'station_Id_C' },
			{ title: '站名', data: 'station_Name' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续日数', data: 'persistDays', type: 'numeric' },
			{ title: '有雨日数', data: 'rainDays', type: 'numeric' },
			{ title: '白天降水量', data: 'pre', type: 'numeric', format: '0.0' },
			{ title: '单站指数', data: 'result2', type: 'numeric', format: '0.000' },
			{ title: '级别', data: 'level' }
		],
		continueRainAreaByTimes: [
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续时间', data: 'persistDays', type: 'numeric' },
			{ title: '有雨日数', data: 'preDays', type: 'numeric' },
			{ title: '累计站点数', data: 'stationCnt', type: 'numeric' },
			{ title: '白天降水量', data: 'pre', type: 'numeric', format: '0.0' },
			{ title: '区域指数', data: 'result2', type: 'numeric', format: '0.000' },
			{ title: '级别', data: 'level' }
		],
		continueRainByYear: [
			{ title: '年份', data: 'year' },
			{ title: '发生次数', data: 'times' },
			{ title: '常年次数', data: 'yearsCnt' },
			{ title: '综合指数', data: 'areaStrength', type: 'numeric', format: '0.000' },
			{ title: '常年指数', data: 'areaYearStrength', type: 'numeric', format: '0.000' },
			{ title: '级别', data: 'level' }
		]
	};

	var getCondition = function() {
		var $picker = queryType === 'continueRainAreaByTimes' ? $datepicker2 : $datepicker;
		var para = {
			startYear: Number($year_h.find('.start').val()),
			endYear: Number($year_h.find('.end').val()),
			perennialStartYear: Number($year_p.find('.start').val()),
			perennialEndYear: Number($year_p.find('.end').val()),
			_service_: 'DisasterEvaluateService/' + queryType,
			startTimeStr: $picker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $picker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
		};
		$.extend(para, serializeObject($('.query-type-' + queryType)));
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		var _data = $.isArray(data) ? data : [data];
		switch (displayType) {
			case 'grid':
				initGrid(_data);
				break;
		}
		if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '单站时段', attr: { data: '.query-item-0', value: 'continueRainStatiionByTimes' } },
			{ text: '区域时段', attr: { data: '.query-item-1', value: 'continueRainAreaByTimes' } },
			{ text: '历年同期', attr: { data: '.query-item-2', value: 'continueRainByYear' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0 query-item-2', type: 'date' });
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });

	var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-2' });
	var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-2' });

	var $index1 = tpl.Plugin.index(this.$condition, {
		title: '单站连阴雨指标',
		className: 'query-item-0',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">最大持续时间<input name="maxSingleDays" class="singleTime query-type-continueRainStatiionByTimes" value="34" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小持续时间<input name="minSingleDays" class="singleTime query-type-continueRainStatiionByTimes" value="6" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大有雨日数<input name="maxSingleRainDays" class="singleTime query-type-continueRainStatiionByTimes" value="18" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小有雨日数<input name="minSingleRainDays" class="singleTime query-type-continueRainStatiionByTimes" value="4" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累计白天降水量<input name="maxSinglePre" class="singleTime query-type-continueRainStatiionByTimes" value="262.8" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累计白天降水量<input name="minSinglePre" class="singleTime query-type-continueRainStatiionByTimes" value="0.4" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">不等权集成持续时间指数<input name="persistDaysIndex" class="singleTime query-type-continueRainStatiionByTimes" value="0.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成有雨日数指数<input name="preDaysIndex" class="singleTime query-type-continueRainStatiionByTimes" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成白天降水指数<input name="preIndex" class="singleTime query-type-continueRainStatiionByTimes" value="0.1" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>强度等级:</b>',
			'<span style="margin-left: 2px;">轻度</span>',
			'<span style="margin-left: 43px;">中度</span>',
			'<span style="margin-left: 51px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="strengthIndex1" class="singleTime query-type-continueRainStatiionByTimes" value="0" type="number">',
			'<input name="strengthIndex2" style="margin-left:12px;" class="singleTime query-type-continueRainStatiionByTimes" value="0.11" type="number">',
			'<input name="strengthIndex3" style="margin-left:12px;" class="singleTime query-type-continueRainStatiionByTimes" value="0.21" type="number">',
			'<input name="strengthIndex4" style="margin-left:12px;" class="singleTime query-type-continueRainStatiionByTimes" value="0.32" type="number">',
			'</div>',
			'</div>'
		].join('')
	});
	var $index2 = tpl.Plugin.index(this.$condition, {
		title: '区域时段连阴雨指标',
		className: 'query-item-1',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">最大过程持续天数<input name="maxPersistDays" class="singleTime sm query-type-continueRainAreaByTimes" value="59" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小过程持续天数<input name="minPersistDays" class="singleTime sm query-type-continueRainAreaByTimes" value="6" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累计站点数<input name="maxSumStations" class="singleTime query-type-continueRainAreaByTimes" value="63" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累计站点数<input name="minSumStations" class="singleTime query-type-continueRainAreaByTimes" value="7" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大有雨日数<input name="maxRainDays" class="singleTime query-type-continueRainAreaByTimes" value="514" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小有雨日数<input name="minRainDays" class="singleTime query-type-continueRainAreaByTimes" value="7" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累积白天雨量<input name="maxSumPres" class="singleTime query-type-continueRainAreaByTimes" value="3047.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累积白天雨量<input name="minSumPres" class="singleTime query-type-continueRainAreaByTimes" value="0.7" type="number"></span>',

			'<span style="margin-bottom: 2px;">不等权集成过程持续天数指数<input name="index1" class="singleTime sm query-type-continueRainAreaByTimes" value="0.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成累计站点数指数<input name="index2" class="singleTime sm query-type-continueRainAreaByTimes" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成有雨日数指数<input name="index3" class="singleTime query-type-continueRainAreaByTimes" value="0.05" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成累计白天雨量指数<input name="index4" class="singleTime query-type-continueRainAreaByTimes" value="0.05" type="number"></span>',

			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>强度等级:</b>',
			'<span style="margin-left: 2px;">轻度</span>',
			'<span style="margin-left: 43px;">中度</span>',
			'<span style="margin-left: 51px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="strengthIndex1" class="singleTime query-type-continueRainAreaByTimes" value="0" type="number">',
			'<input name="strengthIndex2" style="margin-left:12px;" class="singleTime query-type-continueRainAreaByTimes" value="0.15" type="number">',
			'<input name="strengthIndex3" style="margin-left:12px;" class="singleTime query-type-continueRainAreaByTimes" value="0.25" type="number">',
			'<input name="strengthIndex4" style="margin-left:12px;" class="singleTime query-type-continueRainAreaByTimes" value="0.37" type="number">',
			'</div>',
			'</div>'
		].join('')
	});
	var $index3 = tpl.Plugin.index(this.$condition, {
		title: '年度连阴雨指标',
		className: 'query-item-2',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">最大持续时间<input name="maxSingleDays" class="singleTime query-type-continueRainByYear" value="47" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小持续时间<input name="minSingleDays" class="singleTime query-type-continueRainByYear" value="6" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大有雨日数<input name="maxSingleRainDays" class="singleTime query-type-continueRainByYear" value="18" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小有雨日数<input name="minSingleRainDays" class="singleTime query-type-continueRainByYear" value="4" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累计白天降水量<input name="maxSinglePre" class="singleTime query-type-continueRainByYear" value="262.8" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累计白天降水量<input name="minSinglePre" class="singleTime query-type-continueRainByYear" value="0.4" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">不等权集成持续时间指数<input name="persistDaysIndex" class="singleTime query-type-continueRainByYear" value="0.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成有雨日数指数<input name="preDaysIndex" class="singleTime query-type-continueRainByYear" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">不等权集成白天降水指数<input name="preIndex" class="singleTime query-type-continueRainByYear" value="0.1" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">最大过程持续天数<input name="maxPersistDays" class="singleTime sm query-type-continueRainByYear" value="42" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小过程持续天数<input name="minPersistDays" class="singleTime sm query-type-continueRainByYear" value="6" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累计站点数<input name="maxSumStations" class="singleTime query-type-continueRainByYear" value="51" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累计站点数<input name="minSumStations" class="singleTime query-type-continueRainByYear" value="7" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大有雨日数<input name="maxRainDays" class="singleTime query-type-continueRainByYear" value="689" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小有雨日数<input name="minRainDays" class="singleTime query-type-continueRainByYear" value="5" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大累积白天雨量<input name="maxSumPres" class="singleTime query-type-continueRainByYear" value="3047.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小累积白天雨量<input name="minSumPres" class="singleTime query-type-continueRainByYear" value="11.7" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<span style="margin-bottom: 2px;">最大单站强度<input name="maxStationStrength" class="singleTime query-type-continueRainByYear" value="32.053" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小单站强度<input name="minStationStrength" class="singleTime query-type-continueRainByYear" value="3.051" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大区域强度<input name="maxAreaStrength" class="singleTime query-type-continueRainByYear" value="2.132" type="number"></span>',
			'<span style="margin-bottom: 2px;">最小区域强度<input name="minAreaStrength" class="singleTime query-type-continueRainByYear" value="0.072" type="number"></span>',
			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>强度等级:</b>',
			'<span style="margin-left: 1px;">轻度</span>',
			'<span style="margin-left: 25px;">中度</span>',
			'<span style="margin-left: 40px;">重度</span>',
			'<span style="margin-left: 40px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="strengthIndex1" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0" type="number">',
			'<input name="strengthIndex2" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.18" type="number">',
			'<input name="strengthIndex3" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.3" type="number">',
			'<input name="strengthIndex4" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.44" type="number">',
			'<i>区域强度</i>',
			'<i class="separator"></i>',
			'<input name="yearStrengthIndex1" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0" type="number">',
			'<input name="yearStrengthIndex2" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.47" type="number">',
			'<input name="yearStrengthIndex3" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.66" type="number">',
			'<input name="yearStrengthIndex4" style="margin-left:0px;" class="singleTime query-type-continueRainByYear" value="0.77" type="number">',
			'<i>年度强度</i>',
			'</div>',
			'</div>'
		].join('')
	});
	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};

/*强降温*/
var strongCoolingAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		strongCoolingAreaByTimes: [
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续天数', data: 'persistDays', type: 'numeric' },
			{ title: '影响站数', data: 'stationCnt', type: 'numeric' },
			{ title: '过程降温极大值', data: 'maxTmp', type: 'numeric', format: '0.0' },
			{ title: '过程降温极小值', data: 'minTmp', type: 'numeric', format: '0.0' },
			{ title: '过程降温均值', data: 'avgTmp', type: 'numeric', format: '0.0' },
			{ title: '综合指数', data: 'index', type: 'numeric', format: '0.0' },
			{ title: '等级', data: 'level' }
		],
		strongCoolingByYear: [
			{ title: '年份', data: 'year' },
			{ title: 'CI指数', data: 'cI', type: 'numeric', format: '0.0' },
			{ title: '常年CI指数', data: 'yearsCI', type: 'numeric', format: '0.0' },
			{ title: '发生次数', data: 'times' },
			{ title: '常年次数', data: 'yearsCnt' },
			{ title: '等级', data: 'level' }
		],
		strongCoolingStationByTimes: [
			{ title: '站号', data: 'station_Id_C' },
			{ title: '站名', data: 'station_Name' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续天数', data: 'persistDays', type: 'numeric' },
			{ title: '过程降温', data: 'coolingTmps', type: 'numeric', format: '0.0' },
			{ title: '72小时降幅', data: 'coolingTmps72Hours', type: 'numeric', format: '0.0' },
			{ title: '程度', data: 'level' }
		]
	};

	var getCondition = function() {
		var $picker = queryType === 'strongCoolingAreaByTimes' ? $datepicker2 : $datepicker;
		var para = {
			startYear: Number($year_h.find('.start').val()),
			endYear: Number($year_h.find('.end').val()),
			perennialStartYear: Number($year_p.find('.start').val()),
			perennialEndYear: Number($year_p.find('.end').val()),
			_service_: 'DisasterEvaluateService/' + queryType,
			startTimeStr: $picker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $picker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
		};
		if (queryType !== 'strongCoolingStationByTimes') {
			$.extend(para, serializeObject($('.query-type-area')));
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		var _data = $.isArray(data) ? data : [data];
		switch (displayType) {
			case 'grid':
				initGrid(_data);
				break;
		}
		if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '区域时段', attr: { data: '.query-item-0', value: 'strongCoolingAreaByTimes' } },
			{ text: '历年同期', attr: { data: '.query-item-1', value: 'strongCoolingByYear' } },
			{ text: '单站时段', attr: { data: '.query-item-2', value: 'strongCoolingStationByTimes' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });

	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1 query-item-2', type: 'date' });

	var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });
	var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

	tpl.Plugin.index(this.$condition, {
		title: '区域强降温指标',
		className: 'query-item-0 query-item-1',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">站数最大值<input name="maxStations" class="singleTime query-type-area" value="34" type="number"></span>',
			'<span style="margin-bottom: 2px;">站数最小值<input name="minStations" class="singleTime query-type-area" value="7" type="number"></span>',

			'<span style="margin-bottom: 2px;">持续天数最大值<input name="maxPersistDays" class="singleTime query-type-area" value="10" type="number"></span>',
			'<span style=";margin-bottom: 2px;">持续天数最小值<input name="minPersistDays" class="singleTime query-type-area" value="1" type="number"></span>',

			'<span style="margin-bottom: 2px;">过程降温极大值<input name="maxCoolingTmp" class="singleTime query-type-area" value="19.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">过程降温极小值<input name="minCoolingTmp" class="singleTime query-type-area" value="6" type="number"></span>',

			'<span style="margin-bottom: 2px;">站数权重<input name="weight1" class="singleTime query-type-area" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">持续天数权重<input name="weight2" class="singleTime query-type-area" value="0.15" type="number"></span>',
			'<span style="margin-bottom: 2px;">降温极大值权重<input name="weight3" class="singleTime query-type-area" value="0.4" type="number"></span>',
			'<span style="margin-bottom: 2px;">均值权重<input name="weight4" class="singleTime query-type-area" value="0.05" type="number"></span>',

			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>强降温等级:</b>',
			'<span style="margin-left: 40px;">中度</span>',
			'<span style="margin-left: 54px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="level1" style="margin-left:48px;" class="singleTime query-type-area" value="0.53" type="number">',
			'<input name="level2" style="margin-left:12px;" class="singleTime query-type-area" value="0.69" type="number">',
			'<input name="level3" style="margin-left:12px;" class="singleTime query-type-area" value="0.77" type="number">',
			'</div>',
			'</div>'
		].join('')
	});

	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};

var lowTempAssessPage = function() {
	var queryData;
	var queryType;
	var displayType = 'grid';
	var cols = {
		lowTmpAreaByTimes: [
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '持续天数', data: 'persistDays', type: 'numeric' },
			{ title: '影响站数', data: 'stationCnts', type: 'numeric' },
			{ title: '累积气温距平', data: 'sumAnomaly', type: 'numeric', format: '0.0' },
			{ title: '等权集成', data: 'result1', type: 'numeric', format: '0.00' },
			{ title: '不等权集成', data: 'result2', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' }
		],
		lowTmpStationByTimes: [
			{ title: '站号', data: 'station_Id_C' },
			{ title: '站名', data: 'station_Name' },
			{ title: '开始时间', data: 'startTime' },
			{ title: '结束时间', data: 'endTime' },
			{ title: '平均气温', data: 'avgTmp', type: 'numeric', format: '0.0' },
			{ title: '气温距平', data: 'anomaly', type: 'numeric', format: '0.0' },
			{ title: '程度', data: 'level', type: 'numeric', format: '0.0' },
			{ title: '持续天数', data: 'persistDays', type: 'numeric' },
			{ title: '持续候数', data: 'persistHous', type: 'numeric' }
		],
		lowTmpByYear: [
			{ title: '年份', data: 'year' },
			{ title: '过程次数', data: 'cnt' },
			{ title: '常年次数', data: 'yearsCnt', type: 'numeric', format: '0.0' },
			{ title: '综合指数', data: 'result', type: 'numeric', format: '0.00' },
			{ title: '常年指数', data: 'yearsResult', type: 'numeric', format: '0.00' },
			{ title: '等级', data: 'level' }
		]
	};

	var getCondition = function() {
		var $picker = queryType === 'lowTmpAreaByTimes' ? $datepicker2 : $datepicker;
		var para = {
			_service_: 'DisasterEvaluateService/' + queryType,
			startTimeStr: $picker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $picker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
			standardStartYear: Number($year_p.find('.start').val()),
			standardEndYear: Number($year_p.find('.end').val())
		};
		if (/area|year/i.test(queryType)) {
			$.extend(para, serializeObject($('.query-type-area')));
		}
		if (/year/i.test(queryType)) {
			delete para.level4;
			para.startYear = Number($year_h.find('.start').val());
			para.endYear = Number($year_h.find('.end').val());
		}
		corePage.qCondition.set(para);
		return para;
	};
	var initGrid = function(data) {
		corePage.Grid = corePage.grid(cols[queryType], data);
	};
	var display = function(data) {
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		var _data = $.isArray(data) ? data : [data];
		switch (displayType) {
			case 'grid':
				initGrid(_data);
				break;
		}
		if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
	};
	this.page();
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '类型',
		items: [
			{ text: '区域时段', attr: { data: '.query-item-0', value: 'lowTmpAreaByTimes' } },
			{ text: '单站时段', attr: { data: '.query-item-1', value: 'lowTmpStationByTimes' } },
			{ text: '历年同期', attr: { data: '.query-item-2', value: 'lowTmpByYear' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});

	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0', type: 'date', config: { startDate: moment().startOf('year'), endDate: moment() } });
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1 query-item-2', type: 'date' });

	var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-2' });
	var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-2' });

	tpl.Plugin.index(this.$condition, {
		title: '低温指标',
		className: 'query-item-0 query-item-2',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">持续天数最大值<input name="maxPersistDays" class="singleTime query-type-area" value="36" type="number"></span>',
			'<span style="margin-bottom: 2px;">持续天数最小值<input name="minPersistDays" class="singleTime query-type-area" value="8" type="number"></span>',

			'<span style="margin-bottom: 2px;">站数最大值<input name="maxSumStation" class="singleTime query-type-area" value="34" type="number"></span>',
			'<span style="margin-bottom: 2px;">站数最小值<input name="minSumStation" class="singleTime query-type-area" value="7" type="number"></span>',

			'<span style="margin-bottom: 2px;">过程降温极大值<input name="maxSumAnomaly" class="singleTime query-type-area" value="206.2" type="number"></span>',
			'<span style="margin-bottom: 2px;">过程降温极小值<input name="minSumAnomaly" class="singleTime query-type-area" value="14" type="number"></span>',

			'<span style="margin-bottom: 2px;">持续时间权重<input name="persistDayWeight" class="singleTime query-type-area" value="0.5" type="number"></span>',
			'<span style="margin-bottom: 2px;">累积站点权重<input name="sumStationWeight" class="singleTime query-type-area" value="0.3" type="number"></span>',
			'<span style="margin-bottom: 2px;">气温距平权重<input name="anomalyWeight" class="singleTime query-type-area" value="0.2" type="number"></span>',

			'<i class="query-item-0" style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div class="query-item-0" style="width:100%;text-align: justify;">',
			'<b>低温等级:</b>',
			'<span>轻度</span>',
			'<span style="margin-left: 46px;">中度</span>',
			'<span style="margin-left: 52px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="level1" class="singleTime query-type-area" value="0" type="number">',
			'<input name="level2" style="margin-left:12px;" class="singleTime query-type-area" value="0.4" type="number">',
			'<input name="level3" style="margin-left:12px;" class="singleTime query-type-area" value="0.6" type="number">',
			'<input name="level4" style="margin-left:12px;" class="singleTime query-type-area" value="0.75" type="number">',
			'</div>',
			'</div>'
		].join('')
	});

	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query(para._service_, para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	//默认
	triggerActiveRadio($typeRadios);
};

/*降雪评估*/
function snowAssessPage() {
	var queryData;
	var queryType;
	var displayType = 'grid';

	var cols = [
		{ title: '开始时间', data: 'startTime' },
		{ title: '结束时间', data: 'endTime' },
		{ title: '持续天数', data: 'persistDays', type: 'numeric' },
		{ title: '最大影响范围', data: 'maxStations', type: 'numeric' },
		{ title: '平均积雪深度', data: 'avgDepth', type: 'numeric', format: '0.0' },
		{ title: '最大积雪深度', data: 'maxDepth', type: 'numeric', format: '0.0' },
		{ title: '综合强度', data: 'strength', type: 'numeric', format: '0.0' },
		{ title: '等级', data: 'level' }
	];
	var getCondition = function() {
		var para = $.extend({
			startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
		}, serializeObject($('.query-index-snow')));
		corePage.qCondition.set(para);
		return para;
	};

	function display(data) {
		if (!G.isPretty(data)) {
			corePage.Alert.show('暂无数据...');
			return;
		}
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		initGrid(data);
	}

	function initGrid(data) {
		corePage.Grid = corePage.grid(cols, data);
	}

	this.page();

	var $datepicker = tpl.Plugin.datepicker(this.$condition, {
		type: 'date',
		config: {
			startDate: moment('1951-01-01'),
			endDate: moment()
		}
	});

	tpl.Plugin.index(this.$condition, {
		title: '降雪指标',
		items: [
			'<div style="display: flex; flex-flow: row wrap; justify-content: space-between;">',
			'<span style="margin-bottom: 2px;">持续时间权重<input name="IA" class="singleTime query-index-snow" value="0.1" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大影响范围权重<input name="IB" class="singleTime query-index-snow" value="0.4" type="number"></span>',

			'<span style="margin-bottom: 2px;">平均积雪深度权重<input name="IC" class="singleTime query-index-snow" value="0.3" type="number"></span>',
			'<span style="margin-bottom: 2px;">最大积雪权重<input name="ID" class="singleTime query-index-snow" value="0.2" type="number"></span>',

			'<i style="width:100%; margin-bottom:3px; border-bottom: solid 1px #bbb;"></i>',
			'<div style="width:100%;text-align: justify;">',
			'<b>降雪等级:</b>',
			'<span style="margin-left: 13px;">轻度</span>',
			'<span style="margin-left: 50px;">中度</span>',
			'<span style="margin-left: 54px;">重度</span>',
			'<span style="margin-left: 50px;">特重</span>',
			'<i class="separator"></i>',
			'<input name="level1" class="singleTime query-index-snow" value="0" type="number">',
			'<input name="level2" style="margin-left:12px;" class="singleTime query-index-snow" value="0.3" type="number">',
			'<input name="level3" style="margin-left:12px;" class="singleTime query-index-snow" value="0.4" type="number">',
			'<input name="level4" style="margin-left:12px;" class="singleTime query-index-snow" value="0.6" type="number">',
			'</div>',
			'</div>'
		].join('')
	});


	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		tpl.ext.query('DisasterEvaluateService/snowArea', getCondition(), function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	});

	this.onStatistics();
}
