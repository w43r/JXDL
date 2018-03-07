/**
 * 高温日数
 * @author rexer
 * @date   2016-11-24
 */

~ function(ProductCreator) {

	// 任务定义
	var HighTempTask = ProductCreator.Task.prototype.extend({
		create: function(OptUtil, template, corePage) {
			var self = this;
			var datepicker = tpl.Plugin.yearmonth(OptUtil.toolbar);
			var form = OptUtil.initForm(),
				titleInput = form.find('input[name="productTitle"]'),
				summaryInput = form.find('input[name="productSummary"]').val('高温日数统计');

			//刷新按钮
			$('<button type="button" class="btn btn-primary">制作</button>').css({
				margin: '10px auto',
				width: '200px',
				display: 'block'
			}).click(init).appendTo(OptUtil.toolbar.find('.condition-content'));

			//数据
			var queryData = null;
			// 进度条
			var loader = new tpl.Plugin.loader(OptUtil.layero);

			// 初始化
			function init() {
				loader.show('');
				var year = Number(datepicker.find('.year').val()),
					month = Number(datepicker.find('.month').val()),
					date = moment().year(year).month(month);
				var areaName = G.User.getAreaName();
				titleInput.val('（高温日数）' + areaName + date.format('YYYY年MM月') + '高温日数统计');
				var para = {
					startTimeStr: date.clone().startOf('month').format(tpl.FORMATTER.date),
					endTimeStr: (year === moment().year() && month === moment().month()) ? date.format(tpl.FORMATTER.date) : date.endOf('month').format(tpl.FORMATTER.date),
				};
				$.post(G.URL.getDataService() + 'HighTmpService/highTmpByTimes', G.paramize(para))
					.done(function(data) {
						loader.hide();
						if (tpl.ext.isExpectedType(data)) {
							queryData = self.dealWizData(data);
						} else {
							layer.tips('暂无数据');
							console.log(data);
						}
					});
				// tpl.ext.query('HighTmpService/highTmpByTimes', para, );
			}

			// 注册提交
			OptUtil.submitter(function() {
				if (!queryData) {
					layer.tips('暂无数据');
					return;
				}

				function failed() {
					loader.hide();
					G.tip('产品添加失败,请重试', false);
				}

				loader.show('');

				var year = Number(datepicker.find('.year').val()),
					month = Number(datepicker.find('.month').val()),
					date = moment().year(year).month(month);

				var para = {
					productTemplateId: template.TemplateId,
					productTitle: titleInput.val(),
					productSummary: summaryInput.val(),
					content: {
						duty: G.User.getName(),
						dutyDate: moment().format('YYYY-MM-DD'),
						date: date.format('YYYY年MM月'),
						days: queryData[0],
						times: queryData[1]
					}
				};
				ProductCreator.Query.addProduct('addHighTmpProduct', para, function(product) {
					loader.hide();
					if (!product) return failed();
					G.tip('产品添加成功', true);
					OptUtil.closePage();
					OptUtil.display(product);
				}).fail(failed);

			});

			init();
		},
		// 数据处理
		dealWizData: function(data) {
			var self = this;
			var sec1 = [], // 高温日数
				sec2 = []; // 高温日期
			// 按顺序键值
			var keysInOrder = ['station_Name', 'gt35Days', 'gt35lt37Days', 'gt37Days', 'gt37lt39Days', 'gt40Days'];

			// 高温日数
			data.highTmpTotalList.forEach(function(item) {
				var sec = [];
				keysInOrder.forEach(function(key) {
					sec.push(item[key]);
				});
				sec1.push(sec.join());
			});
			// 高温日期
			data.highTmpSequenceList.forEach(function(item) {
				var sec = [item.station_Name];
				var valueMap = item.valueMap;
				for (var date in valueMap) {
					var index = Number(date.substr(2));
					var value = valueMap[date];
					sec[index] = self.sympol(value);
				}
				// 补齐当月数据，按每月31天
				for (var i = sec.length; i <= 31; i++) {
					if (!sec[i]) sec[i] = ' ';
				}
				sec2.push(sec.join());
			});

			return [sec1, sec2];
		},
		// 高温标志
		sympol: function(value) {
			var sp35 = '―',
				sp37 = '*',
				sp39 = 'Ⅰ',
				sp40 = 'Ⅱ';

			if (value < 35) value = sp35;
			else if (value >= 35 && value < 37) value = sp37;
			else if (value >= 37 && value < 40) value = sp39;
			else if (value >= 40) value = sp40;
			return value;
		}
	});

	// 任务注册
	ProductCreator.registerTask('HT', '高温日数', HighTempTask);

}(ProductCreator);
