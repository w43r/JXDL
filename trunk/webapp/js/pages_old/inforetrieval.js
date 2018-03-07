/**
 * 资料信息检索
 * @author rexer
 * @date   2016-10-24
 */
var corePage;

function run() {
	corePage = new tpl('小时降水统计').ready(function(event) {
		// Cache Variables
		corePage.StationData = null;
		corePage.Grid = null;
		corePage.Chart = null;
		corePage.Map = null;
		corePage.Alert = new tpl.Plugin.alert('.resultPanel');
		tpl.ext.loadStation(function(data) { //回调
			corePage.StationData = data;
			corePage.menu([
				{ text: '数据监控', value: 'dashboard', handler: dashboard },
				{ text: '数据浏览', value: 'm1', handler: initPage },
				{ text: '日数据', value: 'm2', handler: initDayPage }
			]);
		});
	});
}
/**
 * 运行状态
 * 数据完整性
 */
function dashboard() {
	// 初始化页面
	this.clear();
	this.$page.empty();
	var $dashboard = $('<div id="dashboard-wrapper" class="full"></div>')
		.append(`
			<div id="box-wrapper" class="row wrapper">
				<div class="box-inner col-sm-4 column"></div>
				<div class="box-inner col-sm-4 column"></div>
				<div class="box-inner col-sm-4 column"></div>
			</div>
			<div id="content-wrapper" class="row wrapper">
				<div class="grid-inner col-md-9 col-sm-8 col-xs-12 column h">
					<div id="dashboard-grid" class="dashboard-grid full"></div>
				</div>
				<div class="pie-inner col-md-3 col-sm-4 col-xs-12 column h"></div>
			</div>
			<div id="chart-wrapper" class="row wrapper">
				<div class="chart-inner col-md-12 column full">
					<div id="dashboard-chart" class="tpl-result-chart full"></div>
				</div>
			</div>
		`)
		.appendTo(this.$page);
	if (G.User.getAuthority().A) {
		$dashboard.find('.box-inner.column:first-child')
			.removeClass('col-sm-4').addClass('col-sm-3')
			.before('<div class="datafill col-sm-1 column"><a class="datafill btn btn-warning" style="height: 100px;display: block;text-align: center;font-size: 26px;word-wrap: break-word;word-break: normal;white-space: normal;">补录数据</a></div>');
		$dashboard.find('.btn.datafill').on('click', function(e) {
			fillData()
			e.preventDefault();
		})
	}
	// 列名
	var COLS = [
		{ title: '站号', data: 'station_Id_C', editor: false },
		{ title: '站名', data: 'station_Name', editor: false },
		{ title: '数据开始时间', data: 'startTime', editor: false },
		{ title: '数据更新时间', data: 'updateTime', editor: false },
		{ title: '应到数', data: 'predictCnt', type: 'numeric', editor: false },
		{ title: '实到数', data: 'realCnt', type: 'numeric', editor: false },
		{ title: '缺测数', data: 'missCnt', type: 'numeric', editor: false }, {
			title: '缺测率',
			data: 'missRate',
			type: 'numeric',
			editor: false,
			renderer: function() {
				var args = Array.prototype.slice.call(arguments);
				args[5] = (args[5] * 100).toFixed(2) + '%';
				Handsontable.renderers.TextRenderer.apply(this, args);
			}
		}, {
			title: '近30天缺测率',
			data: 'missRate30Days',
			type: 'numeric',
			editor: false,
			renderer: function() {
				var args = Array.prototype.slice.call(arguments);
				args[5] = (args[5] * 100).toFixed(2) + '%';
				Handsontable.renderers.TextRenderer.apply(this, args);
			}
		}
	];
	// 列字段Index
	var COL_INDEX = {
		STATION_ID: 0,
		STATION_NAME: 1,
		START_TIME: 2,
		UPDATE_TIME: 3,
		PREDICT_CNT: 4,
		REAL_CNT: 5,
		MISS_CNT: 6,
		MISS_RATE: 7
	};
	// 当前选中行(站号)
	var currentRow = null;
	// 查询类
	var Query = new DeferredQuery();
	// 提示框
	var Alert = new tpl.Plugin.alert($dashboard);
	var loader = new tpl.Plugin.loader($dashboard);
	// 国家站点数
	var STATION_ALL_CNT = G.User.getAuthority().B ? 34 : 1;

	function initBox(data) {
		return `
			<div class="info-box bg-${data.background || 'green'}">
				<span class="info-box-icon"><i class="${data.icon || 'fa fa-line-chart'}"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">${data.title}</span>
					<span class="info-box-number">${data.data}</span>
					<div class="progress">
						<div class="progress-bar" style="width: ${data.progress || 0}%"></div>
					</div>
					<span class="progress-description">${data.desc || ''}</span>
				</div>
				<div class="icon">
				  <i class="fa fa-refresh fa-spin"></i>
				</div>
			</div>`;
	}
	/**
	 * 表格
	 */
	function initGrid(data) {
		var table = document.querySelector('#dashboard-grid');
		// 生成表格
		corePage.Grid = new Handsontable(table, Handsontable.addon.paramize(COLS, data, {
			multiSelect: false,
			fillHandle: false,
			currentRowClassName: 'highlightRow', //选中css
			currentColClassName: '', //选中css
			manualColumnMove: false,
			manualRowMove: false,
			allowRemoveColumn: false,
			allowRemoveRow: true,
			contextMenu: false,
			dropdownMenu: ['filter_by_condition', 'filter_action_bar', '---------', 'filter_by_value'],
			outsideClickDeselects: false
		}));

		// 更新统计图
		function updateChartsByGrid() {
			var me = corePage.Grid;
			var realCntArr = me.getDataAtCol(COL_INDEX.REAL_CNT),
				predictCntArr = me.getDataAtCol(COL_INDEX.PREDICT_CNT),
				stations = me.getDataAtCol(COL_INDEX.STATION_NAME);
			// 生成统计图
			initChart(realCntArr, predictCntArr, stations);
			// 默认选中第一行数据
			corePage.Grid.selectCell(0, 0);
		}

		// 排序后更新统计图
		corePage.Grid.addHook('afterColumnSort', function() {
			updateChartsByGrid();
		});

		// 表格选中行绘制饼图
		corePage.Grid.addHook('afterSelectionEnd', function(row) {
			var current = this.getDataAtRow(row);
			var stationId = current[COL_INDEX.STATION_ID];
			if (stationId === currentRow) return; //重复选择
			currentRow = stationId;

			var realCnt = current[COL_INDEX.REAL_CNT],
				predictCnt = current[COL_INDEX.PREDICT_CNT],
				missCnt = predictCnt - realCnt,
				title = current[COL_INDEX.STATION_NAME] + ' (' + stationId + ') ' + '，更新于' + current[COL_INDEX.UPDATE_TIME];
			// 生成饼图
			initPieChart(missCnt, realCnt, title);
		});

		// 过滤器
		var filters = corePage.Grid.getPlugin('filters');
		// 条件过滤后更新统计图
		filters.actionBarComponent.addLocalHook('accept', (function() {
			updateChartsByGrid();
		}));

		// 初始化统计图
		Handsontable.hooks.run(corePage.Grid, 'afterColumnSort');
	}
	// 动画
	function animateWrapper() {
		var wrappers = $('.wrapper').addClass('animated');
		wrappers.eq(0).addClass('slideInDown');
		wrappers.eq(1).addClass('slideInRight');
		wrappers.eq(2).addClass('slideInUp');
		$dashboard.css('background-color', '#ecf0f5');
	}
	/**
	 * 统计图
	 */
	function initChart(realCntArr, predictCntArr, stations) {
		var chartId = 'dashboard-chart';
		corePage.Chart = Highcharts.chart(chartId, $.extend(true, {}, ChartControl.defaults, {
			chart: { zoomType: 'x' },
			title: { text: false },
			legend: { enabled: false },
			xAxis: {
				categories: stations
			},
			yAxis: { title: { text: false } },
			tooltip: {
				formatter: function() {
					var y = [],
						tips = '',
						missRate;
					$.each(this.points, function() {
						y.push(this.y);
						tips += '<br/>' + this.series.name + ' = ' + this.y;
					});
					var miss = y[0] - y[1];
					missRate = Math.abs(miss / (miss > 0 ? y[0] : y[1])) * 100;
					return '<b>' + this.x + '</b><br/>缺测率 = ' + missRate.toFixed(2) + '%' + tips;
				}
			},
			series: [
				{ name: '应到数', data: predictCntArr, color: '#c8c8c8', type: 'areaspline' },
				{ name: '实到数', data: realCntArr, color: '#00c0ef' }
			]
		}));
	}
	/**
	 * 饼图
	 */
	function initPieChart(missCnt, realCnt, title) {
		var $pie = $('.pie-inner');
		$pie.highcharts($.extend(true, {}, ChartControl.defaults, {
			chart: { zoomType: 'x' },
			title: { text: title },
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: true,
						format: '<b>{point.name}</b>: {point.percentage:.2f} %',
						style: {
							color: 'black'
						}
					}
				}
			},
			tooltip: {
				formatter: function() {
					return '<b>' + this.key + '</b>：' +
						this.percentage.toFixed(2) + '%' + '<br/>' +
						this.y + ' / ' + this.total;
				}
			},
			series: [{
				type: 'pie',
				name: '',
				data: [{
					name: '缺测',
					y: missCnt,
					color: '#dd4b39',
					sliced: true,
					selected: true
				}, {
					name: '实测',
					y: realCnt,
					color: '#00c0ef'
				}]
			}]
		}));
	}
	/**
	 * 查询失败
	 */
	function queryFailed() {
		loader.hide();
		Alert.show('请求数据失败...  ' + new Date().toLocaleString('en-GB'), 'danger');
	}
	// 查询数据
	loader.show();
	Query.addHook('fail', queryFailed);
	Query.addQuery(G.URL.getDataService() + 'DataCompleteService/getDataComplete', { t: 0 }).query(function(queryData) {
		loader.hide();
		if (!G.isPretty(queryData)) {
			return queryFailed();
		}
		animateWrapper();
		// 当前时间
		var nowTime = moment(),
			// 更新时间
			updateTime = queryData[0].updateTime,
			// 距今天数
			fromToday = (moment(nowTime).startOf('day') - moment(updateTime).startOf('day')) / 86400000,
			// 实际站点数
			stationCnt = queryData.length,
			// 总缺测率
			missRateTotal = 0,
			// 总缺测数
			missCntTotal = 0,
			// 总应到数
			predictCntTotal = 0,
			// 总实到数
			realCntTotal = 0,
			i;
		// 计算
		for (var i = 0; i < stationCnt; i++) {
			var item = queryData[i];
			realCntTotal += item.realCnt;
			predictCntTotal += item.predictCnt;
		}
		missCntTotal = predictCntTotal - realCntTotal;
		missRateTotal = 100 * missCntTotal / predictCntTotal;

		// 头部简报
		var $boxContainer = $dashboard.find('.box-inner');
		// 站点报表
		$boxContainer.eq(0).html(initBox({
			title: '站点数',
			data: stationCnt + '<sup> /' + STATION_ALL_CNT + '</sup>',
			background: 'blue',
			icon: 'fa fa-globe',
			progress: stationCnt / STATION_ALL_CNT * 100,
			desc: stationCnt >= STATION_ALL_CNT ? '所有站点均有数据' : (STATION_ALL_CNT - stationCnt) + '无数据'
		}));
		// 缺测率
		$boxContainer.eq(1).html(initBox({
			title: '缺测率',
			background: 'red',
			icon: 'fa fa-tachometer',
			data: missRateTotal.toFixed(2) + '<sup>%</sup>',
			progress: missRateTotal,
			desc: '实到数' + realCntTotal + ' ~ 缺测数' + missCntTotal
		}));
		// 更新时间
		$boxContainer.eq(2).html(initBox({
			title: '更新时间',
			background: 'green',
			icon: 'fa fa-clock-o',
			data: moment(updateTime).format('YYYY年MM月DD日'),
			progress: fromToday < 10 ? (10 - fromToday) * 10 : 0,
			desc: '刷新时间：' + nowTime.format('YYYY/MM/DD HH:mm:ss')
		}));

		// 初始化表格
		initGrid(queryData);

	});
}

function initPage() {
	var queryType;

	function getCondition() {
		var para = {
			orderType: queryType,
			EleType: $eleRadios.siblings('.active').val(),
			startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
		};
		corePage.qCondition.set(para);
		return para;
	}

	function display(data) {

		var cols = [{
			title: '日期',
			data: 'Date',
			renderer: function(instance, td, row, col, prop, value, cellProperties) {
				var date = moment(value, 'YYYY年MM月DD日');
				var args = Array.prototype.slice.call(arguments);
				args[5] = date.format('YYYY-MM-DD');
				Handsontable.renderers.TextRenderer.apply(this, args);
			}
		}];
		var schema = data[0];
		for (var key in schema) {
			if (key === 'Date') continue;
			var stationName = key.split('_')[1];
			cols.push({ title: stationName, data: key, type: 'numeric', format: '0.0' });
		}
		corePage.Grid = corePage.grid(cols, data, { pagination: false });
	}

	this.page();
	// 工具栏
	corePage.toolbar(tpl.TOOLBAR.grid);
	// 类型
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '排序',
		items: [
			{ text: '业务站号顺序', attr: { value: 'SEQ' } },
			{ text: '站点自然顺序', attr: { value: 'STATION' } },
		],
		handler: function() {
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	// 日期选择
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date', className: 'query-item-0' });
	// 要素选择
	var $eleRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '统计要素',
		items: [
			{ text: '平均气温', attr: { value: 'AVGTEM' } },
			{ text: '最高气温', attr: { value: 'AVGTEMMAX' } },
			{ text: '最低气温', attr: { value: 'AVGTEMMIN' } },
			{ text: '08-08降水', attr: { value: 'PRETIME0808' } },
			{ text: '08-20降水', attr: { value: 'PRETIME0820' } },
			{ text: '20-08降水', attr: { value: 'PRETIME2008' } },
			{ text: '20-20降水', attr: { value: 'PRETIME2020' } },
			{ text: '相对湿度', attr: { value: 'RHUAVG' } },
			{ text: '平均风速', attr: { value: 'WINS2MIAVG' } },
			{ text: '平均气压', attr: { value: 'PRSAVG' } },
			{ text: '日照时数', attr: { value: 'SSH' } },
			{ text: '最小能见度', attr: { value: 'VISMIN' } }
		],
		handler: function() {
			corePage.onStatistics();
		}
	});

	function query(para) {
		tpl.ext.query('ClimDataQuery/queryClimByTimesRangeAndElement', para, function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		})
	}

	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		var yearStep = 5;
		var startTime = moment(para.startTime);
		var endTime = moment(para.endTime);
		var pages = Math.ceil((endTime.year() - startTime.year()) / yearStep)
		// 大于5年 分页
		if (pages > 1) {
			corePage.paginate({
				pages: pages,
				limit: 365
			}, function(indexes, cursors) {
				var current = cursors[0];
				var startDate = startTime.clone().add(yearStep * (current - 1), 'y').add(1, 'd')
				var endDate = startTime.clone().add(yearStep * current, 'y')
				if (endDate.isAfter(endTime)) endDate = endTime
				query($.extend({}, para, {
					startTime: startDate.format(tpl.FORMATTER.date),
					endTime: endDate.format(tpl.FORMATTER.date)
				}))
			})
			query($.extend({}, para, {
				endTime: startTime.clone().add(yearStep, 'y').format(tpl.FORMATTER.date)
			}))
		} else {
			corePage.paginate('destroy')
			query(para)
		}

	});
	//默认
	triggerActiveRadio($typeRadios);

}

function initDayPage() {
	var queryType;
	var colProp = [ //SEQ表格col字典
		{ title: '站号', data: 'Station_Id_C' },
		{ title: '站名', data: 'Station_Name' },
		{ title: '均温(℃)', data: 'TEM_Avg', type: 'numeric', format: '0.0' },
		{ title: '高温(℃)', data: 'TEM_Max', type: 'numeric', format: '0.0' },
		{ title: '低温(℃)', data: 'TEM_Min', type: 'numeric', format: '0.0' },
		{ title: '日雨量08(mm)', data: 'PRE_Time_0808', type: 'numeric', format: '0.0' },
		{ title: '日雨量20(mm)', data: 'PRE_Time_2020', type: 'numeric', format: '0.0' },
		{ title: '日照(h)', data: 'SSH', type: 'numeric', format: '0.0' },
		{ title: '相对湿度(%)', data: 'RHU_Avg', type: 'numeric', format: '0.0' },
		{ title: '最低能见度(m)', data: 'VIS_Min', type: 'numeric', format: '0.0' },
		{ title: '风速(m/s)', data: 'WIN_S_2mi_Avg', type: 'numeric', format: '0.0' },
		{ title: '气压(hPa)', data: 'PRS_Avg', type: 'numeric', format: '0.0' }
	];

	function getCondition() {
		var para = {
			orderType: queryType,
			// elements: $eleRadios.siblings('.active').val(),
			elements: 'Station_Id_C,Station_Name,TEM_Avg,TEM_Max,TEM_Min,PRE_Time_0808,PRE_Time_2020,SSH,RHU_Avg,VIS_Min,WIN_S_2mi_Avg,PRS_Avg',
			time: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date)
		}
		corePage.qCondition.set(para);
		return para;
	}

	function display(data) {
		corePage.toolbar(tpl.TOOLBAR.grid);

		corePage.Grid = corePage.grid(colProp, data);

	}

	this.page();
	// 类型
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '排序',
		items: [
			{ text: '业务站号顺序', attr: { value: 'SEQ' } },
			{ text: '站点自然顺序', attr: { value: 'STATION' } },
		],
		handler: function() {
			queryType = $(this).val();
			corePage.onStatistics();
		}
	});
	// 日期选择
	var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date', single: true, className: 'query-item-1', config: { startDate: moment().subtract('d', 1) } });
	// 要素选择
	// var $eleChecks = tpl.Plugin.checkbtn(this.$condition, {
	//     title: '要素选择',
	//     className: 'query-item-1',
	//     items: [
	//         { text: '站号', checked: true, attr: { value: 'Station_Id_C' } },
	//         { text: '站名', checked: true, attr: { value: 'Station_Name' } },
	//         { text: '气温均值', checked: true, attr: { value: 'TEM_Avg' } },
	//         { text: '最大气温', checked: true, attr: { value: 'TEM_Max' } },
	//     ]
	// });

	this.condition();
	this.onStatistics(function(event) {
		event.preventDefault();
		var para = getCondition();
		tpl.ext.query('ClimDataQuery/queryClimByTime', para, function(data) {
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

}

/**
 * 激活单选项触发事件
 * @param  {[type]}   $ele [description]
 * @return {[type]}        [description]
 */
function triggerActiveRadio($ele) {
	$ele.siblings('.active').removeClass('active').click();
};

/**
 * 补录数据
 */
function fillData() {
	if (!G.User.getAuthority().A) return layer.msg('对不起，您无权操作');
	var $datepicker = null;
	var layerIndex = layer.confirm(`
<div id="fillData-container">
	<div class="query-time" style="text-align:center;">
	    <span class="custom-datepicker">开始<input type="text" class="start custom-datepicker"></span>
	    <span class="custom-datepicker">结束<input type="text" class="end custom-datepicker"></span>
	</div>
</div>`, {
		title: '数据补录',
		btn: ['确认并开始', '取消'],
		closeBtn: 0,
		// skin: 'layui-layer-molv',
		success: function() {
			$datepicker = $('.query-time').customDatePicker({
				startDate: moment().subtract(1, 'd'),
				endDate: moment().subtract(1, 'd')
			})
			$('.daterangepicker.dropdown-menu').css('z-index', 999999990)
		}
	}, function() { //确认
		var $btns = $('.layui-layer-btn a').addClass('btn').prop('disabled', true)
		var loader = new tpl.Plugin.loader('#fillData-container').show('数据补录中，请稍候');
		var url = G.URL.getDataService() + 'DataRecordService/recordByTimes'
		$.post(url, G.paramize({
			startTime: $datepicker.find('input.start').val(),
			endTime: $datepicker.find('input.end').val()
		})).done(function(res) {
			loader && loader.destroy && loader.destroy();
			$btns.prop('disabled', false);
			if (res) {
				layer.close(layerIndex);
				layer.msg('数据补录成功');
			} else {
				layer.msg('数据补录失败，请重试');
			}
		}).fail(function() {
			loader && loader.destroy && loader.destroy();
			$btns.prop('disabled', false);
			layer.msg('数据补录请求失败，请重试');
		})
	})
}
