/**
 * 气候评价-月
 * @author rexer
 * @date   2016-11-25
 */

~ function(ProductCreator) {

    // 任务定义
    var PJMonthTask = ProductCreator.Task.prototype.extend({
        create: function(OptUtil, template, corePage) {
            var self = this;
            var datepicker = tpl.Plugin.datepicker(OptUtil.toolbar, {
                type: 'date',
                config: {
                    startDate: moment().startOf('month'),
                    endDate: moment().endOf('month')
                }
            });
            var form = OptUtil.initForm(),
                titleInput = form.find('input[name="productTitle"]'),
                summaryInput = form.find('input[name="productSummary"]');

            //刷新按钮
            $('<button type="button" class="btn btn-primary">制作</button>').css({
                margin: '10px auto',
                width: '200px',
                display: 'block'
            }).click(init).appendTo(OptUtil.toolbar.find('.condition-content'));

            // 数据
            var queryData = null;
            // 进度条
            var loader = new tpl.Plugin.loader(OptUtil.layero);

            // 初始化
            function init() {
                loader.show('');

                function failed() {
                    queryData = null;
                    loader.hide();
                    G.tip('相关数据准备失败，请重试', false);
                }

                var starttime = datepicker.customDatePicker('getStartTime'),
                    endtime = datepicker.customDatePicker('getEndTime'),
                    year = endtime.year(),
                    month = endtime.month();
                var areaName = G.User.getAreaName();
                // 更新标题
                titleInput.val('（评价-月）' + starttime.format('YYYY年M月') + '重庆市气候影响评价');
                summaryInput.val('（评价-月） ' + areaName + '气候影响评价' + starttime.format('YYYY年MM月DD日') + '至' + endtime.format('YYYY年MM月DD日'));

                // 历年同期参数
                var sameCalPara = {
                    startDay: starttime.date(),
                    startMon: starttime.month() + 1,
                    endDay: endtime.date(),
                    endMon: endtime.month() + 1,
                    currentYear: year,
                    startYear: starttime.year(),
                    endYear: year,
                    FilterType: '',
                    StatisticsType: 'AVG',
                    standardStartYear: 1981,
                    standardEndYear: 2010,
                    station_Id_C: '5%'
                };
                // Debug
                var service = G.URL.getDataService(),
                    // var service = G.URL.getProductHost() + 'server/services/',
                    sameCalService = service + 'SameCalendarService/same';

                console.time('PJMonthTask');
                // 创建查询
                var Query = new DeferredQuery();
                // 添加查询
                Query.addQuery(sameCalService, $.extend({}, sameCalPara, {
                        EleType: 'AVGTEM',
                        _mark_: '月气温'
                    })).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 1,
                        endDay: 10,
                        EleType: 'AVGTEM',
                        _mark_: '上旬气温'
                    })).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 11,
                        endDay: 20,
                        EleType: 'AVGTEM',
                        _mark_: '中旬气温'
                    })).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 21,
                        endDay: endtime.date(),
                        EleType: 'AVGTEM',
                        _mark_: '下旬气温'
                    })).addQuery(service + 'CommonStatisticsService/queryAvgTem', {
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        contrastType: 'sameTeam',
                        startYear: 1981,
                        endYear: 2010,
                        stationType: 'AWS',
                        _mark_: '分区域气温统计'
                    }).addQuery(service + 'ExtStatisticsService/ext', {
                        EleType: 'AVGTEMMAX',
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        stationType: 'AWS',
                        isHistory: false,
                        _mark_: '气温极值最大'
                    }).addQuery(service + 'ExtStatisticsService/ext', {
                        EleType: 'AVGTEMMIN',
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        stationType: 'AWS',
                        isHistory: false,
                        _mark_: '气温极值最低'
                    }).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        EleType: 'AVGTEM',
                        startYear: 1951,
                        _mark_: '气温历年同期'
                    }))
                    // 降水部分
                    .addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 1,
                        endDay: 10,
                        EleType: 'PRETIME2020',
                        _mark_: '上旬降水'
                    })).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 11,
                        endDay: 20,
                        EleType: 'PRETIME2020',
                        _mark_: '中旬降水'
                    })).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        startDay: 21,
                        endDay: endtime.date(),
                        EleType: 'PRETIME2020',
                        _mark_: '下旬降水'
                    })).addQuery(service + 'CommonStatisticsService/queryPreSum', {
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        contrastType: 'sameTeam',
                        startYear: 1981,
                        endYear: 2010,
                        stationType: 'AWS',
                        type: '2020',
                        _mark_: '降水总量'
                    }).addQuery(service + 'ExtStatisticsService/ext', {
                        EleType: 'PRETIME2020',
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        stationType: 'AWS',
                        isHistory: false,
                        _mark_: '降水极值'
                    }).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        EleType: 'PRETIME2020',
                        startYear: 1951,
                        _mark_: '降水历年同期'
                    }))
                    // 日照
                    .addQuery(sameCalService, $.extend({}, sameCalPara, {
                        EleType: 'SSH'
                    })).addQuery(service + 'CommonStatisticsService/querySSH', {
                        startTime: starttime.format(tpl.FORMATTER.datetime),
                        endTime: endtime.format(tpl.FORMATTER.datetime),
                        contrastType: 'sameTeam',
                        startYear: 1981,
                        endYear: 2010,
                        stationType: 'AWS',
                        _mark_: '分区域日照统计'
                    }).addQuery(sameCalService, $.extend({}, sameCalPara, {
                        EleType: 'SSH',
                        startYear: 1951,
                        _mark_: '日照历年同期'
                    }))
                    // 查询
                    .query(function() {
                        queryData = {
                            issue: starttime.format('YYYY年第M期'),
                            sign: '',
                            sign_date: '',
                            title_date: starttime.format('YYYY年MM月'),
                            author: '', //编写人
                            corrector: '', //校对人
                            assessor: '', //审核人
                            // 暴雨 & 高温
                            rainstorm_summary: '',
                            rainstorm_county_summary: '',
                            hightem_summary: '',
                            hightem_county_summary: ''
                        };

                        var datas = Array.prototype.slice.call(arguments);
                        var tempData = datas.splice(0, 7), // 气温
                            tempSameTimeData = datas.shift(), // 气温历年同期
                            rainData = datas.splice(0, 5), //降水
                            rainSameTimeData = datas.shift(), //降水历年同期
                            sshData = datas.splice(0, 2), //日照
                            sshSameTimeData = datas.shift(); //日照历年同期

                        if (!G.isPretty(tempData) || 　!G.isPretty(tempSameTimeData) ||
                            !G.isPretty(rainData) || !G.isPretty(rainSameTimeData) ||
                            !G.isPretty(sshData) || !G.isPretty(sshSameTimeData)) {
                            failed();
                            return;
                        }

                        // 摘要
                        var summary = (month + 1) + '月全市';

                        // 气温内容
                        var tempContents = self.deal2Temp(tempData, endtime);
                        queryData.tem_summary = tempContents[0];
                        queryData.tem_county_summary = tempContents[1];
                        summary += '平均气温' + tempContents[2];
                        // 降水内容
                        var rainContents = self.deal2Rain(rainData, endtime);
                        queryData.pre_summary = rainContents[0];
                        queryData.pre_county_summary = rainContents[1];
                        summary += '；降水量较常年' + rainContents[2];
                        // 日照内容
                        var sshContents = self.deal2SSH(sshData, endtime);
                        queryData.ssh_summary = sshContents[0];
                        queryData.ssh_county_summary = sshContents[1];
                        summary += '；日照较常年同期' + sshContents[2] + '。';

                        queryData.summary = summary;

                        // =======================统计图=======================
                        // 获取历年同期Chart的X,Y值
                        function getXYFromSameTimeData(data) {
                            var x = [],
                                y1 = [],
                                y2 = [];
                            data.forEach(function(item) {
                                x.push(item.year);
                                y1.push(item.value);
                                y2.push(item.avgValue);
                            });
                            return [x, y1, y2];
                        }

                        // 气温历年同期
                        var xy1s = getXYFromSameTimeData(tempSameTimeData);

                        // 降水历年同期
                        var xy2s = getXYFromSameTimeData(rainSameTimeData);

                        // 日照历年同期
                        var xy3s = getXYFromSameTimeData(sshSameTimeData);

                        // 月气温
                        var tempAreaMonth = tempData[4] || [];
                        // 月降水
                        var rainAreaMonth = rainData[3] || [];
                        // 月日照
                        var sshAreaMonth = sshData[1] || [];

                        // 统计图与Surfer出图
                        $.when(self.chartMuse({ //历年同期平均气温统计图
                            chart: { type: 'spline' },
                            plotOptions: { spline: { dataLabels: { enabled: false } } },
                            xAxis: {
                                categories: xy1s[0],
                                labels: { step: 5 }
                            },
                            yAxis: { title: { text: '平均气温℃' } },
                            series: [
                                { data: xy1s[1], name: '历年值' },
                                { data: xy1s[2], name: '常年值(1981-2010年)' }
                            ]
                        }), self.chartMuse({ //月逐旬平均气温统计图
                            chart: { options3d: { enabled: false } },
                            xAxis: { categories: ['上旬', '中旬', '下旬'] },
                            yAxis: { title: { text: '平均气温℃' } },
                            series: [
                                { data: [tempData[1][0].value, tempData[2][0].value, tempData[3][0].value], name: '历年值' },
                                { data: [tempData[1][0].avgValue, tempData[2][0].avgValue, tempData[3][0].avgValue], name: '常年值(1981-2010年)' }
                            ]
                        }), self.surferMuse(tempAreaMonth, { //月平均气温空间分布图
                            dataSchema: {
                                value: 'tEM_Avg'
                            }
                        }, '气温-月'), self.surferMuse(tempAreaMonth, { //月距平空间分布图
                            dataSchema: {
                                value: 'anomaly'
                            }
                        }, '气温-月距平'), self.chartMuse({ //历年同期降水统计图
                            chart: { type: 'spline' },
                            plotOptions: { spline: { dataLabels: { enabled: false } } },
                            xAxis: {
                                categories: xy2s[0],
                                labels: { step: 5 }
                            },
                            yAxis: { title: { text: '降水量mm' } },
                            series: [
                                { data: xy2s[1], name: '历年值' },
                                { data: xy2s[2], name: '常年值(1981-2010年)' }
                            ]
                        }), self.chartMuse({ //月逐旬降水量统计图
                            chart: { options3d: { enabled: false } },
                            xAxis: { categories: ['上旬', '中旬', '下旬'] },
                            yAxis: { title: { text: '降水量mm' } },
                            series: [
                                { data: [rainData[1][0].value, rainData[2][0].value, rainData[3][0].value], name: '历年值' },
                                { data: [rainData[1][0].avgValue, rainData[2][0].avgValue, rainData[3][0].avgValue], name: '常年值(1981-2010年)' }
                            ]
                        }), self.surferMuse(rainAreaMonth, { //月降水量空间分布图
                            dataSchema: {
                                value: 'pRE_Time'
                            },
                            type: 'PRE'
                        }, '降水-月'), self.surferMuse(rainAreaMonth, { //月降水距平率空间分布图
                            dataSchema: {
                                value: 'anomalyRate'
                            }
                        }, '降水-月距平'), self.chartMuse({ //历年同期日照时数统计图
                            chart: { type: 'spline' },
                            plotOptions: { spline: { dataLabels: { enabled: false } } },
                            xAxis: {
                                categories: xy3s[0],
                                labels: { step: 5 }
                            },
                            yAxis: { title: { text: '日照时数（小时）' } },
                            series: [
                                { data: xy3s[1], name: '日照时数' },
                                { data: xy3s[2], name: '常年值(1981-2010年)' }
                            ]
                        }), self.surferMuse(sshAreaMonth, { //月日照空间分布图
                            dataSchema: {
                                value: 'sSH'
                            }
                        }, '日照-月'), self.surferMuse(sshAreaMonth, { //月日照距平率空间分布图
                            dataSchema: {
                                value: 'anomalyRate'
                            }
                        }, '日照-距平')).done(function() {
                            loader.hide();

                            // 获取base64
                            var base64s = [0]; //0占位
                            var dataURIs = Array.prototype.slice.call(arguments);
                            dataURIs.forEach(function(item) {
                                base64s.push(self.getBase64(item));
                            });

                            var month_str = month + 1 + '月',
                                year_str = year + '年',
                                year_month = year_str + month_str;

                            // 图1
                            queryData.tem_history_summary = '重庆' + month_str + '平均气温（℃）逐年（1951～' + year_str + '）变化';
                            queryData.img1 = base64s[1];
                            // 图2
                            queryData.tem_month_summary = year_month + '重庆逐旬平均气温（℃）';
                            queryData.img2 = base64s[2];
                            // 图3 4
                            queryData.tem_month_map = year_month + '重庆平均气温（a）、平均气温距平（b）分布（单位:℃）';
                            queryData.img3 = base64s[3];
                            queryData.img4 = base64s[4];

                            // 图5
                            queryData.pre_history_summary = '重庆' + month_str + '降水量（mm）逐年（1951～' + year_str + '）变化';
                            queryData.img5 = base64s[5];
                            // 图6
                            queryData.pre_months_summary = year_month + '重庆逐旬降水量（mm）';
                            queryData.img6 = base64s[6];
                            // 图7 8
                            queryData.pre_month_map = year_month + '重庆降水量（a,单位:mm）、降水距平百分率（b,单位:％）分布';
                            queryData.img7 = base64s[7];
                            queryData.img8 = base64s[8];

                            // 图9
                            queryData.ssh_history_summary = '重庆' + month_str + '日照时数（小时）逐年（1951～' + year_str + '）变化';
                            queryData.img9 = base64s[9];

                            // 图10 11
                            queryData.ssh_month_summary = year_month + '重庆日照时数（a,单位:小时）及距平百分率（b,单位:％）分布';
                            queryData.img10 = base64s[10];
                            queryData.img11 = base64s[11];

                            console.timeEnd('PJMonthTask');

                            console.log(queryData);

                        }).fail(failed);
                    }).fail(failed);
            }


            // 注册提交
            OptUtil.submitter(function() {
                if (!queryData) {
                    layer.tips('暂无数据');
                    return;
                }

                loader.show('');

                function failed() {
                    loader.hide();
                    G.tip('产品添加失败,请重试', false);
                }

                var para = {
                    productTemplateId: template.TemplateId,
                    productTitle: titleInput.val(),
                    productSummary: summaryInput.val(),
                    content: queryData
                };

                ProductCreator.Query.addProduct('addProduct', para, function(product) {
                    loader.hide();
                    if (!product) return failed();
                    G.tip('产品添加成功', true);
                    OptUtil.closePage();
                    OptUtil.display(product);
                }).fail(failed);

            });

            init();
        },
        getBase64: function(dataURI) {
            return (dataURI || ',').split(',')[1];
        },
        // 气温
        deal2Temp: function(data, date) {
            var temp = data[0][0],
                temp1 = data[1][0], //上旬气温
                temp2 = data[2][0], //中旬气温
                temp3 = data[3][0], //下旬气温
                tempArea = data[4], //区域
                tempExtMax = data[5], //最大值
                tempExtMin = data[6]; //最大值

            var content = [
                date.format('M'),
                '月全市平均气温',
                temp.value,
                '℃，较常年同期（',
                temp.avgValue,
                '℃）'
            ];

            var summary;
            var anomalyStr = Math.abs(temp.anomaly).toFixed(1) + '℃';
            if (temp.anomaly > 0) {
                summary = '偏高' + anomalyStr;
            } else if (temp.anomaly < 0) {
                summary = '偏低' + anomalyStr;
            } else summary = '持平';
            content.push(summary);

            content.push(
                '。月内气温：上旬',
                temp1.value,
                '℃，中旬',
                temp2.value,
                '℃，下旬',
                temp3.value,
                '℃。'
            );

            var content2 = [];
            // 分区域气温
            if (G.isPretty(tempArea)) {
                var maxArea = tempArea[0],
                    minArea = tempArea[0];
                tempArea.forEach(function(item) {
                    if (item.tEM_Avg < minArea.tEM_Avg) minArea = item;
                    if (item.tEM_Avg > maxArea.tEM_Avg) maxArea = item;
                });
                content2.push(
                    '各地平均气温在' + minArea.tEM_Avg + '～' + maxArea.tEM_Avg + '℃之间。',
                    '与常年同期相比，气温距平' + minArea.anomaly + '～' + maxArea.anomaly + '。'
                );
            }
            // 极值
            if (G.isPretty(tempExtMax)) {
                // 最大值
                var maxExt = tempExtMax[0];
                tempExtMax.forEach(function(item) {
                    if (item.highValue > maxExt.highValue) maxExt = item;
                });
                content2.push(
                    '月内极端最高气温为' + maxExt.highValue + '℃（' + maxExt.station_Name + '，' + moment(maxExt.highDate.split(',')[0]).date() + '日），'
                );
            }
            if (G.isPretty(tempExtMin)) {
                // 最小值
                var minExt = tempExtMin[0];
                tempExtMin.forEach(function(item) {
                    if (item.lowValue < minExt.lowValue) minExt = item;
                });
                content2.push(
                    '极端最低气温为' + minExt.lowValue + '℃（' + minExt.station_Name + '，' + moment(minExt.lowDate.split(',')[0]).date() + '日）。'
                );
            }

            return [content.join(''), content2.join(''), summary];
        },
        // 降水
        deal2Rain: function(data, date) {
            var rain1 = data[0][0], //上旬降水
                rain2 = data[1][0], //中旬降水
                rain3 = data[2][0], //下旬降水
                rainArea = data[3], //区域 | 降水总量
                rainExtAWS = data[4]; //国家站极值

            // 计算月数据
            var sumValue = 0, //总量
                sumAnomalyRate = 0, //距平
                sumContrast = 0; //多年均值
            //极值区域
            var maxArea = rainArea[0],
                minArea = rainArea[0];
            var length = rainArea.length;
            rainArea.forEach(function(item) {
                // 求和
                sumValue += item.pRE_Time;
                sumContrast += item.contrastPRE_Time;
                sumAnomalyRate += item.anomalyRate;
                // 求极值
                if (item.pRE_Time < minArea.pRE_Time) minArea = item;
                if (item.pRE_Time > maxArea.pRE_Time) maxArea = item;
            });

            var content = [
                date.format('M'),
                '月全市平均降水量',
                (sumValue / length).toFixed(1),
                'mm，较常年同期（',
                (sumContrast / length).toFixed(1),
                'mm）'
            ];

            var summary; //摘要
            var anomalyStr = Math.abs(sumAnomalyRate / length).toFixed(1) + '%';
            if (sumValue > sumContrast) {
                summary = '偏高' + anomalyStr;
            } else if (sumValue < sumContrast) {
                summary = '偏低' + anomalyStr;
            } else summary = '持平';
            content.push(summary);
            content.push(
                '。月内降水量：上旬',
                rain1.value,
                'mm，中旬',
                rain2.value,
                'mm，下旬',
                rain3.value,
                'mm。'
            );

            var content2 = [
                '各地降水量在' + minArea.pRE_Time + '～' + maxArea.pRE_Time + 'mm之间。',
                '与常年同期相比，降水量距平' + minArea.anomaly + '～' + maxArea.anomaly + '。'
            ];
            // 极值
            if (G.isPretty(rainExtAWS)) {
                var maxExtAWS = rainExtAWS[0];
                rainExtAWS.forEach(function(item) {
                    if (item.highValue > maxExtAWS.highValue) maxExtAWS = item;
                });
                content2.push(
                    '月内国家站日雨量极值为' + maxExtAWS.highValue + 'mm（' + maxExtAWS.station_Name + '，' + moment(maxExtAWS.highDate).date() + '日）。'
                );
            }

            return [content.join(''), content2.join(''), summary];
        },
        // 日照
        deal2SSH: function(data, date) {
            var ssh = data[0][0], //月日照
                sshArea = data[1]; //区域

            var content = [
                date.format('M'),
                '全市平均日照时数为',
                ssh.value,
                '小时，较常年同期（',
                ssh.avgValue,
                '小时）'
            ];
            var summary;
            var anomalyStr = Math.abs(ssh.anomalyRate) + '%';
            if (ssh.anomalyRate > 0) {
                summary = '偏多' + anomalyStr;
                content.push();
            } else if (ssh.anomalyRate < 0) {
                summary = '偏少' + anomalyStr;
            } else summary = '持平';
            content.push(summary);

            // 区域
            var content2 = [];
            if (sshArea && sshArea.length > 0) {
                var maxArea = sshArea[0],
                    minArea = sshArea[0],
                    highAreas = []; //距平<2的区域
                sshArea.forEach(function(item) {
                    if (item.sSH < minArea.sSH) minArea = item;
                    if (item.sSH > maxArea.sSH) maxArea = item;
                    if (item.anomalyRate < 2) highAreas.push(item.station_Name);
                });

                content2.push(
                    '各地日照时数在' + minArea.sSH + '～' + maxArea.sSH + '小时之间。',
                    '与常年同期相比，除' + highAreas.join() + '正常外,其余地区偏多2~' + maxArea.anomalyRate + '成。'
                );
            }

            return [content.join(''), content2.join(''), summary];
        }
    });

    // 任务注册
    ProductCreator.registerTask('QHYPJ', '气候月评价', PJMonthTask);

}(ProductCreator);
