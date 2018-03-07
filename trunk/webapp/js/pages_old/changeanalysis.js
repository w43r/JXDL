/**
 * 变化分析
 * @author  rexer rexercn@gmail.com
 * @version 0.0.1
 * @date    2016-11-02
 */

var corePage;

function run() {
	corePage = new tpl('气候变化分析').ready(function(event) {
		corePage.StationData = null;
		corePage.Grid = null;
		corePage.Chart = null;
		corePage.Map = null;
		corePage.Alert = new tpl.Plugin.alert('.resultPanel');
		tpl.ext.loadStation(function(data) { //回调
			corePage.StationData = data;
			corePage.menu([
				{ text: '气候变化检测', value: 'm1', handler: detectPage },
				{ text: '气候变化影响评估', value: 'm2', handler: assessPage }
			]);
		});
	});
}
/**
 * 遍历Station数组
 * @param  {[type]}   value [description]
 * @param  {String}   key   [description]
 * @return {Object}         [description]
 */
var getStation = function(value, key) {
	key = key || 'station_Id_C';
	for (var i = corePage.StationData.length; i--;) {
		var item = corePage.StationData[i];
		if (item[key] === value) return item;
	}
	return null;
};

/**
 * 气候变化检测
 */
function detectPage() {
	var queryData;
	var displayPara; // 展示参数
	var displayType = 'grid';
	var conditionType = 'query';

	/**
	 * 获取检索条件
	 */
	function getConditionForQuery() {
		var dateType = $dateRadios.siblings('.active').val();
		var para = {
			startYear: Number($year_h.find('.start').val()),
			endYear: Number($year_h.find('.end').val()),
			FilterType: $operators.siblings('.active').val() || '',
			min: $('#jxMinValue').val(),
			max: $('#jxMaxValue').val(),
			contrast: $('#jxValue').val(),
			StatisticsType: $results.siblings('.active').val(),
			EleType: $typeRadios.siblings('.active').val(),
			standardStartYear: Number($year_p.find('.start').val()),
			standardEndYear: Number($year_p.find('.end').val()),
			station_Id_C: $areapanel.customStationPanel('getCodes'), //默认国家站
			_service_: $typeRadios.siblings('.active').data('service') || 'SameCalendarService/same'
		};
		if (!para.min) delete para.min;
		if (!para.max) delete para.max;
		if (!para.contrast) delete para.contrast;
		if ($('.same-index-check').is(':checked')) para.MissingRatio = 1 / parseFloat($('.same-index-input').val())
		switch (dateType) {
			case 'datepicker':
				var startTime = $datepicker.customDatePicker('getStartTime'),
					endTime = $datepicker.customDatePicker('getEndTime');
				$.extend(para, {
					startDay: startTime.date(),
					endDay: endTime.date(),
					startMon: startTime.month() + 1,
					endMon: endTime.month() + 1,
				});
				break;
			case 'months':
				var months = [];
				$.each($months.siblings('.active'), function() {
					months.push($(this).val());
				});
				$.extend(para, {
					monthes: months.join()
				});
				break;
			case 'years':
				$.extend(para, {
					startDay: 1,
					startMon: 1,
					endDay: 31,
					endMon: 12,
					resultDisplayType: 2
				});
				break;
		}
		corePage.qCondition.set(para);
		return para;
	}

	/**
	 * 初始化表格
	 */
	function initGrid(data) {
		var data0 = data[0],
			hasYear = data0.hasOwnProperty('year') && displayPara[0].data !== 'year',
			hasYears = data0.hasOwnProperty('yearsStr') && displayPara[0].data !== 'yearsStr',
			isYearsChecked = $dateRadios.siblings('.active').val() === 'years',
			endYearPara = getConditionForQuery().endYear;

		// 显示的字段列
		var cols = hasYears && isYearsChecked ? [{
			title: '年代',
			data: 'yearsStr'
		}, {
			title: '年份',
			data: 'yearsStr',
			renderer: function() {
				var args = [].slice.call(arguments);
				var year = Number(args[5].substr(0, 4));
				var startYear = year + 1;
				var endYear = year + 10;
				args[5] = startYear + '-' +
					(endYearPara < endYear ? endYearPara : endYear);
				Handsontable.renderers.TextRenderer.apply(this, args);
			}
		}] : (hasYear ? [{ title: '年份', data: 'year' }] : []);

		// 剔除隐藏列
		displayPara.forEach(function(item) {
			if (item.hide && item.hide.indexOf('grid') > -1) return;
			if(item.data != 'station_Id_C')
				item.format = '0.00'; // 保留一位小数
			item.type = 'numeric';
			cols.push(item);
		});
		corePage.Grid = corePage.grid(cols, data);
	}
	/**
	 * 初始化统计图
	 */
	function initChart(data, opts) {
		var $item = $typeRadios.siblings('.active'), //气象要素
			item_name = $item.text(), //气象要素名称
			item_unit = $item.attr('data-unit') || '', //单位
			$calc = $calcRadios.siblings('.active'), //检测方法
			calc_name = $calc.text(), //检测方法名
			isQuery = $condtionSwitch.siblings('.active').val() === 'query', //是否为查询
			title = item_name + (isQuery ? '序列图' : calc_name), //标题
			xValueKey = data[0].hasOwnProperty('x') ? 'x' : 'year', //X轴数据的Key值
			isYearsChecked = $dateRadios.siblings('.active').val() === 'years', // 是否为年份
			endYearPara = getConditionForQuery().endYear;

		var x_series = [], //X轴
			y_series = [], //Y轴
			series = {}, // Y数据
			plotLines = [];
		data.forEach(function(item, i) {
			x_series.push(item[xValueKey]);
			// 多个Y轴
			displayPara.forEach(function(serie) {
				if (serie.hide && serie.hide.indexOf('chart') > -1) return;
				if (serie.title === '要素值') serie.title = item_name;
				if (serie.hasOwnProperty('plotLine')) {
					plotLines.push([serie.plotLine, serie.title]);
					return;
				}
				var valueKey = serie.data;
				var value = item[valueKey];
				if (value === undefined) value = null; //为空处理
				if (!series[valueKey]) series[valueKey] = { data: [], name: serie.title || item_name };
				series[valueKey].data.push(value);
			});
		});
		for (var key in series) {
			y_series.push(series[key]);
		}

		// 标题
		var para = getConditionForQuery();
		var year_str = para.startYear + ' - ' + para.endYear;
		var date_str = para.startMon ? moment().month(para.startMon - 1).date(para.startDay).format('MM-DD') + ' - ' + moment().month(para.endMon - 1).date(para.endDay).format('MM-DD') : '';
		var chartOpts = {
			chart: { type: 'spline' },
			title: { text: title },
			subtitle: { text: '历年：' + year_str + '， 同期：' + date_str },
			plotOptions: {
				series: {
					dataLabels: {
						//默认标注保留1位小数
						formatter: function() {
							return this.y.toFixed(1);
						}
					}
				}
			}
		}
		if (isYearsChecked && conditionType === 'query') {
			chartOpts.xAxis = {
				labels: {
					formatter: function() { // 按年代格式化
						var startYear = this.value;
						var endYear = startYear + 9;
						return startYear + '-' + (endYearPara < endYear ? endYearPara : endYear);
					}
				}
			}
		}
		// 生成统计图
		corePage.Chart = corePage.chart({ categories: x_series }, {
			title: { text: item_name + '(' + item_unit + ')' },
			plotLines: ChartControl.stylePlotLineArr(plotLines)
		}, y_series, $.extend(true, chartOpts, opts));
	}
	/**
	 * 切换呈现方式
	 */
	function display(data) {
		corePage.$toolbar.empty();
		corePage.$panel.empty();
		if (!$.isArray(data)) {
			corePage.Alert.show('获取数据出错...');
			return;
		} else if (data.length === 0) {
			corePage.Alert.show('该时段（条件）没有统计结果...');
			return;
		}
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		switch (displayType) {
			case 'grid':
				initGrid(data);
				break;
			case 'chart':
				initChart(data);

				// 添加X轴显示间隔控制
				$('<div class="tpl-toolbar-group"></div>')
					.append('<span class="tpl-toolbar-title">X轴显示间距</span>')
					.append('<input type="number" min="1" placeHolder="默认" class="tpl-toolbar-item">')
					.on('change', 'input', function(event) {
						event.preventDefault();
						var stepNum = Number($(this).val()) || null;
						corePage.Chart.updateSetting({
							xAxis: { labels: { step: stepNum } }
						});
					}).appendTo(corePage.$toolbar);


				// 显示常量 -- 多年均值
				// if (conditionType === 'query') {
				// 	var avgValue = data[0].avgValue;
				// 	if (avgValue == null) return;
				// 	corePage.Chart.updateSetting({
				// 		yAxis: {
				// 		    plotLines: ChartControl.stylePlotLines([avgValue, '多年均值'])
				// 		}
				// 	});
				// }

				break;
			default:
				$display.eq(0).click();
				break;
		}
	}

	/**
	 * 图表Chart配置更新
	 * @author rexer
	 * @date   2017-04-24
	 * @param  {Boolean}  hasZero     是否绘制0轴线
	 * @param  {Boolean}  hasNoYTitle 是否移除Y轴标题
	 * @param  {String}   formula     展示公式
	 */
	function deal2Chart(hasZero, hasNoYTitle, formula) {
		if (displayType !== 'chart') return;
		var options = {
			yAxis: {}
		};
		// 距平统计图添加常量线
		if (hasZero) {
			var plotLinesNow = corePage.Chart.option.yAxis.plotLines || [];
			options.yAxis.plotLines = plotLinesNow.concat({
				id: 'pl_zero',
				value: 0,
				color: '#333',
				width: 1.2,
				zIndex: 1
			});
		}
		// 去掉Y轴title
		if (hasNoYTitle) {
			options.yAxis.title = {
				text: ''
			};
		}
		// 更新
		(hasZero || hasNoYTitle) && corePage.Chart.updateSetting(options);
		//添加公式
		if (formula) {
			setTimeout(function() {
				$('<div class="formula"></div>').html(formula).prependTo('.highcharts-container');
			}, 350)
		}
	}

	/**
	 * 取反Renderer
	 */
	function negaRenderer() {
		var args = [].slice.call(arguments);
		var value = args[5];
		if (value != null) {
			args[5] = -value;
		}
		Handsontable.renderers.TextRenderer.apply(this, args);
	}

	function queryHandler() {
		displayPara = [
			{ title: '要素值', data: 'value' },
			{ title: '多年均值', data: 'avgValue', type: 'numeric', format: '0.00' },
			{ title: '距平', data: 'anomaly', type: 'numeric', format: '0.00' },
			{ title: '距平百分率', data: 'anomalyRate', type: 'numeric', format: '0.00' }
		];
		var para = getConditionForQuery();
		tpl.ext.query(para._service_, getConditionForQuery(), function(data) {
			if (tpl.ext.isExpectedType(data)) {
				queryData = data;
				display(data);
			} else {
				console.log(data);
				queryData = null;
				display([]);
			}
		});
	}

	function calcHandler() {
		corePage.toolbar(tpl.TOOLBAR[displayType] || []);
		var queryPara = getConditionForQuery();
		var queryElement = $typeRadios.siblings('.active').text();
		var calcType = Number($calcRadios.siblings('.active').val());
		var hasZero = !!$calcRadios.siblings('.active').attr('data-line-zero');
		var hasNoYTitle = false; //无标题
		var displayData = [];
		var formula = null; //公式
		switch (calcType) {
			case 0: //距平分析
				// if (displayType == 'map' || displayType == 'surfer') {
				//     tpl.ext.query('SameCalendarService/sameByStation', getConditionForQuery(), function(data) {
				//         if (!$.isArray(data)) return;
				//         corePage.$panel.empty();
				//         if (displayType == 'map') {
				//             corePage.Map = corePage.map({
				//                 dataSchema: { value: 'anomaly' },
				//                 style: { type: 'gradient', styles: { type: 1 } },
				//                 title: $typeRadios.siblings('.active').text() + '空间分布'
				//             }, data);
				//         } else corePage.Surfer = corePage.surfer({ dataSchema: { value: 'anomaly' } }, data);
				//     });
				//     return;
				// }
				displayPara = [
					{ title: '距平', data: 'anomaly', type: 'numeric', format: '0.00' },
				];
				displayData = queryData ? queryData.concat() : [];
				break;
			case 1: //累积距平
				displayPara = [
					{ title: '距平', data: 'anomaly', type: 'numeric', format: '0.00' },
					{ title: '累积距平', data: 'anomalySum', type: 'numeric', format: '0.00' }
				];
				displayData = Calc.sumAnomaly(queryData);
				break;
			case 2:
				var linearType = $linearType.siblings('.active').val();
				if (linearType === 'year') { //历年查询
					displayPara = [
						{ title: '要素值', data: 'value', type: 'numeric', format: '0.00' },
						{ title: '线性估计值', data: 'linears', type: 'numeric', format: '0.000' }
					];
					var linears = Calc.linears(queryData);
					displayData = linears.data;
					var linear = linears.linear;
					formula = '<p>Y = ' + linear.b.toFixed(3) + ' * X' + (linear.a > 0 ? ' + ' : ' - ') + Math.abs(linear.a).toFixed(3) + '</p><p>R = ' + linear.r.toFixed(4) + '</p>';
				} else {
					//查询站次参数
					var para = getConditionForQuery();
					var yearStr = para.startYear + '-' + para.endYear;
					// 计算序列长度(样本数)
					var N = para.endYear - para.startYear + 1;
					// 相关系数
					var Rs = Calc.linearR(N);
					// 查询每个站历年要素
					tpl.ext.query('SameCalendarService/linearByStation', para, function(data) {
						if (!$.isArray(data)) {
							display(data);
							return;
						}
						var results = [];
						//计算每个站点的线性趋势
						data.forEach(function(item, index) {
							// 历年同期值序列
							var values = [];
							var dataIndex = index + 1;
							var yearValues = item.yearValuesMap;
							for (var key in yearValues) {
								values.push(yearValues[key]);
							}
							var linear = Calc.linear(values);
							// 加入结果集
							results.push({
								station_Id_C: item.station_Id_C,
								station_Name: item.station_Name,
								x: item.station_Name, //X轴
								r: linear.r,
								r5: Rs.r005,
								r1: Rs.r001,
								nr5: -(Rs.r005),
								nr1: -(Rs.r001),
								b10: linear.b * 10,
								a: linear.a
							});
						});
						// 结果呈现
						if (displayType == 'map') {
							var MC = corePage.map({
								style: { type: 'gradient', styles: { type: 1 } },
								dataSchema: { value: 'r' },
								title: yearStr + '年 ' + queryElement + '线性趋势空间分布',
								subtitle: yearStr
							}, results, false);
							// 按R值大小区域填色

							MC.fillRegionColor(results, function(value, index) {
								var absR = Math.abs(value);
								var v = index + 1;
								// 浅色
								if (absR >= Rs.r001) return {
									stroke: false,
									fill: true,
									fillColor: '#81d4fa',
									fillOpacity: '0.9'
								};
								// 深色
								if (absR >= Rs.r005) return {
									stroke: false,
									fill: true,
									fillColor: '#03a9f4',
									fillOpacity: '0.9'
								};
								return {
									stroke: false,
									fill: true,
									fillColor: '#01579b',
									fillOpacity: '0.9'
								};
							}, ['stationcode', 'station_Id_C']);
							MC.LegendManager.load({
								type: 'fill',
								styles: [
									[-Infinity, Rs.r005, {
									fillColor: '#01579b',
									title: '<=0.01信度'
									}],
									[Rs.r005, Rs.r001, {
										fillColor: '#03a9f4',
										title: '<=0.05信度'
									}],
									[Rs.r001, Infinity, {
										fillColor: '#81d4fa',
										title: '>0.05信度'
									}]
								]
							}, null);
							corePage.Map = MC;
						} else if (displayType == 'surfer') {
							corePage.Surfer = corePage.surfer({
							 dataSchema: {value:'b10'}
							}, results)
						} else {
							displayPara = [
								{ title: '站名', data: 'station_Name', hide: 'chart' },
								{ title: '站号', data: 'station_Id_C', hide: 'chart' },
								{ title: 'a', data: 'a', type: 'numeric', format: '0.00' },
								{ title: '10b', data: 'b10', type: 'numeric', format: '0.00' },
								{ title: 'r', data: 'r', type: 'numeric', format: '0.00' },
								{ title: '0.05信度', data: 'r5', type: 'numeric', format: '0.00' },
								{ title: '0.01信度', data: 'r1', type: 'numeric', format: '0.00' },
								{ title: '-0.05信度', data: 'nr5', type: 'numeric', format: '0.00' },
								{ title: '-0.01信度', data: 'nr1', type: 'numeric', format: '0.00' }
							];
							display(results);
						}
					});
					return;
				}

				break;
			case 3: //滑动平均
				var len = Number($calc_item_3.find('select').val());
				displayPara = [
					{ title: '要素值', data: 'value' },
					{ title: '滑动平均', data: 'mavg' }
				];
				displayData = Calc.mavg(queryData, len);
				break;
			case 4: //滑动T平均
				var len = Number($calc_item_4.find('select').val());
				displayPara = [
					{ title: '距平', data: 'anomaly' },
					{ title: '滑动T统计量', data: 'mavgt', type: 'numeric', format: '0.0' },
					{ title: '信度水平0.05', data: 't005', type: 'numeric', format: '0.00' },
					{ title: '信度水平0.01', data: 't001', type: 'numeric', format: '0.00' },
					{ title: '信度水平-0.05', data: 'nt005', type: 'numeric', format: '0.00' },
					{ title: '信度水平-0.01', data: 'nt001', type: 'numeric', format: '0.00' }
				];
				displayData = Calc.mavgt(queryData, len);
				hasNoYTitle = true;
				break;
			case 5: //MK突变
				displayPara = [
					{ title: '要素值', data: 'value', type: 'numeric', format: '0.00' },
					{ title: 'UF', data: 'uf', type: 'numeric', format: '0.00' },
					{ title: 'UB', data: 'ub', type: 'numeric', format: '0.00' },
					{ title: '0.05信度', data: 't95' },
					{ title: '-0.05信度', data: 'nt95' }
				];
				displayData = Calc.mkMut(queryData);
				hasNoYTitle = true;
				break;
			case 6: //MK趋势
				var para = getConditionForQuery();
				para.groupByStation = 'true';
				var yearStr = para.startYear + '-' + para.endYear;
				tpl.ext.query('SameCalendarService/same', para, function(data) {
					if (!data) return;
					// 数据处理结果集
					var linkData = {};
					// 插入对应站点的数据
					function update(key, value) {
						if ($.isArray(linkData[key])) linkData[key].push(value);
						else linkData[key] = [value];
					}
					for (var year in data) {
						var item = data[year];
						// 读取每个站数据
						for (var key in item) {
							update(key, item[key]);
						}
					}
					// 计算每个站的MK趋势
					var results = [];
					displayPara = [
						{ title: '站点', data: 'x', hide: 'chart' },
						{ title: '站号', data: 'station_Id_C', hide: 'chart',format:'0' },
						{ title: 'Z值', data: 'value', type: 'numeric', format: '0.00' },
						{ title: '0.1信度', data: 't90', type: 'numeric', format: '0.00' },
						{ title: '0.05信度', data: 't95', type: 'numeric', format: '0.00' },
						{ title: '0.01信度', data: 't99', type: 'numeric', format: '0.00' },
						{ title: '-0.1信度', data: 'nt90', type: 'numeric', format: '0.00' },
						{ title: '-0.05信度', data: 'nt95', type: 'numeric', format: '0.00' },
						{ title: '-0.01信度', data: 'nt99', type: 'numeric', format: '0.00' }
					];
					for (var station in linkData) {
						var stations = station.split('_'),
							stationName = stations[1],
							stationId = stations[0];
						var mk = Calc.mkTrend(linkData[station]);
						results.push({
							x: stationName,
							station_Id_C: stationId,
							value: mk,
							t90: 1.28,
							t95: 1.64,
							t99: 2.32,
							nt90: -1.28,
							nt95: -1.64,
							nt99: -2.32
						});
					}
					if (displayType === 'map') {
						// 信度值
						var T90 = 1.28;
						var T95 = 1.64;
						var T99 = 2.32;

						var MC = corePage.map({
							style: { type: 'gradient', styles: { type: 1 } },
							dataSchema: { value: 'value' },
							title: yearStr + '年 ' + queryElement + ' MK趋势空间分布',
							subtitle: yearStr
						}, results, false);
						// 按R值大小区域填色

						MC.fillRegionColor(results, function(value, index) {
							var absR = Math.abs(value);
							var v = index + 1;

							// if (absR < T90) {

							// } else if (absR >= T90) {

							// } else
							if (absR >= T95) {
								return {
									stroke: false,
									fill: true,
									fillColor: '#03a9f4',
									fillOpacity: '0.9'
								};
							} else if (absR >= T99) {
								return {
									stroke: false,
									fill: true,
									fillColor: '#01579b',
									fillOpacity: '0.9'
								};
							}
							return {
								stroke: false,
								fill: true,
								fillColor: '#81d4fa',
								fillOpacity: '0.9'
							};
						}, ['stationcode', 'station_Id_C']);
						corePage.Map = MC;
						MC.LegendManager.load({
							type: 'fill',
							styles: [
								[T90, T95, {
									fillColor: '#81d4fa',
									title: '0.1信度'
								}],
								[T95, T99, {
									fillColor: '#03a9f4',
									title: '0.05信度'
								}],
								[T99, Infinity, {
									fillColor: '#01579b',
									title: '0.01信度'
								}]
							]
						}, null);
					} else if (displayType == 'surfer') {
						debugger
						corePage.Surfer = corePage.surfer({
						 dataSchema: { value: 'value' }
						}, results)
					} else {
						display(results);
						deal2Chart(false, true, false);
					}
				});
				return;
			default:
				return;
		}
		display(displayData);
		// 展示
		display(displayData);
		deal2Chart(hasZero, hasNoYTitle, formula);
	}

	// ======================== 页面 ========================
	this.page();

	// 条件控制
	var $condtionSwitch = tpl.Plugin.radiobtn(this.$condition, {
		title: false,
		items: [
			{ text: '数据查询', attr: { data: '.condition-query-item', value: 'query' } },
			{ text: '数据检测', attr: { data: '.condition-calc-item', value: 'calc' } }
		],
		handler: function(event) {
			conditionType = $(this).val();
			tpl.ext.toggleCondition(this);
			if (conditionType === 'query') {
				corePage.onStatistics(queryHandler).text('查询').show();
				triggerActiveRadio($typeRadios);
			} else {
				corePage.onStatistics(calcHandler).text('计算').hide();
				triggerActiveRadio($calcRadios);
			}
		}
	});
	// 按钮尺寸调整
	$condtionSwitch.css('transform', 'scale(1.2)')
		.eq(0).css('margin-right', '3rem')

	// ======================== 统计计算条件项 ========================
	// 计算类型
	var $calcRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '检测方法',
		className: 'condition-calc-item',
		items: [
			{ text: '距平分析', attr: { value: 0, 'data-line-zero': true, data: '.condition-calc-item-0' } },
			{ text: '累积距平', attr: { value: 1, 'data-line-zero': true, data: '.condition-calc-item-1' } },
			{ text: '线性趋势', attr: { value: 2, data: '.condition-calc-item-2' } },
			{ text: '滑动平均', attr: { value: 3, data: '.condition-calc-item-3' } },
			{ text: '滑动T检验', attr: { value: 4, 'data-line-zero': true, data: '.condition-calc-item-4' } },
			{ text: 'MK突变', attr: { value: 5, 'data-line-zero': true, data: '.condition-calc-item-5' } },
			{ text: 'MK趋势', attr: { value: 6, 'data-line-zero': true, data: '.condition-calc-item-6' } }
		],
		handler: function(event) {
			tpl.ext.toggleCondition(this);
			if (this.value == 2) {
				triggerActiveRadio($linearType);
			} else {
				corePage.onStatistics();
			}
		}
	});
	// 滑动平均
	var $calc_item_3 = tpl.Plugin.customize(this.$condition, function() {
		var html = '<select class="btn btn-primary">';
		for (var i = 3; i <= 15; i = i + 2) {
			if (i == 9) html += '<option selected>' + i + '</option>'
			else html += '<option>' + i + '</option>';
		}
		return html + '</select>';
	}(), {
		title: '滑动长度(年)',
		className: 'condition-calc-item condition-calc-item-3',
	}).on('change', 'select', function(event) {
		corePage.onStatistics();
	});

	// 滑动平均t
	var $calc_item_4 = tpl.Plugin.customize(this.$condition, function() {
		var html = '<select class="btn btn-primary">';
		for (var i = 3; i <= 20; i++) {
			if (i == 9) html += '<option selected>' + i + '</option>'
			else html += '<option>' + i + '</option>';
		}
		return html + '</select>';
	}(), {
		title: '滑动长度(年)',
		className: 'condition-calc-item condition-calc-item-4'
	}).on('change', 'select', function(event) {
		corePage.onStatistics();
	});


	// ======================== 数据检索条件项 ========================
	var $areapanel = tpl.Plugin.areapanel(this.$condition, {
		title: '站点',
		className: 'condition-query-item',
		config: {
			single: false,
			title: '站点选择',
			labels: {
				btn: '{areaName}·{stationCode}'
			}
		}
	}).on('close.station', function(event) {
		event.preventDefault();
		corePage.onStatistics();
	});
	var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '要素',
		className: 'condition-query-item',
		items: [
			{ text: '平均气温', attr: { 'data-unit': '°C', value: 'AVGTEM' } },
			{ text: '最高气温', attr: { 'data-unit': '°C', value: 'AVGTEMMAX' } },
			{ text: '最低气温', attr: { 'data-unit': '°C', value: 'AVGTEMMIN' } },
			{ text: '08-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME0808' } },
			{ text: '08-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME0820' } },
			{ text: '20-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME2008' } },
			{ text: '20-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME2020' } },
			{ text: '相对湿度', attr: { 'data-unit': '%', value: 'RHUAVG' } },
			{ text: '平均风速', attr: { 'data-unit': 'm/s', value: 'WINS2MIAVG' } },
			{ text: '平均气压', attr: { 'data-unit': '百帕', value: 'PRSAVG' } },
			{ text: '日照时数', attr: { 'data-unit': 'h', value: 'SSH' } },
			{ text: '最小能见度', attr: { 'data-unit': 'h', value: 'VISMIN' } },
			{ text: '气温日较差', attr: { 'data-unit': '°C', value: 'TEMGAP' } },
		],
		handler: function(event) {
			corePage.onStatistics();
		}
	});
	// 时间条件
	var $dateRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '检索时间',
		className: 'condition-query-item',
		items: [
			{ text: '时段', attr: { value: 'datepicker' } },
			{ text: '年代', attr: { value: 'years' } },
			{ text: '月份(多选)', attr: { value: 'months' } },
		],
		handler: function(event) {
			var dateType = $(this).val();
			var $date = $('.date-condition.' + dateType);
			var $date_or = $('.date-condition:not(.' + dateType + ')');
			if ($date.length > 0) $date.removeClass('hidden');
			if ($date_or.length > 0) $date_or.addClass('hidden');
		}
	});
	// 时段选择
	var $datepicker = tpl.Plugin.datepicker(this.$condition, {
		type: 'date',
		className: 'date-condition datepicker condition-query-item',
		title: false,
		ctrl: '<span class="custom-datepicker" style="display: inline-block; width:100%;">' +
			// '<input type="number" class="custom-datepicker ext year"></input>' +
			'<select class="custom-datepicker ext month"></select>' +
			'<select class="custom-datepicker ext hou"></select>' +
			'</span>',
		config: {
			minDate: moment(moment().year() - 1 + '-12-01'),
			maxDate: moment().endOf('year'),
			locale: {
				format: 'MM-DD'
			}
		}
	});

	// 月份多选
	var $months = tpl.Plugin.checkbtn(this.$condition, {
		title: false,
		className: 'date-condition months hidden condition-query-item',
		items: function() {
			var months = [];
			for (var month = 1; month <= 12; month++) {
				months.push({ text: month + '月', attr: { value: month } });
			}
			months[moment().month()].checked = true;
			return months;
		}()
	});

	var $year_h = tpl.Plugin.year(this.$condition, { className: 'condition-query-item', type: 'history', title: '统计年份' });

	var $year_p = tpl.Plugin.year(this.$condition, { className: 'condition-query-item', type: 'perennial', title: '气候标准值' });

	var $results = tpl.Plugin.radiobtn(this.$condition, {
		title: '期间',
		className: 'condition-query-item',
		items: [
			{ text: '平均', attr: { value: 'AVG' } },
			{ text: '最大', attr: { value: 'MAX' } },
			{ text: '日数', attr: { value: 'DAYS' } },
			{ text: '求和', attr: { value: 'SUM' } },
			{ text: '最小', attr: { value: 'MIN' } }
		],
		handler: function() {
			corePage.onStatistics();
		}
	});

	var $operators = tpl.Plugin.radiobtn(this.$condition, {
		title: '日值',
		className: 'same-operators condition-query-item',
		items: [
			{ text: '&gt;', attr: { value: 'GT' } },
			{ text: '&lt;', attr: { value: 'LT' } },
			{ text: '介于', attr: { value: 'BETWEEN' } },
			{ text: '&gt;=', attr: { value: 'GET' } },
			{ text: '&lt;=', attr: { value: 'LET' } },
			{ text: '无', attr: { value: '' } }
		],
		handler: function() {
			var type = $(this).val(),
				html;
			switch (type) {
				case 'GT':
					html = '<span>&gt;</span><input id="jxValue" class="singleTime" value="35" type="number">';
					break;
				case 'LT':
					html = '<span>&lt;</span><input id="jxValue" class="singleTime" value="35" type="number">';
					break;
				case 'BETWEEN':
					html = '&gt;=<input id="jxMinValue" class="singleTime" value="35" type="number">且&lt;=<input id="jxMaxValue" class="singleTime" value="36.9" type="number">';
					break;
				case 'GET':
					html = '<span>&gt;=</span><input id="jxValue" class="singleTime" value="35" type="number">';
					break;
				case 'LET':
					html = '<span>&lt;=</span><input id="jxValue" class="singleTime" value="35" type="number">';
					break;
				default:
					html = '无';
					break;
			}
			$('.same-operator').remove();
			tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'same-operator condition-query-item' })
				.insertAfter('.same-operators');
		}
	}, 5);

	// 线性趋势计算类型
	var $linearType = tpl.Plugin.radiobtn(this.$condition, {
		title: '线性趋势计算',
		className: 'condition-calc-item condition-calc-item-2',
		items: [
			{ text: '站次历年', attr: { value: 'station', data: '.condition-calc-item-2-2' } },
			{ text: '历年同期', attr: { value: 'year', data: '.condition-calc-item-2-1' } }
		],
		handler: function() {
			tpl.ext.toggleCondition(this);
			corePage.onStatistics();
		}
	});


	// 呈现方式切换
	var $display = $display = tpl.Plugin.display(this.$condition, ['grid', 'chart', {
		type: 'map',
		className: 'condition-calc-item condition-calc-item-2 condition-calc-item-2-2 condition-calc-item-6'
	}, {
		type: 'surfer',
		className: 'condition-calc-item condition-calc-item-2 condition-calc-item-2-2 condition-calc-item-6'
	}]).click(function(event) {
		displayType = $(this).val();
		corePage.onStatistics();
	});

	tpl.Plugin.index(this.$condition, {
		title: '指标',
		className: 'condition-query-item',
		items: [{
			title: false,
			content: [
				'<span class="tpl-check"><input type="checkbox" class="same-index-check">缺测日数&lt;总日数的1&nbsp;/&nbsp;</span>',
				'<input class="singleTime sm same-index-input" value="10" min="1" type="number">'
			].join('')
		}]
	});

	this.condition();
	//默认
	triggerActiveRadio($condtionSwitch);
}

/**
 * 气候变化影响评估
 */
function assessPage() {
	var queryData;
	var queryType;
	var displayType = 'grid';

	// 模块要素集合【radiobtn】
	var modules = [];

	/**
	 * 处理Map/Sufer数据
	 * @param  {Array}   data     [description]
	 * @param  {Boolean}  isSurfer [description]
	 * @return {[type]}            [description]
	 */
	function dealWizDataForMapAndSurfer(data, isSurfer) {
		var stationIdKey = 'stationId', //站点键值
			splitKey = 'split', //分组键值
			splitter, //分组依据
			results = [], //结果集
			option, //参数
			optionKey, //参数类型
			stationIds, //站号数据
			values, //值数组
			i;
		if (isSurfer) { //构建surfer默认参数
			optionKey = 'surfer';
			option = {};
		} else { //构建Map默认参数
			optionKey = 'map';
			option = {
				style: { type: 'auto', option: { colorType: 'w' } }
			};
		}
		// 处理原始数据
		for (i = 0; i < data.length; i++) {
			var item = data[i];
			if (item.key === stationIdKey) { //取出站号数据
				stationIds = item.values;
				$.extend(option, item[optionKey]);
			}
			if (item.key === 'value') { //取出值数组
				values = item.values;
			}
			if (item.hasOwnProperty(splitKey)) { //取出分组依据
				splitter = item;
			}
		}
		if (!G.isPretty(stationIds)) return;
		// 按要素分组
		if (splitter) {
			var splitValue = null; //分段值游标
			var splitValues = splitter.values; //分组依据
			var index = -1; //分段下标
			//遍历分组依据：分段数据，构建结果集合
			for (var i = 0; i < splitValues.length; i++) {
				var item = splitValues[i];
				var station = getStation(stationIds[i]); //获取站点数据
				if (!station) continue;
				station.value = values[i]; //向该站点添加数据
				if (splitValue !== item) {
					splitValue = item;
					// 该段结果
					var splitObj = { name: item, data: [station] };
					results.push(splitObj);
					index++;
				} else {
					// 向该段结果添加数据
					if (item !== results[index].name) throw new Error('WTF');
					results[index].data.push(station);
				}
			}
		} else { //无分组
			for (i = 0; i < stationIds.length; i++) {
				var stationId = stationIds[i];
				var station = getStation(stationId);
				if (!station) continue;
				station.value = values[i];
				results.push(station);
			}
		}
		// 返回最终结果
		return { option: option, data: results, split: splitter ? splitter.split : false };
	}

	/**
	 * 结果呈现
	 * @param  {Array}   data 计算结果
	 * {key:'key',name:'名字',values:[]} 数据第一项为x轴
	 */
	function display(data) {
		corePage.$toolbar.empty();
		corePage.$panel.empty();
		if (!$.isArray(data)) {
			corePage.Alert.show('获取数据出错...');
			return;
		} else if (data.length === 0) {
			corePage.Alert.show('该时段（条件）没有统计结果...');
			return;
		}

		// 初始化工具栏
		corePage.toolbar(tpl.TOOLBAR[displayType]);
		switch (displayType) {
			case 'grid':
				var cols = [],
					gridData = [];
				data.forEach(function(item) {
					if (item.hide && item.hide.indexOf(displayType) > -1) return;
					var key = item.key;
					var name = item.name;
					var col = { title: name, data: key };
					if (item.gridFormat) {
						col.type = 'numeric';
						col.format = '0.0';
					}
					cols.push(col);
					// 数据整理
					var values = item.values;
					values.forEach(function(value, index) {
						if (!gridData[index]) gridData[index] = {};
						gridData[index][key] = value;
					});
				});
				corePage.Grid = corePage.grid(cols, gridData);
				break;
			case 'chart':
				var activeModuleIndex = $moduleRadios.siblings('.active').index();
				var title = $moduleRadios.eq(activeModuleIndex).text();
				// 获取下级模块名称
				$.each(modules[activeModuleIndex], function(index, val) {
					var $this = $(this);
					if ($this.is(':hidden')) return;
					var ele = $this.siblings('.active');
					if (ele.length > 0) {
						title = ele.text();
						return false;
					}
				});

				var x = data[0];
				var xSeries = x.values;
				var chartOpt = x.chart || {};
				if (chartOpt.title) title = chartOpt.title;
				var y = [];
				var splitter = null; //分组数据
				for (var i = 1; i < data.length; i++) {
					var item = data[i];
					if (item.hide && item.hide.indexOf(displayType) > -1) continue;
					if (item.split) {
						splitter = item;
						continue;
					}
					var name = item.name,
						values = item.values;
					y.push({ name: name, data: values });
				}
				// 数据分组
				if (splitter) {
					var results = []; //分组Y轴
					var splitValue = null; //分段值
					var splitValues = splitter.values;
					var splitX = []; //X轴
					var splitIndex = []; //分段
					// 遍历取出分段数和Index
					for (var i = 0; i < splitValues.length; i++) {
						var item = splitValues[i];
						if (splitValue !== item) {
							splitValue = item;
							splitIndex.push(i);
						}
					}
					// 构建结果集合
					for (i = 0; i < splitIndex.length; i++) {
						var index = splitIndex[i];
						var nextIndex = splitIndex[i + 1]; //最末为undefined
						// X轴分段
						splitX.push(xSeries.slice(index, nextIndex));
						results.push({ name: splitValues[index], data: [] });
						// 遍历Y数据分段
						for (var j = 0; j < y.length; j++) {
							var serie = y[j];
							results[i].data.push({
								name: serie.name,
								data: serie.data.slice(index, nextIndex)
							});
						}
					}
					// 创建分组选择框
					initSplitToolbar(results, splitter.split.title, function(index, value) {
						var serie = results[index].data; //取出该组Y数据
						var sX = splitX[index]; //取出该组X轴
						corePage.Chart = corePage.chart({
								categories: sX
							}, {
								title: { text: x.title }
							},
							serie, {
								chart: { type: chartOpt.chartType || 'column' },
								title: { text: title },
								subtitle: { text: value || chartOpt.subtitle || false }
							}
						);
					}).change(); //默认触发

				} else {
					corePage.Chart = corePage.chart({ categories: xSeries }, { title: { text: x.title } },
						y, { chart: { type: chartOpt.chartType || 'column' }, title: { text: title }, subtitle: { text: chartOpt.subtitle || false } }
					);
				}
				break;
			case 'map':
				var results = dealWizDataForMapAndSurfer(data);
				if (results.split) {
					// 创建分组选择框
					initSplitToolbar(results.data, results.split.title, function(index, value) {
						results.option.subtitle = value;
						corePage.Map = corePage.map(results.option, results.data[index].data);
					}).change(); //默认触发
				} else {
					corePage.Map = corePage.map(results.option, results.data);
				}
				break;
			case 'surfer':
				var results = dealWizDataForMapAndSurfer(data, true);
				if (results.split) {
					// 创建分组选择框
					initSplitToolbar(results.data, results.split.title, function(index) {

						corePage.Surfer = corePage.surfer(results.option, results.data[index].data);
					}).change(); //默认触发
				} else {
					corePage.Surfer = corePage.surfer(results.option, results.data);
				}

				break;
			default:
				return;
		}
	}
	//分组工具栏
	function initSplitToolbar(items, title, handler) {
		var $select = $('<select class="tpl-map-ele tpl-toolbar-item"></select>').on('change', function(event) {
			event.preventDefault();
			var text = this.options[this.selectedIndex].text;
			handler(Number(this.value), text);
		});

		items.forEach(function(item, index) {
			$('<option></option>').val(index).html(item.name).data('style', item.style)
				.appendTo($select);
		});

		// 按钮组
		$('<div class="tpl-toolbar-group"></div>')
			.append('<span class="tpl-toolbar-title">' + title + '</span>')
			.append($select)
			.prependTo(corePage.$toolbar);
		return $select;
	};
	/**
	 * 查询
	 * @author rexer
	 * @date   2016-11-29
	 * @return {[type]}   [description]
	 */
	function query() {

		var loader = new tpl.Plugin.loader('.resultPanel').show();
		var service = G.URL.getDataService();
		// 本地服务
		// service = 'http://192.168.0.116:8080/server/services/';

		// 查询类
		var deferredQuery = new DeferredQuery();
		// 绑定事件
		deferredQuery.addHook('fail', function() {
			loader.destroy();
			corePage.$panel.empty();
			corePage.Alert.show('数据查询失败，请重试...');
		}).addHook('done', function() {
			loader.destroy();
		});
		// =============================常规统计接口=============================
		// 降水总量参数
		var preSumPara = {
			startTime: $datepicker3.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
			endTime: $datepicker3.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
			contrastType: 'sameTeam',
			startYear: Number($year2.find('.start').val()),
			endYear: Number($year2.find('.end').val()),
			type: '2020',
			stationType: 'AWS'
		};
		// 降水总量
		var preSumService = service + 'CommonStatisticsService/queryPreSum';
		// 平均气温
		var avgTempService = service + 'CommonStatisticsService/queryAvgTem';

		// =============================常规统计接口=============================
		var starttime2 = $datepicker2.customDatePicker('getStartTime'),
			endtime2 = $datepicker2.customDatePicker('getEndTime');
		var sameCalPara = {
			startDay: starttime2.date(),
			startMon: starttime2.month() + 1,
			endDay: endtime2.date(),
			endMon: endtime2.month() + 1,
			currentYear: starttime2.year(),
			startYear: $year1.find('.start').val(),
			endYear: $year1.find('.end').val(),
			FilterType: '',
			StatisticsType: 'AVG',
			standardStartYear: Number($year2.find('.start').val()),
			standardEndYear: Number($year2.find('.end').val()),
			station_Id_C: $stationinput.customStationInput('getCode')
		};
		var sameCalService = service + 'SameCalendarService/same';

		// =============================资料检索接口=============================
		var climDataRangePara = {
			orderType: 'SEQ',
			EleType: 'AVGTEM',
			startTime: moment(),
			endTime: moment()
		};
		var climDataRangeService = service + 'ClimDataQuery/queryClimByTimesRangeAndElement';

		// =============================单站历年气温接口=============================
		var tempDataYearsPara = {
			type: 'HEAT', //采暖  <> COOL
			tmp: 18,
			startYear: 1981,
			endYear: 2010,
			station_Id_C: $stationinput2.customStationInput('getCode')
		};
		var tempDataYearsService = service + 'CommonStatisticsService/queryTmpDaysByYear';

		// =============================连续变化接口=============================
		var __station_all_val = $('.tpl-station-all.active').val();
		var __stationCode = $stationinput.customStationInput('getCode');
		var sequenceChangPara = {
			startTimeStr: $datepicker1.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $datepicker1.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
			station_Id_C: __stationCode || __station_all_val || '',
			allStation: __stationCode === '*' || __stationCode === '5%' || !__stationCode,
			climTimeType: $module_3_timeRadios.siblings('.active').val(),
			standardStartYear: Number($year2.find('.start').val()),
			standardEndYear: Number($year2.find('.end').val()),
			statisticsType: '',
			eleTypes: ''
		};
		var sequenceChangService = service + 'SequenceChangService/sequenceChangByTimes';

		// 站次连续变化接口
		var SequenceChangStationPara = {
			startTimeStr: $datepicker3.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
			endTimeStr: $datepicker3.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
			station_Id_C: $stationinput2.customStationInput('getCode'),
			statisticsType: 'AVG',
			climTimeType: $module_3_timeRadios.siblings('.active').val(),
			standardStartYear: Number($year2.find('.start').val()),
			standardEndYear: Number($year2.find('.end').val()),
			eleTypes: ''
		};
		var SequenceChangStationService = service + 'SequenceChangService/sequenceChangeStationsByTimes';

		// 模块分发
		switch (queryType) {
			case '.condition-module-0-0-0': //气候生产潜力(时段)
				var para = {
					startTime: $datepicker1.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
					endTime: $datepicker1.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
					contrastType: 'sameTeam',
					startYear: Number($year2.find('.start').val()),
					endYear: Number($year2.find('.end').val()),
					stationType: 'AWS'
				};
				deferredQuery.clearQuery()
					.addQuery(avgTempService, para)
					.addQuery(preSumService, $.extend({ type: '2020' }, para))
					.query(function(data1, data2) {
						if (!data1.length || !data2.length || data1.length !== data2.length) return;
						var loop = data1.length;
						var results = [],
							stationNames = [],
							stationIds = [];
						for (var i = 0; i < loop; i++) {
							var T = data1[i].tEM_Avg, //气温
								R = data2[i].pRE_Time, //降水量
								stationName = data2[i].station_Name,
								stationId = data2[i].station_Id_C;
							var E = Calc.tm(T, R);
							results.push(Number(E.toFixed(2)));
							stationNames.push(stationName);
							stationIds.push(stationId);
						}
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: 'd·℃',
							values: stationNames
						}, {
							key: 'value',
							name: '生产潜力',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							values: stationIds,
							map: {
								title: '生产潜力指数空间分布',
								subtitle: $datepicker1.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
									'至' + $datepicker1.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
							},
						}];
						display(queryData);
					});
				break;
			case '.condition-module-0-0-1': //气候生产潜力(历年)
				deferredQuery.clearQuery()
					.addQuery(sameCalService, $.extend({}, sameCalPara, { EleType: 'AVGTEM' }))
					.addQuery(sameCalService, $.extend({}, sameCalPara, { EleType: 'PRETIME2020', StatisticsType: 'SUM' }))
					.query(function(data1, data2) {
						if (!data1.length || !data2.length || data1.length !== data2.length) return;
						var loop = data1.length;
						var results = [],
							years = [];
						for (var i = 0; i < loop; i++) {
							var T = data1[i].value, //气温
								R = data2[i].value, //降水量
								year = data2[i].year;
							var E = Calc.tm(T, R);
							results.push(Number(E.toFixed(2)));
							years.push(year);
						}

						queryData = [{
							key: 'year',
							name: '年份',
							title: 'd·℃',
							values: years
						}, {
							key: 'value',
							name: '生产潜力',
							values: results,
							gridFormat: true
						}];
						display(queryData);
					});
				break;
			case '.condition-module-0-1-0': //积温时段
				var para = {
					startTimeStr: $datepicker1.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
					endTimeStr: $datepicker1.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
					perennialStartYear: Number($year2.find('.start').val()),
					perennialEndYear: Number($year2.find('.end').val()),
					minTmp: Number($('.index-tmp-min').val()),
				};
				deferredQuery.clearQuery()
					.addQuery(service + 'AccumulatedTempService/accumulatedTempByTimes', para)
					.query(function(data1) {
						var results = data1.activeAccumulatedTempList;
						var temp = [], //accumulatedTemp
							station = [], //station_Name
							stationIds = [];
						results.forEach(function(item) {
							temp.push(item.accumulatedTemp);
							station.push(item.station_Name);
							stationIds.push(item.station_Id_C);
						});
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '℃',
							values: station
						}, {
							key: 'accumulatedTemp',
							name: '活动积温',
							values: temp,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'value',
							values: temp
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							values: stationIds,
							map: {
								title: '活动积温空间分布',
								subtitle: $datepicker1.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
									'至' + $datepicker1.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
							},
						}];
						display(queryData);
					});
				break;
			case '.condition-module-0-1-1': //积温历年
				var para = {
					startTimeStr: $datepicker2.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
					endTimeStr: $datepicker2.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
					perennialStartYear: Number($year1.find('.start').val()),
					perennialEndYear: Number($year1.find('.end').val()),
					minTmp: Number($('.index-tmp-min').val()),
					station_Id_C: $stationinput.customStationInput('getCode')
				};
				deferredQuery.clearQuery()
					.addQuery(service + 'AccumulatedTempService/accumulatedTempByYears', para)
					.query(function(data1) {
						var results = data1.activeAccumulatedTempList;
						var temp = [], //accumulatedTemp
							year = [];
						results.forEach(function(item) {
							temp.push(item.accumulatedTemp);
							year.push(item.year);
						});
						queryData = [{
							key: 'year',
							name: '年份',
							title: '℃',
							values: year
						}, {
							key: 'accumulatedTemp',
							name: '历年活动积温',
							values: temp,
							gridFormat: true
						}];
						display(queryData);
					});
				break;
			case '.condition-module-1-1-99':
				var stationId = SequenceChangStationPara.station_Id_C;
				deferredQuery.clearQuery()
					.addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						eleTypes: 'PRETIME2020',
						statisticsType: 'AVG'
					})).query(function(data) {
						if (!G.isPretty(data)) return display([]); //容错
						var rains = [],
							dates = [],
							i;
						for (i = 0; i < data.length; i++) {
							var date = data[i].datetime,
								rain = data[i].value;
							if (!$.isNumeric(rain)) continue;
							dates.push(date);
							rains.push(rain);
						}
						var results = Calc.qars(rains, stationId);
						if (!results) return display([]); //容错
						var stationName = data[0].station_Name;
						queryData = [{
							key: 'date',
							name: '时序',
							title: '降水资源(mm)',
							chart: {
								title: stationName + '降水资源时序统计图',
								subtitle: SequenceChangStationPara.startTimeStr +
									'至' + SequenceChangStationPara.endTimeStr
							},
							values: dates
						}, {
							key: 'value',
							name: '降水资源(mm)',
							values: results,
							gridFormat: true
						}];
						display(queryData);
					});
				break;
			case '.condition-module-1-1-00': //降水资源 多站
				deferredQuery.clearQuery()
					.addQuery(preSumService, preSumPara)
					.query(function(data1) {
						var rain = [],
							stationIds = [],
							stationNames = [];
						data1.forEach(function(item) {
							rain.push(item.pRE_Time);
							stationNames.push(item.station_Name);
							stationIds.push(item.station_Id_C);
						});
						// 降水资源
						var results = Calc.qar(rain, stationIds);

						var subtitle = preSumPara.startTime.substr(0, 10) +
							'至' + preSumPara.endTime.substr(0, 10);

						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '亿立方米',
							chart: {
								title: '降水资源站次统计图',
								subtitle: subtitle
							},
							values: stationNames
						}, {
							key: 'value',
							name: '降水资源',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							values: stationIds,
							map: {
								title: '降水资源空间分布',
								subtitle: subtitle,
								style: { option: { colorType: 'c' } }
							}
						}];
						display(queryData);
					});
				break;
			case '.condition-module-1-2-99': //蒸发量 单站逐时
				deferredQuery.clearQuery()
					.addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						eleTypes: 'AVGTEM', //平均气温
						statisticsType: 'AVG'
					})).addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						eleTypes: 'PRETIME2020', //降水量2020
						statisticsType: 'SUM'
					})).query(function(data1, data2) {
						if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
							display([]);
							return;
						}
						var loop = data1.length;
						var results = [],
							dates = [];
						var PRETIME = [],
							AVGTEM = []
						for (var i = 0; i < loop; i++) {
							var T = data1[i].value, //气温
								P = data2[i].value; //降水量
							if (!$.isNumeric(T) || !$.isNumeric(P)) continue;
							var E = Calc.evap(T, P);
							results.push(Number(E.toFixed(2)));
							dates.push(data1[i].datetime);
							PRETIME.push(P);
							AVGTEM.push(T);
						}

						var stationName = data1[0].station_Name;
						queryData = [{
							key: 'date',
							name: '时序',
							title: '蒸发量(mm)',
							chart: {
								title: stationName + '蒸发量',
								subtitle: SequenceChangStationPara.startTimeStr +
									'至' + SequenceChangStationPara.endTimeStr
							},
							values: dates
						}, {
							name: '降水量',
							key: 'PRETIME',
							values: PRETIME
						}, {
							name: '气温',
							key: 'AVGTEM',
							values: AVGTEM
						}, {
							key: 'value',
							name: '蒸发量',
							values: results,
							gridFormat: true
						}];

						display(queryData);
					});
				break;
			case '.condition-module-1-2-00': //蒸发量 多站
				deferredQuery.clearQuery()
					.addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						station_Id_C: '5%',
						eleTypes: 'AVGTEM', //平均气温
						statisticsType: 'AVG'
					})).addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						station_Id_C: '5%',
						eleTypes: 'PRETIME2020', //降水量2020
						statisticsType: 'SUM'
					})).query(function(data1, data2) {

						if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
							display([]);
							return;
						}
						var loop = data1.length;
						var results = [],
							dates = [],
							stationNames = [],
							stationIds = [];
						for (var i = 0; i < loop; i++) {
							var T = data1[i].value, //气温
								P = data2[i].value; //降水量
							if (!$.isNumeric(T) || !$.isNumeric(P)) continue;
							var E = Calc.evap(T, P);
							results.push(Number(E.toFixed(2)));
							stationNames.push(data1[i].station_Name);
							stationIds.push(data1[i].station_Id_C);
							dates.push(data1[i].datetime);
						}
						var subtitle = SequenceChangStationPara.startTimeStr +
							'至' + SequenceChangStationPara.endTimeStr;

						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '蒸发量(mm)',
							chart: {
								title: '蒸发量站次统计图',
								subtitle: subtitle
							},
							values: stationNames
						}, {
							key: 'date',
							name: '时间',
							split: { //分割
								title: '逐时'
							},
							values: dates
						}, {
							key: 'value',
							name: '蒸发量',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							map: {
								title: '蒸发量空间分布',
								subtitle: subtitle
							},
							surfer: {},
							values: stationIds
						}];

						display(queryData);
					});
				break;
			case '.condition-module-1-3-99': //可利用降水量 单站逐时
				deferredQuery.clearQuery()
					.addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						eleTypes: 'AVGTEM', //平均气温
						statisticsType: 'AVG'
					})).addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						eleTypes: 'PRETIME2020', //降水量2020
						statisticsType: 'SUM'
					})).query(function(data1, data2) {
						if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
							display([]);
							return;
						}
						var loop = data1.length;
						var results = [],
							dates = [];
						for (var i = 0; i < loop; i++) {
							var T = data1[i].value, //气温
								P = data2[i].value; //降水量
							if (!$.isNumeric(T) || !$.isNumeric(P)) continue;
							var Pi = Calc.upre(T, P);
							results.push(Number(Pi.toFixed(2)));
							dates.push(data1[i].datetime);
						}
						var stationName = data1[0].station_Name;
						queryData = [{
							key: 'date',
							name: '时序',
							title: '可利用降水量(mm)',
							chart: {
								title: stationName + '可利用降水量',
								subtitle: SequenceChangStationPara.startTimeStr +
									'至' + SequenceChangStationPara.endTimeStr
							},
							values: dates
						}, {
							key: 'value',
							name: '可利用降水量',
							values: results,
							gridFormat: true
						}];

						display(queryData);
					});
				break;
			case '.condition-module-1-3-00': //可利用降水量 站次
				deferredQuery.clearQuery()
					.addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						station_Id_C: '5%',
						eleTypes: 'AVGTEM', //平均气温
						statisticsType: 'AVG'
					})).addQuery(SequenceChangStationService, $.extend({}, SequenceChangStationPara, {
						station_Id_C: '5%',
						eleTypes: 'PRETIME2020', //降水量2020
						statisticsType: 'SUM'
					})).query(function(data1, data2) {

						if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
							display([]);
							return;
						}
						var loop = data1.length;
						var results = [],
							dates = [],
							stationNames = [],
							stationIds = [];
						for (var i = 0; i < loop; i++) {
							var T = data1[i].value, //气温
								P = data2[i].value; //降水量
							if (!$.isNumeric(T) || !$.isNumeric(P)) continue;
							var Pi = Calc.upre(T, P);
							results.push(Number(Pi.toFixed(2)));
							stationNames.push(data1[i].station_Name);
							stationIds.push(data1[i].station_Id_C);
							dates.push(data1[i].datetime);
						}
						var subtitle = SequenceChangStationPara.startTimeStr +
							'至' + SequenceChangStationPara.endTimeStr;

						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '可利用降水量(mm)',
							chart: {
								title: '可利用降水量站次统计图',
								subtitle: subtitle
							},
							values: stationNames
						}, {
							key: 'date',
							name: '时间',
							split: { //分割
								title: '逐时'
							},
							values: dates
						}, {
							key: 'value',
							name: '可利用降水量',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							map: {
								title: '可利用降水量空间分布',
								subtitle: subtitle
							},
							surfer: {},
							values: stationIds
						}];

						display(queryData);
					});
				break;

			case '.condition-module-2-0-0': //空调度日 多站同年
				var tempIndex = Number($('#index-du-cool').val());
				var year = Number($year3.find('.year').val());
				deferredQuery.clearQuery()
					.addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						startTime: year + '-01-01',
						endTime: year + '-12-31'
					})).query(function(data1) {
						if (!G.isPretty(data1)) {
							display([]);
							return;
						}

						// 初始化数据
						var stationNames = [];
						var stationIds = [];
						var data = {}; //数据整理结果
						var schema = data1[0];
						for (var key in schema) {
							if (key === 'Date') continue;
							var value = schema[key];
							var stations = key.split('_'),
								stationId = stations[0],
								stationName = stations[1];
							stationIds.push(stationId);
							stationNames.push(stationName); //站名
							data[stationName] = [value]; //初始化
						}

						// 按站点保存全年逐日气温
						for (var i = 1; i < data1.length; i++) {
							var item = data1[i];
							for (var key in item) {
								if (key === 'Date') continue;
								var value = item[key];
								var stationName = key.split('_')[1];
								data[stationName].push(value);
							}
						}

						// 计算各站点空调度日
						var results = [];
						var loop = stationNames.length;
						for (var i = 0; i < loop; i++) {
							var stationName = stationNames[i];
							var values = data[stationName];
							var result = Calc.ccd(values, tempIndex);
							results.push(Number(result.toFixed(2)));
						}
						var subtitle = year + '年度';
						// 重置保存结果
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '空调度日(℃)',
							chart: {
								title: '空调度日站次统计图',
								subtitle: subtitle,
								chartType: 'spline'
							},
							values: stationNames
						}, {
							key: 'value',
							name: '空调度日',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							map: {
								title: '空调度日空间分布',
								subtitle: subtitle
							},
							surfer: {},
							values: stationIds
						}];

						display(queryData);
					});
				break;
			case '.condition-module-2-0-1': // 空调度日 单站历年
				var tempIndex = Number($('#index-du-cool').val()),
					startYear = Number($year4.find('.start').val()),
					endYear = Number($year4.find('.end').val());
				deferredQuery.clearQuery()
					.addQuery(tempDataYearsService, $.extend({}, tempDataYearsPara, {
						type: 'COOL',
						tmp: tempIndex,
						startYear: startYear,
						endYear: endYear
					})).query(function(data1) {
						if (!G.isPretty(data1)) {
							display([]);
							return;
						}
						var results = [],
							years = [];
						data1.forEach(function(item) {
							years.push(item.year);
							var list = item.resultList;
							var sum = 0;
							for (var i = list.length; i--;) {
								sum += list[i] - tempIndex;
							}
							results.push(Number(sum.toFixed(2)));
						});
						var subtitle = years[0] + '至' + years[years.length - 1];
						// 重置保存结果
						queryData = [{
							key: 'year',
							name: '年份',
							title: '空调度日(℃)',
							chart: {
								title: '空调度日历年统计图',
								subtitle: subtitle,
								chartType: 'spline'
							},
							values: years
						}, {
							key: 'value',
							name: '空调度日',
							values: results,
							gridFormat: true
						}];

						display(queryData);
					});
				break;
			case '.condition-module-2-1-0': //采暖度日 多站同年
				var tempIndex = Number($('#index-du-warm').val());
				var year = Number($year3.find('.year').val());
				deferredQuery.clearQuery()
					.addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						startTime: year + '-01-01',
						endTime: year + '-12-31'
					})).query(function(data1) {
						if (!G.isPretty(data1)) {
							display([]);
							return;
						}

						// 初始化数据
						var stationNames = [];
						var stationIds = [];
						var data = {}; //数据整理结果
						var schema = data1[0];
						for (var key in schema) {
							if (key === 'Date') continue;
							var value = schema[key];
							var stations = key.split('_'),
								stationId = stations[0],
								stationName = stations[1];
							stationIds.push(stationId);
							stationNames.push(stationName); //站名
							data[stationName] = [value]; //初始化
						}

						// 按站点保存全年逐日气温
						for (var i = 1; i < data1.length; i++) {
							var item = data1[i];
							for (var key in item) {
								if (key === 'Date') continue;
								var value = item[key];
								var stationName = key.split('_')[1];
								data[stationName].push(value);
							}
						}

						// 计算各站点空调度日
						var results = [];
						var loop = stationNames.length;
						for (var i = 0; i < loop; i++) {
							var stationName = stationNames[i];
							var values = data[stationName];
							var result = Calc.hdd(values, tempIndex);
							results.push(Number(result.toFixed(2)));
						}
						var subtitle = year + '年度';
						// 重置保存结果
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: '采暖度日(℃)',
							chart: {
								title: '采暖度日站次统计图',
								subtitle: subtitle,
								chartType: 'spline'
							},
							values: stationNames
						}, {
							key: 'value',
							name: '采暖度日',
							values: results,
							gridFormat: true
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							map: {
								title: '采暖度日空间分布',
								subtitle: subtitle,
							},
							surfer: {},
							values: stationIds
						}];

						display(queryData);
					});
				break;
			case '.condition-module-2-1-1': //采暖度日 单站历年
				var tempIndex = Number($('#index-du-warm').val()),
					startYear = Number($year4.find('.start').val()),
					endYear = Number($year4.find('.end').val());
				deferredQuery.clearQuery()
					.addQuery(tempDataYearsService, $.extend({}, tempDataYearsPara, {
						tmp: tempIndex,
						startYear: startYear,
						endYear: endYear
					})).query(function(data1) {
						if (!G.isPretty(data1)) {
							display([]);
							return;
						}
						var results = [],
							years = [];
						data1.forEach(function(item) {
							years.push(item.year);
							var list = item.resultList;
							var sum = 0;
							for (var i = list.length; i--;) {
								sum += tempIndex - list[i];
							}
							results.push(Number(sum.toFixed(2)));
						});
						var subtitle = years[0] + '至' + years[years.length - 1];
						// 重置保存结果
						queryData = [{
							key: 'year',
							name: '年份',
							title: '采暖度日(℃)',
							chart: {
								title: '采暖度日历年统计图',
								subtitle: subtitle,
								chartType: 'spline'
							},
							values: years
						}, {
							key: 'value',
							name: '采暖度日',
							values: results,
							gridFormat: true
						}];

						display(queryData);
					});
				break;
			case '.condition-module-3-0':
				if ($module_3_type.siblings('.active').val()) {
					deferredQuery.clearQuery()
						.addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'AVGTEM',
							statisticsType: 'AVG'
						})).addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'RHUAVG',
							statisticsType: 'AVG'
						})).query(function(data1, data2) {
							if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
								display([]);
								return;
							}
							var dataTemp = [],
								dataRh = [],
								dates = [],
								results = [], //值
								levels = [], //等级
								desc = []; //描述

							// 计算温湿指数
							var loop = data1.length,
								i;
							for (i = 0; i < loop; i++) {
								var tempObj = data1[i],
									rhObj = data2[i],
									temp = tempObj.value,
									rh = rhObj.value;
								if (!$.isNumeric(temp) || !$.isNumeric(rh)) continue;

								var THI = Math.round(Calc.thi(temp, rh / 100)); //相对湿度为百分比
								results.push(THI);
								var res = Calc.thi2level(THI);
								levels.push(res[0]);
								desc.push(res[1]);
								dataTemp.push(temp);
								dataRh.push(rh);
								dates.push(tempObj.datetime);
							}
							// 重置保存结果
							queryData = [{
								key: 'date',
								name: '时序',
								title: 'THI',
								values: dates
							}, {
								hide: 'chart',
								key: 'temp',
								name: '气温(℃)',
								values: dataTemp,
								gridFormat: true
							}, {
								hide: 'chart',
								key: 'rh',
								name: '相对湿度(%)',
								values: dataRh,
								gridFormat: true
							}, {
								key: 'value',
								name: '温湿指数',
								values: results,
								gridFormat: true
							}, {
								hide: 'chart',
								key: 'level',
								name: '等级',
								values: levels,
								gridFormat: true
							}, {
								hide: 'chart',
								key: 'desc',
								name: '描述',
								values: desc
							}];
							display(queryData);
						});
					return;
				}

				var date = $datepicker4.customDatePicker('getStartTime').format(tpl.FORMATTER.date);
				deferredQuery.clearQuery()
					.addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'AVGTEM',
						startTime: date,
						endTime: date
					})).addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'RHUAVG',
						startTime: date,
						endTime: date
					})).query(function(data1, data2) {
						if (!G.isPretty(data1) || !G.isPretty(data2)) return;
						var dataTemp = data1[0],
							dataRh = data2[0];

						// 获取各个站点的数据
						var stationNames = [],
							stationIds = [],
							results = [], //值
							levels = [], //等级
							desc = []; //描述
						for (var key in dataTemp) {
							if (key === 'Date') continue;
							if (typeof dataTemp[key] != 'number' ||
								typeof dataRh[key] != 'number') continue;

							var station = key.split('_'); //站号键值
							stationIds.push(station[0]);
							stationNames.push(station[1]);
							var stationId = key.split
							var temp = dataTemp[key],
								rh = dataRh[key];
							var THI = Math.round(Calc.thi(temp, rh / 100)); //相对湿度为百分比
							results.push(THI);
							var res = Calc.thi2level(THI);
							levels.push(res[0]);
							desc.push(res[1]);
						}

						// 重置保存结果
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: 'THI',
							values: stationNames
						}, {
							key: 'value',
							name: '温湿指数',
							values: results,
							gridFormat: true
						}, {
							hide: 'chart',
							key: 'level',
							name: '等级',
							values: levels
						}, {
							hide: 'chart',
							key: 'desc',
							name: '描述',
							values: desc
						}, {
							hide: 'grid,chart',
							key: 'stationId',
							map: {
								title: '温湿指数',
								subtitle: date
							},
							surfer: {},
							values: stationIds
						}];

						display(queryData);
					});
				break;
			case '.condition-module-3-2': //舒适度指数
				// 单站逐时
				if ($module_3_type.siblings('.active').val()) {
					deferredQuery.clearQuery()
						.addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'AVGTEMMAX',
							statisticsType: 'MAX'
						})).addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'RHUAVG',
							statisticsType: 'AVG'
						})).addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'WINS2MIAVG',
							statisticsType: 'AVG'
						})).query(function(data1, data2, data3) {
							if (!G.isPretty(data3) || !G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length || data1.length !== data3.length) {
								display([]);
								return;
							}
							var dates = [],
								results = [], //值
								levels = [], //等级
								desc = []; //描述

							// 计算温湿指数
							var loop = data1.length,
								i;
							for (i = 0; i < loop; i++) {
								var tempObj = data1[i],
									rhObj = data2[i],
									windObj = data3[i],
									temp = tempObj.value,
									rh = rhObj.value,
									windV = windObj.value;
								if (!$.isNumeric(temp) || !$.isNumeric(rh) || !$.isNumeric(windV)) continue;

								var SSD = Math.round(Calc.ssd(temp, rh, windV));
								results.push(SSD);
								var res = Calc.ssd2level(SSD);
								levels.push(res[0]);
								desc.push(res[1]);
								dates.push(tempObj.datetime);
							}
							// 重置保存结果
							queryData = [{
								key: 'date',
								name: '时序',
								title: 'THI',
								values: dates
							}, {
								key: 'value',
								name: '舒适度指数',
								values: results,
								gridFormat: true
							}, {
								hide: 'chart',
								key: 'level',
								name: '等级',
								values: levels
							}, {
								hide: 'chart',
								key: 'desc',
								name: '描述',
								values: desc
							}];
							display(queryData);
						});
					return;
				}

				var date = $datepicker4.customDatePicker('getStartTime').format(tpl.FORMATTER.date);
				deferredQuery.clearQuery()
					.addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'AVGTEMMAX',
						startTime: date,
						endTime: date
					})).addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'RHUAVG',
						startTime: date,
						endTime: date
					})).addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'WINS2MIAVG',
						startTime: date,
						endTime: date
					})).query(function(data1, data2, data3) {
						if (!G.isPretty(data3) || !G.isPretty(data1) || !G.isPretty(data2)) return;
						var dataTemp = data1[0],
							dataRh = data2[0],
							dataWindV = data3[0];

						// 获取各个站点的数据
						var stationNames = [],
							results = [], //值
							levels = [], //等级
							desc = []; //描述
						for (var key in dataTemp) {
							if (key === 'Date') continue;
							if (typeof dataTemp[key] != 'number' ||
								typeof dataRh[key] != 'number' ||
								typeof dataWindV[key] != 'number') continue;

							var stationName = key.split('_')[1]; //站号键值
							stationNames.push(stationName);

							var temp = dataTemp[key],
								rh = dataRh[key] / 100,
								windV = dataWindV[key];
							var SSD = Math.round(Calc.ssd(temp, rh, windV));
							results.push(SSD);
							var res = Calc.ssd2level(SSD);
							levels.push(res[0]);
							desc.push(res[1]);
						}

						// 重置保存结果
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: 'THI',
							values: stationNames
						}, {
							key: 'value',
							name: '舒适度指数',
							values: results,
							gridFormat: true
						}, {
							hide: 'chart',
							key: 'level',
							name: '等级',
							values: levels
						}, {
							hide: 'chart',
							key: 'desc',
							name: '描述',
							values: desc
						}];

						display(queryData);
					});
				break;
			case '.condition-module-3-3': //炎热指数
				if ($module_3_type.siblings('.active').val()) {
					deferredQuery.clearQuery()
						.addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'AVGTEMMAX',
							statisticsType: 'MAX'
						})).addQuery(sequenceChangService, $.extend({}, sequenceChangPara, {
							eleTypes: 'RHUAVG',
							statisticsType: 'AVG'
						})).query(function(data1, data2) {
							if (!G.isPretty(data1) || !G.isPretty(data2) || data1.length !== data2.length) {
								display([]);
								return;
							}
							var dataTemp = [],
								dataRh = [],
								dates = [],
								results = [], //值
								levels = [], //等级
								desc = []; //描述

							// 计算温湿指数
							var loop = data1.length,
								i;
							for (i = 0; i < loop; i++) {
								var tempObj = data1[i],
									rhObj = data2[i],
									temp = tempObj.value,
									rh = rhObj.value;
								if (!$.isNumeric(temp) || !$.isNumeric(rh)) continue;

								var T = Calc.C2F(temp), //华氏度
									R = rh / 100; //湿度%

								var HI = Math.round(Calc.hotIndex(T, R));
								results.push(HI);
								var res = Calc.hotIndex2level(HI);
								feels.push(res[0]);
								desc.push(res[1]);
								dates.push(tempObj.datetime);
							}
							// 重置保存结果
							queryData = [{
								key: 'date',
								name: '时序',
								title: 'THI',
								values: dates
							}, {
								key: 'value',
								name: '温湿指数',
								values: results,
								gridFormat: true
							}, {
								hide: 'chart',
								key: 'level',
								name: '人体感受',
								values: levels
							}, {
								hide: 'chart',
								key: 'desc',
								name: '健康关注',
								values: desc
							}];
							display(queryData);
						});
					return;
				}

				var date = $datepicker4.customDatePicker('getStartTime').format(tpl.FORMATTER.date);
				deferredQuery.clearQuery()
					.addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'AVGTEMMAX',
						startTime: date,
						endTime: date
					})).addQuery(climDataRangeService, $.extend({}, climDataRangePara, {
						EleType: 'RHUAVG',
						startTime: date,
						endTime: date
					})).query(function(data1, data2) {
						if (!G.isPretty(data1) || !G.isPretty(data2)) return;
						var dataTemp = data1[0],
							dataRh = data2[0];
						// 获取各个站点的数据
						var stationNames = [],
							results = [], //值
							feels = [], //人体感受
							healths = []; //健康关注
						for (var key in dataTemp) {
							if (key === 'Date') continue;
							var temp = dataTemp[key],
								rh = dataRh[key];

							if (typeof temp != 'number' || typeof rh != 'number') continue;

							var stationName = key.split('_')[1]; //站号键值
							stationNames.push(stationName);

							var T = Calc.C2F(temp), //华氏度
								R = rh / 100; //湿度%

							var HI = Math.round(Calc.hotIndex(T, R));
							results.push(HI);
							var res = Calc.hotIndex2level(HI);
							feels.push(res[0]);
							healths.push(res[1]);
						}

						// 重置保存结果
						queryData = [{
							key: 'station_Name',
							name: '站点',
							title: 'HI',
							values: stationNames
						}, {
							key: 'value',
							name: '炎热指数',
							values: results,
							gridFormat: true
						}, {
							hide: 'chart',
							key: 'feel',
							name: '人体感受',
							values: feels
						}, {
							hide: 'chart',
							key: 'health',
							name: '健康关注',
							values: healths
						}];

						display(queryData);
					});
				break;
			default:
				queryData = null;
				loader.destroy();
				corePage.$toolbar.empty();
				corePage.$panel.empty();
				return;
		}
	}

	// ============= 页面 =============
	this.page();

	// 业务模块
	var $moduleRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '评估类别',
		items: [
			{ text: '农业', attr: { value: '', data: '.condition-module-0' } },
			{ text: '水资源', attr: { value: '', data: '.condition-module-1' } },
			{ text: '能源', attr: { value: '', data: '.condition-module-2' } },
			{ text: '旅游', attr: { value: '', data: '.condition-module-3' } },
			// { text: '交通', attr: { value: '', data: '.condition-module-4' } },
			{
				text: '大气成分监测',
				handler: function(event) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					window.open('http://172.24.176.136/Frame/MainIndex.aspx');
				}
			}
		],
		handler: function() {
			toggleCondition(this);
			var $item = modules[$(this).index()];
			if ($item) triggerActiveRadio($item);
		}
	});

	// ======================== 农业条件项 ========================
	modules[0] = tpl.Plugin.radiobtn(this.$condition, {
		title: '评估要素',
		className: 'condition-module-0',
		items: [
			{ text: '气候生产潜力', attr: { value: '1', data: '.condition-module-0-0' } },
			{ text: '积温', attr: { value: '', data: '.condition-module-0-1' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			if (this.value) triggerActiveRadio($queryRadios1);
			else triggerActiveRadio($queryRadios2);

			if($(this).attr('text') === '气候生产潜力'){

			}
		}
	});
	var $queryRadios1 = tpl.Plugin.radiobtn(this.$condition, {
		title: '统计方式',
		className: 'condition-module-0-0',
		items: [
			{ text: '时段', attr: { value: '', data: '.condition-module-0-0-0' } },
			{ text: '历年', attr: { value: '', data: '.condition-module-0-0-1' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			if ($(this).text() === '历年') {
				resetNoMapDisplay();
			} else {
				resetMapDisplay();
			}
			corePage.onStatistics();
		}
	});
	// 积温
	var $queryRadios2 = tpl.Plugin.radiobtn(this.$condition, {
		title: '统计方式',
		className: 'condition-module-0-1',
		items: [
			{ text: '时段', attr: { value: '', data: '.condition-module-0-1-0' } },
			{ text: '历年', attr: { value: '', data: '.condition-module-0-1-1' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			if ($(this).text() === '历年') {
				resetNoMapDisplay();
			} else {
				resetMapDisplay();
			}
			corePage.onStatistics();
		}
	});

	// ======================== 水资源条件项 ========================
	var $module_1_radios = tpl.Plugin.radiobtn(this.$condition, {
		title: '检索类型',
		className: 'condition-module-1',
		items: [
			{ text: '多站时段', attr: { value: '', data: '.condition-module-1-3-00' } },
			{ text: '单站逐时', attr: { value: 'single', data: '.condition-module-1-3-99' } }
		],
		handler: function() {
			// toggleCondition(this);
			queryType = queryType.substr(0, 21);
			if (this.value === 'single') {
				$(queryType + '-99').show();
				$(queryType + '-00').hide();
				queryType += '-99';
				resetNoMapDisplay();
			} else {
				$(queryType + '-00').show();
				$(queryType + '-99').hide();
				queryType += '-00';
				resetMapDisplay();
			}
			corePage.onStatistics();
		}
	});
	modules[1] = tpl.Plugin.radiobtn(this.$condition, {
		title: '评估要素',
		className: 'condition-module-1',
		items: [
			// { text: '湿润指数', attr: { value: '', data: '.condition-module-1-0' } },
			{ text: '降水资源', attr: { value: '', data: '.condition-module-1-1' } },
			{ text: '蒸发量', attr: { value: 'evap', data: '.condition-module-1-2' } },
			{ text: '可利用降水量', attr: { value: '', data: '.condition-module-1-3' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);

			// 逐时运算： 蒸发量隐藏 日、候、旬
			if ($(this).val() === 'evap') {
				$module_3_timeRadios.each(function() {
					if (/DAY$|FIVEDAYS|TENDAYS/.test($(this).val())) {
						$(this).hide();
					}
				})
			} else {
				$module_3_timeRadios.each(function() {
					$(this).show();
				})
			}
			// 逐时运算： 默认选中“月”
			$module_3_timeRadios.siblings('[value="MONTH"]').addClass('active')
				.siblings('.active').removeClass('active');

			triggerActiveRadio($module_1_radios);
		}
	});

	// ======================== 能源条件项 ========================
	modules[2] = tpl.Plugin.radiobtn(this.$condition, {
		title: '评估要素',
		className: 'condition-module-2',
		items: [
			{ text: '空调度日', attr: { value: '1', data: '.condition-module-2-0' } },
			{ text: '采暖度日', attr: { value: '', data: '.condition-module-2-1' } },
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			if (this.value) triggerActiveRadio($queryRadios3);
			else triggerActiveRadio($queryRadios4);
		}
	});
	// 空调度日
	var $queryRadios3 = tpl.Plugin.radiobtn(this.$condition, {
		title: '统计方式',
		className: 'condition-module-2-0',
		items: [
			{ text: '多站同年', attr: { value: '0', data: '.condition-module-2-0-0' } },
			{ text: '单站历年', attr: { value: '1', data: '.condition-module-2-0-1' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			corePage.onStatistics();
		}
	});
	// 采暖度日
	var $queryRadios4 = tpl.Plugin.radiobtn(this.$condition, {
		title: '统计方式',
		className: 'condition-module-2-1',
		items: [
			{ text: '多站年份', attr: { value: '0', data: '.condition-module-2-1-0' } },
			{ text: '单站历年', attr: { value: '1', data: '.condition-module-2-1-1' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			toggleCondition(this);
			corePage.onStatistics();
		}
	});


	// ======================== 旅游条件项 ========================
	// 模块3站点查询类型
	var $module_3_type = tpl.Plugin.radiobtn(this.$condition, {
		title: '检索类型',
		className: 'condition-module-3',
		items: [
			{ text: '多站同时', attr: { value: '', data: '.condition-module-3-00' } },
			{ text: '单站逐时', attr: { value: 'single', data: '.condition-module-3-99' } }
		],
		handler: function() {
			if (this.value === 'single') {
				resetNoMapDisplay();
			} else {
				resetMapDisplay();
			}
			toggleCondition(this);
			corePage.onStatistics();
		}
	});
	// 模块3旅游
	modules[3] = tpl.Plugin.radiobtn(this.$condition, {
		title: '评估要素',
		className: 'condition-module-3',
		items: [
			{ text: '温湿指数', attr: { value: '', data: '.condition-module-3-0' } },
			// { text: '风寒指数', attr: { value: '', data: '.condition-module-3-1' } },
			{ text: '综合舒适度', attr: { value: '', data: '.condition-module-3-2' } },
			{ text: '炎热指数', attr: { value: '', data: '.condition-module-3-3' } },
			// { text: '体感温度', attr: { value: '', data: '.condition-module-3-4' } },
			// { text: '有效温度', attr: { value: '', data: '.condition-module-3-5' } }
		],
		handler: function() {
			queryType = $(this).attr('data');
			triggerActiveRadio($module_3_type);
		}
	});

	// ======================== 环境条件项 ========================
	// modules[4] = tpl.Plugin.radiobtn(this.$condition, {
	//     title: '评估要素',
	//     className: 'condition-module-4',
	//     items: [
	//         { text: '大气环境容量', attr: { value: '', data: '.condition-module-4-0' } },
	//         { text: 'PM10', attr: { value: '', data: '.condition-module-4-1' } },
	//         { text: 'PM2.5', attr: { value: '', data: '.condition-module-4-2' } }
	//     ],
	//     handler: function() {
	//         toggleCondition(this);
	//     }
	// });


	// ======================== 站点选择条件项 ========================

	// 单站选择 全部站 国家站
	var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
		title: '站点选择',
		className: 'condition-module-0-0-1 condition-module-0-1-1 condition-module-3-99'
	}).find('.tpl-station').on('ready.station', function() {
		$(this).find('input').attr({
			placeholder: '国家站',
			'data-code': '5%'
		});
	}).customStationInput({
		data: corePage.StationData
	});
	$stationinput.append('<i class="separator"></i><button type="button" value="5%" class="tpl-station-all radiobutton-min tpl-radiobtn-item active">国家站</button>')
		.append('<button type="button" value="*" class="tpl-station-all radiobutton-min tpl-radiobtn-item">全部站</button>')
		.find('.tpl-station-all').click(function(event) {
			var $this = $(this),
				value = $this.val(),
				text = $this.html();
			var $input = $stationinput.find('input.stationinput-input');
			if ($this.hasClass('active')) {
				$this.removeClass('active');
				$input.attr({
					placeholder: '请输入站点',
					value: '',
					'data-code': ''
				});
			} else {
				$this.addClass('active').siblings('.tpl-station-all').removeClass('active');
				$input.attr({
					placeholder: text,
					value: '',
					'data-code': value
				});
			}
		});

	// 单站选择
	var $stationinput2 = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
		title: '站点选择',
		className: 'condition-module-2-0-1 condition-module-2-1-1 condition-module-1-1-99 condition-module-1-2-99 condition-module-1-3-99'
	}).find('.tpl-station').customStationInput({
		data: corePage.StationData,
		first: 57516
	});

	// ======================== 时间选择条件 ========================
	// 日期
	var $datepicker1 = tpl.Plugin.datepicker(this.$condition, {
		className: 'condition-module-0-0-0 condition-module-0-1-0 condition-module-3-99',
		type: 'date',
		title: '时段选择',
		config: {
			startDate: moment().startOf('year'),
			endDate: moment().endOf('year')
		},
		clearCtrl: true,
		ctrl: [
			{ text: '+ 年', data: 'add,y,1' },
			{ text: '- 年', data: 'subtract,y,1' },
			{ text: '全年', data: 'all,y' }
		]
	});

	// 年份 历年
	var $year1 = tpl.Plugin.year(this.$condition, {
		className: 'condition-module-0-0-1 condition-module-0-1-1',
		type: 'history',
		title: '年份选择'
	});
	// 日期2
	var $datepicker2 = tpl.Plugin.datepicker(this.$condition, {
		type: 'date',
		className: 'condition-module-0-0-1 condition-module-0-1-1',
		title: false,
		config: {
			minDate: moment(moment().year() - 1 + '-12-01'),
			maxDate: moment().endOf('year'),
			locale: {
				format: 'MM-DD'
			}
		}
	});

	// 年份 常年
	var $year2 = tpl.Plugin.year(this.$condition, {
		className: 'condition-module-0-0-0 condition-module-0-1-0 condition-module-1-1 condition-module-1-2 condition-module-1-3 condition-module-3-99',
		type: 'perennial'
	});

	// 日期3
	var $datepicker3 = tpl.Plugin.datepicker(this.$condition, {
		className: 'condition-module-1-1 condition-module-1-2 condition-module-1-3',
		type: 'date',
		title: '时段选择',
		config: {
			startDate: moment().startOf('year'),
			endDate: moment()
		}
	});

	// 年份选择
	var $year3 = tpl.Plugin.customize(this.$condition, '<input class="year singleTime compareTime" type="number" value="' + moment().year() + '">', {
		title: '年份选择',
		className: 'condition-module-2-0-0 condition-module-2-1-0',
	});
	// 历年
	var $year4 = tpl.Plugin.year(this.$condition, {
		className: 'condition-module-2-0-1 condition-module-2-1-1',
		type: 'history',
		start: 1981,
		title: '年份选择'
	});

	// 温湿指数 日期选择
	var $datepicker4 = tpl.Plugin.datepicker(this.$condition, {
		title: '日期选择',
		className: 'condition-module-3-00',
		type: 'date',
		single: true
	});

	// ======================== 类型切换 ========================
	// 单站时次选择
	var $module_3_timeRadios = tpl.Plugin.radiobtn(this.$condition, {
		title: '逐时运算',
		className: 'condition-module-3-99 condition-module-1-1-99 condition-module-1-2 condition-module-1-3',
		items: [
			{ text: '日', attr: { value: 'DAY' } },
			{ text: '候', attr: { value: 'FIVEDAYS' } },
			{ text: '旬', attr: { value: 'TENDAYS' } },
			{ text: '月', attr: { value: 'MONTH' } },
			{ text: '季', attr: { value: 'SEASON' } },
			{ text: '年', attr: { value: 'YEAR' } }
		],
		handler: function(event) {
			corePage.onStatistics();
		}
	}, 3);

	// ======================== 结果呈现 ========================
	// 显示
	var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart', {
		type: 'map',
		className: 'condition-module-2-0-0 condition-module-2-1-0 condition-module-3 condition-module-0'
	}, {
		type: 'surfer',
		className: 'condition-module-2-0-0 condition-module-2-1-0 condition-module-3 condition-module-0'
	}]).click(function(event) {
		displayType = $(this).val();
		if (!corePage.qCondition.change() && queryData)
			display(queryData);
		else corePage.onStatistics();
	});

	/**
	 * 重置显示类型按钮
	 */
	function resetNoMapDisplay() {
		$display.siblings('*[value="map"]').hide();
		$display.siblings('*[value="surfer"]').hide();
		if (displayType === 'map' || displayType === 'surfer') {
			$display.siblings('.active').removeClass('active');
			$display.siblings('*[value="grid"]').addClass('active');
			displayType = 'grid';
		}
	}

	function resetMapDisplay() {
		$display.siblings('*[value="map"]').show();
		$display.siblings('*[value="surfer"]').show();
	}

	// ======================== 指标 ========================
	var $index = tpl.Plugin.index(this.$condition, {
		title: '积温指标',
		className: 'condition-module-0-1-0 condition-module-0-1-1',
		items: [{
			title: '最低温度',
			content: '<input type="number" name="index-tmp-min" class="index-tmp-min singleTime sm" value="10"><sub>℃</sub>'
		}]
	});


	// 基础温度
	tpl.Plugin.index(this.$condition, {
		title: '降温指标',
		className: 'condition-module-2-0',
		items: [{
			title: '基础温度',
			content: '<input type="number" id="index-du-cool" class="index-du-warn singleTime sm" value="26"><sub>℃</sub>'
		}]
	});
	tpl.Plugin.index(this.$condition, {
		title: '采暖指标',
		className: 'condition-module-2-1',
		items: [{
			title: '基础温度',
			content: '<input type="number" id="index-du-warm" class="index-du-warn singleTime sm" value="10"><sub>℃</sub>'
		}]
	});

	// ======================== 条件添加完成 ========================
	this.condition();
	this.onStatistics(function(event) {
		query();
		event.preventDefault();
		event.stopPropagation();
	});

	// 默认
	triggerActiveRadio($moduleRadios);
}

function triggerActiveRadio($ele) {
	$ele.siblings('.active').removeClass('active').click();
}

// 条件切换
function toggleCondition(ele, attrKey) {
	var $ele = $(ele);
	var show_selector = $ele.attr(attrKey || 'data');
	var hide_selector = show_selector.substr(1, show_selector.lastIndexOf('-'));
	$('[class*="' + hide_selector + '"]').hide();
	$(show_selector).show();
}
