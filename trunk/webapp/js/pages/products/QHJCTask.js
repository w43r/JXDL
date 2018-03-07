/**
 * 气候监测短信
 * @author rexer
 * @date   2016-10-26
 */

~ function(ProductCreator) {
    // 任务定义
    var QHJCTask = ProductCreator.Task.prototype.extend({
        create: function(OptUtil, template, corePage) {
            var self = this;
            var datepicker = tpl.Plugin.datepicker(OptUtil.toolbar, { type: 'date' });
            var form = OptUtil.initForm(true),
                textarea = form.find('textarea'),
                titleInput = form.find('input[name="productTitle"]').val('气候监测短信'),
                summaryInput = form.find('input[name="productSummary"]')

            //刷新按钮
            $('<button type="button" class="btn btn-primary">制作</button>').css({
                margin: '10px auto',
                width: '200px'
            }).click(init).appendTo(OptUtil.toolbar.find('.condition-content'));

            // 改变弹出层样式
            // layer.style(OptUtil.layer, { height: '700px' });

            /**
             * 提交
             */
            function submit() {
                var para = {
                    productTemplateId: template.TemplateId,
                    productTitle: titleInput.val(),
                    productSummary: summaryInput.val(),
                    content: {
                        sendTime: moment().format('YYYY-MM-DD'),
                        content: textarea.val(),
                        marker: '',
                        issuer: ''
                    }
                };
                ProductCreator.Query.addProduct('addProduct', para, function(product) {
                    if (!product) return G.tip('产品添加失败,请重试', false);
                    G.tip('产品添加成功', true);
                    OptUtil.closePage();
                    OptUtil.display(product);
                });
            }
            /**
             * 生成产品
             */
            function init() {
                var starttime = datepicker.customDatePicker('getStartTime'),
                    endtime = datepicker.customDatePicker('getEndTime');
                var content = '各位领导：' + starttime.format('YYYY年MM月DD日') + '至' + endtime.format('MM月DD日') + '，';
                titleInput.val('气象监测信息' + starttime.format('YYYYMMDD'));
                summaryInput.val('气候监测 ' + starttime.format('YYYY年MM月DD日') + '至' + endtime.format('YYYY年MM月DD日'));

                var service = G.URL.getDataService();
                var loader = new tpl.Plugin.loader(OptUtil.layero).show('');

                // 创建查询
                var Query = new DeferredQuery();
                // 添加查询
                Query.addQuery(service + 'SameCalendarService/same', {
                    startDay: starttime.date(),
                    startMon: starttime.month() + 1,
                    endDay: endtime.date(),
                    endMon: endtime.month() + 1,
                    currentYear: starttime.year(),
                    startYear: starttime.year(),
                    endYear: endtime.year(),
                    FilterType: '',
                    EleType: 'AVGTEM',
                    StatisticsType: 'AVG',
                    standardStartYear: 1981,
                    standardEndYear: 2010,
                    station_Id_C: '5%'
                }).addQuery(service + 'CommonStatisticsService/queryPreSum', {
                    startTime: starttime.format(tpl.FORMATTER.datetime),
                    endTime: endtime.format(tpl.FORMATTER.datetime),
                    contrastType: 'sameTeam',
                    startYear: 1981,
                    endYear: 2010,
                    type: '2020',
                    stationType: 'AWS'
                }).addQuery(service + 'CommonStatisticsService/querySSH', {
                    startTime: starttime.format(tpl.FORMATTER.datetime),
                    endTime: endtime.format(tpl.FORMATTER.datetime),
                    contrastType: 'sameTeam',
                    startYear: 1981,
                    endYear: 2010,
                    stationType: 'AWS'
                });
                // 查询
                Query.query(function(data1, data2, data3) {
                    loader.destroy();

                    // ========================气温========================
                    content += '全市平均气温' + data1[0].value + '℃，' +
                        '较常年同期（' + data1[0].avgValue + '℃）';
                    if (data1[0].anomaly > 0) {
                        content += '偏高' + Math.abs(data1[0].anomaly) + '℃';
                    } else if (data1[0].anomaly < 0) {
                        content += '偏低' + Math.abs(data1[0].anomaly) + '℃';
                    } else content += '持平';
                    content += '；';

                    // ========================降水量========================
                    var preValues = 0,
                        preRates = 0,
                        preContrasts = 0;
                    data2.forEach(function(item) {
                        preValues += item.pRE_Time;
                        preRates += item.anomalyRate;
                        preContrasts += item.contrastPRE_Time;
                    });
                    // 计算平均值
                    var preSize = data2.length;
                    var preValue = (preValues / preSize).toFixed(2),
                        preRate = Math.round(preRates / preSize),
                        preContrast = (preContrasts / preSize).toFixed(2);

                    content += '降水量' + preValue + 'mm，' +
                        '较常年（' + preContrast + 'mm）';
                    if (preRate > 0) {
                        content += '偏多' + Math.abs(preRate) + '%';
                    } else if (preRate < 0) {
                        content += '偏少' + Math.abs(preRate) + '%';
                    } else content += '持平';
                    content += '；';

                    // ========================日照========================
                    var sshValues = 0,
                        sshRates = 0,
                        sshContrasts = 0;
                    data3.forEach(function(item) {
                        sshValues += item.sSH;
                        sshRates += item.anomalyRate;
                        sshContrasts += item.contrastSSH;
                    });
                    // 计算平均值
                    var sshSize = data3.length;
                    var sshValue = (sshValues / sshSize).toFixed(2),
                        sshRate = Math.round(sshRates / sshSize),
                        sshContrast = (sshContrasts / sshSize).toFixed(2);

                    content += '日照时数' + sshValue + '小时，' +
                        '较常年（' + sshContrast + '小时）';
                    if (sshRate > 0) {
                        content += '偏多' + Math.abs(sshRate) + '%';
                    } else if (sshRate < 0) {
                        content += '偏少' + Math.abs(sshRate) + '%';
                    } else content += '持平';
                    content += '。';

                    content += '（重庆市气候中心）';

                    textarea.val(content).focus();

                }).fail(function(err) {
                    loader.destroy();
                    self.log(err, 'error');
                    G.tip('产品生成失败...', false);
                });
            }
            // 注册提交
            OptUtil.submitter(submit);
            // 初始化
            init();
        }

    });

    // 任务注册
    ProductCreator.registerTask('QHJC', '气候监测短信', QHJCTask);

}(ProductCreator);
