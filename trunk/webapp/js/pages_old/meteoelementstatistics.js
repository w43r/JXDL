/**
 * 气象要素统计
 * @author rexer
 * @date   2016-06-08
 */
var corePage;
var run = function() {

  corePage = new tpl('气象要素统计').ready(function(event) {
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');

    tpl.ext.loadStation(function(data) {
      // 首次拉取数据为异步，localStorge读取数据为同步
      corePage.StationData = data;
      corePage.menu([{
          text: '常规统计',
          value: 'm1',
          handler: function() { //获取配置
            $.getJSON('data/dataschema/normalStatPage.dataSchema.json').done(function(json) {
              normalStatPage.call(corePage, json);
            }).fail(function(a, b, c) {
              throw new Error(c);
            });
          }
        },
        { text: '位次统计', value: 'm2', handler: rankStatPage },
        { text: '极值统计', value: 'm3', handler: extremeStatPage },
        { text: '日数统计', value: 'm4', handler: DayStatPage },
        { text: '持续时间统计', value: 'm5', handler: lastTimeStatPage },
        { text: '初终日统计', value: 'm6', handler: startEndStatPage },
        { text: '历年同期统计', value: 'm7', handler: sameTimeStatPage },
        { text: '高温日数', value: 'm8', handler: highTempPage },
        { text: '积温计算', value: 'm9', handler: accTempPage },
        { text: '连续变化', value: 'm10', handler: conChangePage },
        { text: '风', value: 'm10', handler: windPage },
        { text: '云量', value: 'm10', handler: cloudPage }, {
          text: '重现期',
          value: 'm11',
          handler: function() { //获取配置
            $.getJSON('data/PHI.json').done(function(json) {
              cxqPage.call(corePage, json);
            }).fail(function(a, b, c) {
              throw new Error(c);
            });
          }
        }
      ]);
    });
  });
};
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
 * 常规统计
 */
var normalStatPage = function(dataSchema) {
  var queryData;
  var queryType;
  var diffType = 'range';
  var displayType = 'grid';

  // 制图排除数据
  var checkData = {
    eleItem: null, // 当前项
    data: null, // 数据
    source: null // 原数据
  }

  var getCondition = function() {
    return getPara({
      startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      contrastType: diffType,
      contrastStartTime: $daterange.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      contrastEndTime: $daterange.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val()),
      year: Number($year_s.find('.year').val()),
      type: $rainRadios.siblings('.active').val(),
      stationType: $stationRadios.siblings('.active').attr('data')
    });
  };

  var getPara = function(paras) {
    var paraKeys = dataSchema[queryType].para || dataSchema[queryType][diffType].para;
    var para = {};
    paraKeys.forEach(function(key) {
      para[key] = paras[key];
    });
    para.stationType = paras.stationType;
    var service = $typeRadios.siblings('.active').data('service') || 'CommonStatisticsService/';
    para._service_ = service + queryType;
    corePage.qCondition.set(para);
    return para;
  };

  var initGrid = function(data) {
    var colProp = dataSchema[queryType].cols || dataSchema[queryType][diffType].cols;
    var instance = corePage.grid(colProp, data); //固定最后一行
    corePage.Grid = instance;
    /**
     * 计算各列平均值
     */
    var avgRowTitle = '合计平均值';
    var ROWS_COUNT = data.length; //instance.countRows();
    var COLS_COUNT = instance.countCols();
    // 无数据 / 已计算
    if (ROWS_COUNT <= 1 || instance.getDataAtCell(ROWS_COUNT - 1, 0) == avgRowTitle) return;
    instance.updateSettings({ fixedRowsBottom: 1 });
    // 正则表达
    var avgColExpr = new RegExp((dataSchema[queryType].avg || dataSchema[queryType][diffType].avg).join('|'));
    // 插入新行
    instance.alter('insert_row', ROWS_COUNT);
    instance.setDataAtCell(ROWS_COUNT, 0, avgRowTitle);
    for (var col = 1; col < COLS_COUNT; col++) {
      if (avgColExpr.test(col)) { // 计算平均值
        var values = instance.getDataAtCol(col),
          sum = 0;
        values.forEach(function(item, i) {
          var value = Number(item);
          if (isNaN(value)) {
            console.log(i, value)
          } else sum += value;
        });
        var avg = sum / ROWS_COUNT;
        instance.setDataAtCell(ROWS_COUNT, col, avg);
        // 新增行的数值格式
        instance.setCellMetaObject(ROWS_COUNT, col, {
          format: '0.0',
          type: 'numeric'
        });
      } else {
        instance.setDataAtCell(ROWS_COUNT, col, '-');
      }
    }
  };
  var initMapToolbar = function(items) {
    var $select = $('<select class="tpl-map-ele tpl-toolbar-item"></select>').on('change', function(event) {
      event.preventDefault();
      if (displayType === 'map') initMap(queryData);
      else corePage.surfer({
        dataSchema: { value: this.value }
      }, queryData);
    });

    items.forEach(function(item) {
      $('<option></option>').val(item.value).html(item.name).data('style', item.style)
        .prop('selected', item.value === checkData.eleItem)
        .appendTo($select);
    });

    // 按钮组
    $('<div class="tpl-toolbar-group"></div>')
      .append('<span class="tpl-toolbar-title">要素</span>')
      .append($select)
      .prependTo(corePage.$toolbar);

  };
  var initMap = function(data) {
    var $ele = $typeRadios.siblings('.active');
    var $selectOpt = $('.tpl-map-ele').find('option:checked');
    var key = $('.tpl-map-ele').val();
    var eleName = $ele.text();
    var cnKey = $selectOpt.text();
    var selectStyle = $selectOpt.data('style');
    var condition = corePage.qCondition.get();
    var styleObj = selectStyle || $ele.data('style'); // 获取styleObj
    var surferOpt = $.extend({}, $typeRadios.siblings('.active').data('surfer'));
    var areaName = G.User.getAreaName();
    // 排除数据
    var mapData = [];
    data.forEach(function(item) {
      if (item.checked) return;
      mapData.push(item);
    });

    corePage.Map = corePage.map({
      title: areaName + (cnKey == eleName ? eleName : eleName + cnKey) + '分布图',
      subtitle: moment(condition.startTime).format(tpl.FORMATTER.date) + '至' + moment(condition.endTime).format(tpl.FORMATTER.date),
      dataSchema: { value: key },
      style: styleObj,
      meteoType: surferOpt.fillColor //和surfer属性一致
    }, mapData);


  };


  function checkMapDataByGrid() {
    var eleItem = $('.tpl-map-ele').val();
    var html = `<div>
  <div class="row">
    <div class="col col-md-12" style="padding-bottom: 5px; text-align:right;">
      <a id="checkData-submit" class="btn btn-success">确定</a>
      <a id="checkData-close" class="btn btn-default">取消</a>
    </div>
  </div>
  <div class="row">
    <div id="checkData-table" class="col col-md-12" style="height: 600px;"></div>
  </div>
</div>`;

    var layerIndex = layer.open({
      title: '制图 - 数据排除',
      content: html,
      area: ['900px'],
      btn: [],
      success: function() {
        var colProp = dataSchema[queryType].cols || dataSchema[queryType][diffType].cols;
        var cols = [{ title: '制图排除', data: 'checked', type: 'checkbox' }]
          .concat(colProp);

        var hot = gridHelper.initGrid('#checkData-table', cols, queryData, {
          currentRowClassName: 'highlightRow'
        });

        // events
        $('#checkData-submit').click(function(e) {
          debugger;
          e.preventDefault();
          layer.close(layerIndex);
          initMap(queryData);
        });
        $('#checkData-close').click(function(e) {
          e.preventDefault();
          layer.close(layerIndex);
        });
      },
    });

  }

  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'map':
        initMapToolbar(dataSchema[queryType].map || dataSchema[queryType][diffType].map);
        // 添加站点排除按钮
        $('<button id="map-data-check" class="map-ctrl tpl-btn btn-success">数据排除</button>').on('click', function(event) {
          checkMapDataByGrid();
        }).appendTo(corePage.$toolbar);
        initMap(data);
        break;
      case 'surfer':
        initMapToolbar(dataSchema[queryType].map || dataSchema[queryType][diffType].map);
        var key = $('.tpl-map-ele').val();
        var surferOpt = $.extend({}, $typeRadios.siblings('.active').data('surfer'));
        if (surferOpt.fillColor === 'TEMP') {
          var startMonth = $datepicker.customDatePicker('getStartTime').month() + 1;
          var endMonth = $datepicker.customDatePicker('getEndTime').month() + 1;
          surferOpt.fillColor = SurferControl.getTempFillColor(startMonth, endMonth);
        }
        corePage.surfer({
          surfer: surferOpt,
          dataSchema: { value: key }
        }, data);
        break;
    }
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    className: 'dataType',
    items: [
      { text: '平均气温', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryAvgTem' } },
      { text: '高温均值', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryAvgTemMax' } },
      { text: '低温均值', data: { surfer: { fillColor: 'PRE' }, style: { type: 'auto', option: { colorType: 'c' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryAvgTemMin' } },
      { text: '降水总量', data: { surfer: { fillColor: 'PRE' }, style: { type: 'auto', option: { colorType: 'c' } } }, attr: { data: '.query-item-date,.query-item-0,.query-item-1', value: 'queryPreSum' } },
      { text: '日照时数', data: { style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'querySSH' } },
      { text: '相对湿度', data: { surfer: { fillColor: 'RHU' }, style: { type: 'auto', option: { colorType: 'c' } } }, attr: { data: '.query-item-date,.query-item-0', 'data-style': '0', value: 'queryRHU' } },
      { text: '极端气温', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date', value: 'queryExtTmp' } },
      { text: '平均风速', data: { surfer: { fillColor: 'WIND' }, style: { type: 'auto', option: { colorType: 'c' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryWin_s_2mi_avg' } },
      { text: '降水日数', data: { surfer: { fillColor: 'PRE' }, style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryPreCnt' } },
      { text: '平均气压', data: { style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryPrsAvg' } },
      { text: '高温日数', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } } }, attr: { data: '.query-item-date,.query-item-0', value: 'queryTmpMaxCnt' } },
      { text: '最小能见度', data: { style: { type: 'auto', option: { colorType: 'w', isReverse: true } } }, attr: { data: '.query-item-date', value: 'queryVisMin' } },
      { text: '气温日较差', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } }, service: 'TmpGapService/' }, attr: { data: '.query-item-date,.query-item-0', value: 'getTmpByTimes' } },
      { text: '气温年较差', data: { surfer: { fillColor: 'TEMP' }, style: { type: 'auto', option: { colorType: 'w' } }, service: 'TmpGapService/' }, attr: { data: '.query-item-2', value: 'getTmpByYear' } }
    ],
    handler: function(event) {
      tpl.ext.toggleCondition(this);
      queryType = $(this).val();
      if ($diffRadios.is(':hidden')) {
        $('.diff-item-year').hide();
        $('.diff-item-date').hide();
        corePage.onStatistics();
      } else $diffRadios.siblings('.active').removeClass('active').click();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, {
    className: 'query-item-date',
    type: 'date',
    ctrl: '<span class="custom-datepicker">' + [
      '<input type="number" class="custom-datepicker ext year"></input>',
      '<select class="custom-datepicker ext month"></select>',
      '<select class="custom-datepicker ext hou"></select>'
    ].join('') + '</span>'
  });

  var $diffRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '对比',
    className: 'query-item-0',
    items: [{
      text: '多年均值',
      attr: { value: 'sameTeam' },
      handler: function() {
        $('.diff-item-year').show();
        $('.diff-item-date').hide();
      }
    }, {
      text: '时段值',
      attr: { value: 'range' },
      handler: function() {
        $('.diff-item-year').hide();
        $('.diff-item-date').show();
      }
    }],
    handler: function(event) {
      diffType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $year = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'diff-item-year', title: false });

  var $year_s = tpl.Plugin.customize(corePage.$condition, '<input type="number" class="custom-datepicker ext year" value=' + moment().year() + '>', {
    title: '年份',
    className: 'query-item-2'
  });

  var $daterange = tpl.Plugin.datepicker(this.$condition, { className: 'diff-item-date', title: false });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map', 'surfer']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  var $rainRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '雨量',
    className: 'query-item-1',
    items: [
      { text: '08-08时', attr: { value: '0808' } },
      { text: '08-20时', attr: { value: '0820' } },
      { text: '20-08时', attr: { value: '2008' } },
      { text: '20-20时', attr: { value: '2020' } },
    ],
    handler: function() {
      corePage.onStatistics();
    }
  }, 3);

  this.condition(); //同步条件状态
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query(para._service_, para, function(data) {
      if (tpl.ext.isExpectedType(data)) {
        Array.isArray(data) && data.forEach(function(item) {
          item.checked = false;
        });
        queryData = data;
        display(data);
      } else {
        console.log(data);
        queryData = null;
        display([]);
      }
    });
    // 重置状态
    checkData = {};
  });
  //默认
  $typeRadios.siblings('.active').removeClass('active').click();
};

/**
 * 位次统计
 */
var rankStatPage = function(dataSchema) {
  var queryData;
  var queryType;
  var displayType = 'grid';

  var getCondition = function() {
    var startTime = $datepicker.customDatePicker('getStartTime'),
      endTime = $datepicker.customDatePicker('getEndTime');
    var para = {
      startDay: startTime.date(),
      startMon: startTime.month() + 1,
      endDay: endTime.date(),
      endMon: endTime.month() + 1,
      currentYear: startTime.year(),
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val()),
      sortType: $('.rank-index-radio').val(),
      FilterType: $operators.siblings('.active').val() || '',
      min: $('#jxMinValue').val(),
      max: $('#jxMaxValue').val(),
      contrast: $('#jxValue').val(),
      EleType: queryType,
      stationType: $stationRadios.siblings('.active').attr('data'),
      StatisticsType: $results.siblings('.active').val(),
      _startTimeStr_: startTime.format(tpl.FORMATTER.date),
      _endTimeStr_: endTime.format(tpl.FORMATTER.date)
    };
    if (!para.min) delete para.min;
    if (!para.max) delete para.max;
    if (!para.contrast) delete para.contrast;
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    var para = corePage.qCondition.get();
    var cols = [
      { title: '序号', data: 'index' },
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: para.currentYear + '年值', data: 'yearValue', type: 'numeric', format: '0.0' },
      { title: para.currentYear + '位次', data: 'yearRanking', type: 'numeric' },
      { title: '极值', data: 'extValue', type: 'numeric', format: '0.0' },
      { title: '极值年', data: 'extYears', type: 'numeric' }
    ];
    if (para.StatisticsType === 'MAX' || para.StatisticsType === 'MIN') {
      cols.push({ title: '极值日期', data: 'extDateStr' });
    }
    corePage.Grid = corePage.grid(cols, data);
  };

  function initChart(data) {
    var para = corePage.qCondition.get(),
      yearStr = para.currentYear + '年',
      startTime = para._startTimeStr_,
      endTime = para._endTimeStr_,
      $eleItem = $typeRadios.siblings('.active'),
      item_name = $eleItem.html(),
      item_unit = $eleItem.attr('data-unit'),
      stations = [],
      serie1s = [],
      serie2s = [];
    data.forEach(function(item) {
      stations.push(item.station_Name);
      serie1s.push(item.yearValue);
      serie2s.push(item.yearRanking);
    });
    corePage.Chart = corePage.chart({ categories: stations }, [
      { title: { text: yearStr + '位次' } },
      { title: { text: item_name + '(' + item_unit + ')' }, opposite: true }
    ], [
      { yAxis: 0, name: '位次', data: serie2s },
      { yAxis: 1, name: item_name, data: serie1s, type: 'spline' }
    ], {
      title: { text: yearStr + item_name + '位次统计图' },
      subtitle: { text: startTime + '至' + endTime }
    });
  }

  function initMap(data) {
    var para = corePage.qCondition.get(),
      yearStr = para.currentYear + '年',
      $eleItem = $typeRadios.siblings('.active'),
      item_name = $eleItem.html(),
      $typeItem = $('#map-toolbar-type').find('option:checked'),
      type_name = $typeItem.text(),
      type_value = $typeItem.val();
    var option = $typeRadios.siblings('.active').data('map');
    corePage.Map = corePage.map({
      title: yearStr + item_name + type_name + '空间分布图',
      subtitle: para._startTimeStr_ + '至' + para._endTimeStr_,
      dataSchema: { value: type_value },
      style: option.style,
      meteoType: option.meteoType
    }, data);
  }

  function initMapToolbar() {
    $('<div class="tpl-toolbar-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="tpl-toolbar-title">类型</span>')
      .append(
        '<select id="map-toolbar-type" class="tpl-toolbar-item">' +
        '<option value="yearRanking" checked>位次</option>' +
        '<option value="yearValue">年值</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData);
      });
  }

  function display(data) {
    corePage.$toolbar.empty();
    corePage.$panel.empty();
    if (!G.isPretty(data)) {
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
        break;
      case 'map':
        initMapToolbar();
        initMap(data);
        break;
    }
  }

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    items: [
      { text: '平均气温', data: { map: { meteoType: 'TEMP', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': '℃', value: 'AVGTEM' } },
      { text: '最高气温', data: { map: { meteoType: 'TEMP', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': '℃', value: 'AVGTEMMAX' } },
      { text: '最低气温', data: { map: { meteoType: 'TEMP', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': '℃', value: 'AVGTEMMIN' } },
      { text: '08-08降水', data: { map: { meteoType: 'PRE', style: { type: 'auto', option: { colorType: 'c' } } } }, attr: { 'data-unit': 'mm', value: 'PRETIME0808' } },
      { text: '08-20降水', data: { map: { meteoType: 'PRE', style: { type: 'auto', option: { colorType: 'c' } } } }, attr: { 'data-unit': 'mm', value: 'PRETIME0820' } },
      { text: '20-08降水', data: { map: { meteoType: 'PRE', style: { type: 'auto', option: { colorType: 'c' } } } }, attr: { 'data-unit': 'mm', value: 'PRETIME2008' } },
      { text: '20-20降水', data: { map: { meteoType: 'PRE', style: { type: 'auto', option: { colorType: 'c' } } } }, attr: { 'data-unit': 'mm', value: 'PRETIME2020' } },
      { text: '相对湿度', data: { map: { meteoType: 'RHU', style: { type: 'auto', option: { colorType: 'c' } } } }, attr: { 'data-unit': '%', value: 'RHUAVG' } },
      { text: '平均风速', data: { map: { meteoType: 'WIND', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': 'm/s', value: 'WINS2MIAVG' } },
      { text: '平均气压', data: { map: { meteoType: '', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': 'hPa', value: 'PRSAVG' } },
      { text: '日照时数', data: { map: { meteoType: '', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': 'h', value: 'SSH' } },
      { text: '最小能见度', data: { map: { meteoType: '', style: { type: 'auto', option: { colorType: 'w' } } } }, attr: { 'data-unit': 'm', value: 'VISMIN' } },
    ],
    handler: function(event) {
      // tpl.ext.toggleCondition(this);
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $results = tpl.Plugin.radiobtn(this.$condition, {
    title: '期间',
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
    className: 'rank-operators',
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
      $('.rank-operator').remove();
      tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'rank-operator' })
        .insertAfter('.rank-operators');
    }
  }, 5);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year = tpl.Plugin.year(this.$condition, { type: 'perennial', title: '跨度' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: ['次序',
      '<button value="HIGH" class="rank-index-radio radiobutton-min tpl-radiobtn-item active">高</button>',
      '<button value="LOW" class="rank-index-radio radiobutton-min tpl-radiobtn-item">低</button>'
    ].join(''),
    items: [{
      title: false,
      content: [
        '<input class="rank-index-tie-check" type="checkbox" style="margin:3px 2px auto 5px;float: left">',
        '<span style="margin-top: 0;font-size: 14px">并列位次，缺位处理（1,2,2,4）</span>'
      ].join('')
    }, {
      title: false,
      content: [
        '<input class="rank-index-miss-check" type="checkbox" style="margin:3px 2px auto 5px;float: left">',
        '<span style="margin-top: 0;font-size: 14px;float: left">缺测日数 &lt; 总日数的1 / </span>',
        '<input class="rank-index-miss" value="10" min="1" type="number">'
      ].join('')
    }]
  });
  $('.rank-index-radio').click(function(event) { //index-radiobtn.click
    if ($(this).hasClass('active')) event.stopImmediatePropagation();
    else $(this).addClass('active').siblings().removeClass('active');
  }).click(function() {
    corePage.onStatistics();
  });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart', 'map']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition(); //同步条件状态
  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('RankServices/rank', getCondition(), function(data) {
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
  $operators.siblings('.active').removeClass('active').click();
  $typeRadios.siblings('.active').removeClass('active').click();
};

/**
 * 极值统计
 */
var extremeStatPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '序号', data: 'index' },
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '平均值', data: 'avgValue', type: 'numeric', format: '0.0' },
    { title: '高值', data: 'highValue', type: 'numeric', format: '0.0' },
    { title: '高值日期', data: 'highDate' },
    { title: '低值', data: 'lowValue', type: 'numeric', format: '0.0' },
    { title: '低值日期', data: 'lowDate' },
    { title: '历史高值', data: 'hisHighValue', type: 'numeric', format: '0.0' },
    { title: '历史高值日期', data: 'hisHighDate' },
    { title: '历史低值', data: 'hisLowValue', type: 'numeric', format: '0.0' },
    { title: '历史低值日期', data: 'hisLowDate' }
  ];
  var getCondition = function() {
    var para = {
      EleType: queryType,
      startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      stationType: $stationRadios.siblings('.active').attr('data'),
      isHistory: $('.ext-history-check').is(':checked')
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(corePage.qCondition.get().isHistory ? cols : cols.slice(0, 8), data);
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  this.toolbar(tpl.TOOLBAR[displayType]);
  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    items: [
      { text: '平均气温', attr: { 'data-unit': '℃', value: 'AVGTEM' } },
      { text: '最高气温', attr: { 'data-unit': '℃', value: 'AVGTEMMAX' } },
      { text: '最低气温', attr: { 'data-unit': '℃', value: 'AVGTEMMIN' } },
      { text: '08-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME0808' } },
      { text: '08-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME0820' } },
      { text: '20-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME2008' } },
      { text: '20-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME2020' } },
      { text: '相对湿度', attr: { 'data-unit': '%', value: 'RHUAVG' } },
      { text: '平均风速', attr: { 'data-unit': 'm/s', value: 'WINS2MIAVG' } },
      { text: '平均气压', attr: { 'data-unit': 'hPa', value: 'PRSAVG' } },
      { text: '日照时数', attr: { 'data-unit': 'h', value: 'SSH' } },
      { text: '最小能见度', attr: { 'data-unit': 'm', value: 'VISMIN' } }
    ],
    handler: function(event) {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });
  tpl.Plugin.customize(this.$condition, '<span class="tpl-check"><input type="checkbox" class="ext-history-check">历史极值</span>', { title: false }).on('click change', '.ext-history-check', function() {
    corePage.onStatistics();
  });
  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });
  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });
  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('ExtStatisticsService/ext', getCondition(), function(data) {
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
  $typeRadios.siblings('.active').removeClass('active').click();
};

/**
 * 日数统计
 */
var DayStatPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '序号', data: 'index' },
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '日数', data: 'days', type: 'numeric', format: '0.0' },
    { title: '多年均值', data: 'hisAvgDays', type: 'numeric', format: '0.0' },
    { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' }
  ];
  var getCondition = function() {
    var para = {
      EleType: queryType,
      startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      FilterType: $operators.siblings('.active').val() || '' || '',
      stationType: $stationRadios.siblings('.active').attr('data'),
      min: $('#jxMinValue').val(),
      max: $('#jxMaxValue').val(),
      contrast: $('#jxValue').val(),
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val())
    };
    if (!para.min) delete para.min;
    if (!para.max) delete para.max;
    if (!para.contrast) delete para.contrast;
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    var instance = corePage.grid(corePage.qCondition.get().isHistory ? cols : cols.slice(0, 7), data);
    corePage.Grid = instance;
    /**
     * 计算各列平均值
     */
    var avgRowTitle = '合计平均值';
    var ROWS_COUNT = data.length; //instance.countRows();
    var COLS_COUNT = instance.countCols();
    // 无数据 / 已计算
    if (ROWS_COUNT <= 1 || instance.getDataAtCell(ROWS_COUNT - 1, 0) == avgRowTitle) return;
    instance.updateSettings({ fixedRowsBottom: 1 });
    // 正则表达
    var avgColExpr = /4|5|6/;
    // 插入新行
    instance.alter('insert_row', ROWS_COUNT);
    instance.setDataAtCell(ROWS_COUNT, 0, avgRowTitle);
    for (var col = 1; col < COLS_COUNT; col++) {
      if (avgColExpr.test(col)) { // 计算平均值
        var values = instance.getDataAtCol(col),
          sum = 0;
        values.forEach(function(item, i) {
          var value = Number(item);
          if (isNaN(value)) {
            console.log(i, value)
          } else sum += value;
        });
        var avg = sum / ROWS_COUNT;
        instance.setDataAtCell(ROWS_COUNT, col, avg);
        // 新增行的数值格式
        instance.setCellMetaObject(ROWS_COUNT, col, {
          format: '0.0',
          type: 'numeric'
        });
      } else {
        instance.setDataAtCell(ROWS_COUNT, col, '-');
      }
    }
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  this.toolbar(tpl.TOOLBAR[displayType]);
  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    items: [
      { text: '最高气温', attr: { value: 'AVGTEMMAX' } },
      { text: '最低气温', attr: { value: 'AVGTEMMIN' } },
      { text: '平均气温', attr: { value: 'AVGTEM' } },
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
    handler: function(event) {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });
  var $operators = tpl.Plugin.radiobtn(this.$condition, {
    title: '日值',
    className: 'tpl-operators',
    items: [
      { text: '&gt;=', attr: { value: 'GET' } },
      { text: '&gt;', attr: { value: 'GT' } },
      { text: '=', attr: { value: 'EQUALS' } },
      { text: '&lt;', attr: { value: 'LT' } },
      { text: '&lt;=', attr: { value: 'LET' } },
      { text: '介于', attr: { value: 'BETWEEN' } }
    ],
    handler: function() {
      var html;
      if ($(this).val() === 'BETWEEN') {
        html = '&gt;=<input id="jxMinValue" class="singleTime" value="35" type="number"> 且 &lt;=<input id="jxMaxValue" class="singleTime" value="36.9" type="number">';
      } else {
        html = $(this).html() + '<input id="jxValue" class="singleTime" value="35" type="number">';
      }
      $('.tpl-operator').remove();
      tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'tpl-operator' })
        .insertAfter('.tpl-operators');
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year = tpl.Plugin.year(this.$condition, { type: 'perennial' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('DaysStatisticsService/ext', getCondition(), function(data) {
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
  $operators.siblings('.active').removeClass('active').click();
  $typeRadios.siblings('.active').removeClass('active').click();
};

/**
 * 持续时间统计
 */
var lastTimeStatPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    elementType: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '开始期', data: 'startTime' },
      { title: '结束期', data: 'endTime' },
      { title: '日均值', data: 'avgValue', type: 'numeric', format: '0.0' },
      { title: '过程总量', data: 'sumValue', type: 'numeric', format: '0.0' },
      { title: '持续天数', data: 'days', type: 'numeric' },
    ],
    temType: {
      UP: [
        { title: '站号', data: 'station_Id_C' },
        { title: '站名', data: 'station_Name' },
        { title: '开始期', data: 'startTime' },
        { title: '结束期', data: 'endTime' },
        { title: '增温幅度', data: 'scopeValue', type: 'numeric', format: '0.0' },
        { title: '持续天数', data: 'days', type: 'numeric' },
      ],
      DOWN: [
        { title: '站号', data: 'station_Id_C' },
        { title: '站名', data: 'station_Name' },
        { title: '开始期', data: 'startTime' },
        { title: '结束期', data: 'endTime' },
        { title: '降温幅度', data: 'scopeValue', type: 'numeric', format: '0.0' },
        { title: '持续天数', data: 'days', type: 'numeric' },
      ],
    },
    rainType: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '开始期', data: 'startTime' },
      { title: '结束期', data: 'endTime' },
      { title: '过程降水', data: 'rain', type: 'numeric', format: '0.0' },
      { title: '持续天数', data: 'days', type: 'numeric' },
    ]
  };

  var getCondition = function() {
    var para = {
      startTime: $datepicker.customDatePicker('getStartTime'),
      endTime: $datepicker.customDatePicker('getEndTime'),
      FilterType: $operators.siblings('.active').val() || '',
      stationType: $stationRadios.siblings('.active').attr('data')
    };
    switch (queryType) {
      case 'rainType':
        para._service_ = 'rain';
        $.extend(para, {
          EleType: $rainRadios.siblings('.active').val(),
          changeType: $rainChangeRadios.siblings('.active').val(),
          '_service_': 'rain'
        });
        break;
      case 'temType':
        $.extend(para, {
          type: $tempChangeRadios.siblings('.active').val(),
          '_service_': 'tmp'
        });
        break;
      case 'elementType':
        $.extend(para, {
          EleType: $eleRadios.siblings('.active').val(),
          contrast: $('#jxValue').val(),
          station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
          '_service_': 'persist'
        });
        break;
    }
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(queryType === 'temType' ? cols[queryType][corePage.qCondition.get().type] : cols[queryType], data);
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  this.toolbar(tpl.TOOLBAR[displayType]);
  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '晴雨', attr: { data: '.query-item-0', value: 'rainType' } },
      { text: '气温', attr: { data: '.query-item-1', value: 'temType' } },
      { text: '要素', attr: { data: '.query-item-2', value: 'elementType' } }
    ],
    handler: function(event) {
      tpl.ext.toggleCondition(this);
      queryType = $(this).val();
      if (queryType === 'elementType') $operators.siblings('.active').removeClass('active').click();
      corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });


  var $rainRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '日雨量',
    className: 'query-item-0',
    items: [
      { text: '08-08时', attr: { value: 'PRETIME0808' } },
      { text: '20-20时', attr: { value: 'PRETIME2020' } }
    ],
    handler: function(event) {
      corePage.onStatistics();
    }
  }, 1);

  var $rainChangeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '变化',
    className: 'query-item-0',
    items: [
      { text: '连雨', attr: { value: 'RAIN' } },
      { text: '连晴', attr: { value: 'SUN' } }
    ],
    handler: function(event) {
      corePage.onStatistics();
    }
  });

  var $tempChangeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '变化',
    className: 'query-item-1',
    items: [
      { text: '降温', attr: { value: 'DOWN' } },
      { text: '升温', attr: { value: 'UP' } }
    ],
    handler: function(event) {
      corePage.onStatistics();
    }
  });

  var $eleRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    className: 'query-item-2',
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
    handler: function(event) {
      corePage.onStatistics();
    }
  });

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-2');

  var $operators = tpl.Plugin.radiobtn(this.$condition, {
    title: '日值',
    className: 'tpl-operators query-item-2',
    items: [
      { text: '&gt;', attr: { value: 'GT' } },
      { text: '=', attr: { value: 'EQUALS' } },
      { text: '&lt;', attr: { value: 'LT' } },
      { text: '&gt;=', attr: { value: 'GET' } },
      { text: '&lt;=', attr: { value: 'LET' } },
    ],
    handler: function() {
      var html = $(this).html() + '<input id="jxValue" class="singleTime" value="35" type="number">';
      $('.tpl-operator').remove();
      tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'tpl-operator query-item-2' })
        .insertAfter('.tpl-operators');
    }
  });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('PersistStatisticsService/' + para._service_, para, function(data) {
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
  $typeRadios.siblings('.active').removeClass('active').click();
};

/**
 * 初终日统计
 */
var startEndStatPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    season: [
      // { title: '序号', data: 'index' },
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '初日日期', data: 'startDate' },
      { title: '持续日数', data: 'persistDays', type: 'numeric' },
      { title: '常年', data: 'hisStartDate' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
      { title: '早晚', data: 'description' }
    ],
    seasons: [
      // { title: '序号', data: 'index' },
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '年份', data: 'year' },
      { title: '初日日期', data: 'startDate' },
      { title: '持续日数', data: 'persistDays', type: 'numeric' },
      { title: '常年', data: 'hisStartDate' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
      { title: '早晚', data: 'description' }
    ],
    rain: [
      { title: '序号', data: 'index' },
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '初日降水量', data: 'firstValue', type: 'numeric', format: '0.0' },
      { title: '初日日期', data: 'firstDate' },
      { title: '初日距平', data: 'firstAnomaly', type: 'numeric', format: '0.0' },
      { title: '常年初日日期', data: 'normalFirstDate' },
      { title: '终日降水量', data: 'lastValue', type: 'numeric', format: '0.0' },
      { title: '终日日期', data: 'lastDate' },
      { title: '终日距平', data: 'lastAnomaly', type: 'numeric', format: '0.0' },
      { title: '常年终日日期', data: 'normalLastDate' },
      { title: '极端最早初日', data: 'extEarlyFirstDay' },
      { title: '极端最晚初日', data: 'extLateFirstDay' },
      { title: '极端最早结束', data: 'extEarlyLastDay' },
      { title: '极端最晚结束', data: 'extLateLastDay' }
    ],
    temp: [
      { title: '序号', data: 'index' },
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '初日高温', data: 'firstValue', type: 'numeric', format: '0.0' },
      { title: '初日日期', data: 'firstDate' },
      { title: '初日距平', data: 'firstAnomaly', type: 'numeric', format: '0.0' },
      { title: '常年初日日期', data: 'normalFirstDate' },
      { title: '终日高温', data: 'lastValue', type: 'numeric', format: '0.0' },
      { title: '终日日期', data: 'lastDate' },
      { title: '终日距平', data: 'lastAnomaly', type: 'numeric', format: '0.0' },
      { title: '常年终日日期', data: 'normalLastDate' },
      { title: '极端最早初日', data: 'extEarlyFirstDay' },
      { title: '极端最晚初日', data: 'extLateFirstDay' },
      { title: '极端最早结束', data: 'extEarlyLastDay' },
      { title: '极端最晚结束', data: 'extLateLastDay' }
    ]
  }
  var getCondition = function() {
    var startTime = $datepicker.customDatePicker('getStartTime'),
      endTime = $datepicker.customDatePicker('getEndTime');
    var para = {
      year: Number($year.find('input').val()),
      startMon: startTime.month() + 1,
      startDay: startTime.date(),
      endMon: endTime.month() + 1,
      endDay: endTime.date(),
      perennialStartYear: Number($year_p.find('.start').val()),
      perennialEndYear: Number($year_p.find('.end').val()),
      _service_: 'FirstDayService/rainTmpFirst'
    };
    switch (queryType) {
      case 'rain':
        $.extend(para, {
          type: $rainType.siblings('.active').val(),
          value: Number($('#rain-size').val()),

        });
        break;
      case 'temp':
        $.extend(para, {
          type: 'AVGTEMMAX',
          value: Number($('#temp-size').val()),
        });
        break;
      case 'season':
        $.extend(para, {
          season: $seasonRadios.siblings('.active').val(),
          _service_: 'SeasonService/getSeasonByYear'
        });
        break;
      case 'seasons':
        $.extend(para, {
          season: $seasonRadios.siblings('.active').val(),
          startYear: Number($years.find('.start').val()),
          endYear: Number($years.find('.end').val()),
          station_Id_C: $stationpanel.customStationPanel('getCodes') || '',
          _service_: 'SeasonService/getSeasonByStationAndYears'
        });
        break;
    }
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  this.toolbar(tpl.TOOLBAR[displayType]);

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    items: [{
      text: '降水',
      attr: { data: '.query-item-0', value: 'rain' },
      handler: function() {
        $dateCheck.show().find('input').trigger('change');
      }
    }, {
      text: '高温',
      attr: { data: '.query-item-1', value: 'temp' },
      handler: function() {
        $dateCheck.show().find('input').trigger('change');
      }
    }, {
      text: '季节(多站单年)',
      attr: { data: '.query-item-2', value: 'season' },
      handler: function(event) {}
    }, {
      text: '季节(单站历年)',
      attr: { data: '.query-item-3', value: 'seasons' },
      handler: function(event) {}
    }],
    handler: function(event) {
      tpl.ext.toggleCondition(this);
      queryType = $(this).val();
      // 季节 关联日期选择器
      if (/season/.test(queryType)) {
        $dateCheck.hide().find('input').trigger('change', false);
        $seasonRadios.siblings('.active').removeClass('active').click();
      } else {
        corePage.onStatistics();
      }
    }
  }, 2);

  var $rainType = tpl.Plugin.radiobtn(this.$condition, {
    title: '日雨量',
    className: 'query-item-0',
    items: [
      { text: '08-08时', attr: { value: 'PRETIME0808' } },
      { text: '20-20时', attr: { value: 'PRETIME2020' } }
    ],
    handler: function() {
      corePage.onStatistics();
    }
  }, 1);

  var $year = tpl.Plugin.customize(corePage.$condition, '<input type="number" class="custom-datepicker ext year" value=' + moment().year() + '>', {
    title: '计算年份',
    className: 'query-item-0 query-item-1 query-item-2'
  });

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {
    single: true, //单选 国家站
    display: '{areaName}({stationId})' //展示站号
  }, 'query-item-3');

  var $years = tpl.Plugin.year(this.$condition, {
    type: 'perennial',
    className: 'query-item-3',
    title: '历年',
    start: 1951
  });
  var $rainRange = tpl.Plugin.customize(corePage.$condition, [
    '日雨量&gt;=<input id="rain-size" class="singleTime compareTime" style="width: 50px" value="10" type="number"><sub>mm</sub>',
    '<i class="separator"></i>',
    '<button data-size="10" class="rain-size radiobutton-min active">中雨</button>',
    '<button data-size="25" class="rain-size radiobutton-min">大雨</button>',
    '<button data-size="50" class="rain-size radiobutton-min">暴雨</button>'
  ].join(''), { title: '条件', className: 'query-item-0' }).on('click', '.rain-size', function(event) {
    if ($(this).hasClass('active')) {
      event.stopImmediatePropagation();
      return;
    } else $(this).addClass('active').siblings().removeClass('active');

    var val = $(this).attr('data-size');
    $('#rain-size').val(val);
    corePage.onStatistics();
  });

  var $tempRange = tpl.Plugin.customize(corePage.$condition, [
    '日高温&gt;=<input id="temp-size" class="singleTime compareTime" style="width: 50px" value="35" type="number"><sub>°C</sub>',
    '<i class="separator"></i>',
    '<button data-size="35" class="temp-size radiobutton-min active">35°C</button>',
    '<button data-size="37" class="temp-size radiobutton-min">37°C</button>',
    '<button data-size="39" class="temp-size radiobutton-min">39°C</button>'
  ].join(''), { title: '条件', className: 'query-item-1' }).on('click', '.temp-size', function(event) {
    if ($(this).hasClass('active')) {
      event.stopImmediatePropagation();
      return;
    } else $(this).addClass('active').siblings().removeClass('active');

    var val = $(this).attr('data-size');
    $('#temp-size').val(val);
    corePage.onStatistics();
  });

  var $seasonRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '季节',
    className: 'query-item-2 query-item-3',
    items: [
      { text: '春', attr: { value: 'SPRING', 'data-start': '01-01', 'data-end': '06-30' } },
      { text: '夏', attr: { value: 'SUMMER', 'data-start': '04-01', 'data-end': '09-30' } },
      { text: '秋', attr: { value: 'AUTUMN', 'data-start': '07-01', 'data-end': '12-31' } },
      { text: '冬', attr: { value: 'WINTER', 'data-start': '10-01', 'data-end': '03-01' } }
    ],
    handler: function() {
      var year = $datepicker.customDatePicker('getStartTime').year(),
        season = $(this).val(),
        startStr = $(this).attr('data-start'),
        endStr = $(this).attr('data-end'),
        startDate = moment(year + '-' + startStr);
      if (season === 'WINTER') year++;
      $datepicker.customDatePicker('setTimes', startDate, moment(year + '-' + endStr));
      corePage.onStatistics();
    }
  });

  // 日期选择器
  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date', config: { locale: { format: 'MM月DD日' } } }).prepend('<i class="separator"></i>');
  // 自定义日期选择
  var $dateCheck = $('<span class="tpl-check"><input type="checkbox" id="datepicker-check">自定义</span>').on('change', 'input', function(event, para) {
    var start, end,
      now = moment(),
      checked = para === undefined ? $(this).is(':checked') : para;
    if (checked) {
      var key = now.date() < 3 ? 'M' : 'd';
      end = now.subtract(1, key).endOf(key).startOf('hour');
      start = end.clone().startOf('month');
      $('.custom-datepicker-ctrl').show();
    } else {
      end = now.endOf('year');
      start = end.clone().startOf('year');
      $('.custom-datepicker-ctrl').hide();
    }
    $datepicker.customDatePicker('setTimes', start, end);
  }).prependTo($datepicker);

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-0 query-item-1' });

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
  $typeRadios.siblings('.active').removeClass('active').click();

};

/**
 * 历年同期
 */
var sameTimeStatPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';

  var getCondition = function() {
    var startTime = $datepicker.customDatePicker('getStartTime'),
      endTime = $datepicker.customDatePicker('getEndTime');
    var para = {
      startDay: startTime.date(),
      startMon: startTime.month() + 1,
      endDay: endTime.date(),
      endMon: endTime.month() + 1,
      currentYear: startTime.year(),
      startYear: Number($year_h.find('.start').val()),
      endYear: Number($year_h.find('.end').val()),
      FilterType: $operators.siblings('.active').val() || '',
      min: $('#jxMinValue').val(),
      max: $('#jxMaxValue').val(),
      contrast: $('#jxValue').val(),
      EleType: queryType,
      StatisticsType: $results.siblings('.active').val(),
      standardStartYear: Number($year_p.find('.start').val()),
      standardEndYear: Number($year_p.find('.end').val()),
      station_Id_C: $stationinput.customStationInput('getCode'),
      _service_: $typeRadios.siblings('.active').data('service') || 'SameCalendarService/same'
    };
    if ($('.same-index-check').is(':checked')) para.MissingRatio = 1 / parseFloat($('.same-index-input').val())
    if (!para.min) delete para.min;
    if (!para.max) delete para.max;
    if (!para.contrast) delete para.contrast;
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    var cols = [
      { title: '年份', data: 'year' },
      { title: '要素值', data: 'value', type: 'numeric', format: '0.0' },
      { title: '多年均值', data: 'avgValue', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' }
    ];
    corePage.Grid = corePage.grid(cols, data);
  };
  var initChart = function(data) {
    var $item = $typeRadios.siblings('.active'),
      item_name = $item.html(),
      item_unit = $item.attr('data-unit'),
      times = [],
      datas = [],
      avgValue = data[0].avgValue;
    data.forEach(function(item, i) {
      times.push(item.year);
      datas.push(item.value);
    });
    corePage.Chart = corePage.chart({ categories: times }, { plotLines: ChartControl.stylePlotLines([avgValue, '常年均值']), title: { text: item_name + '(' + item_unit + ')' } }, [{ name: item_name, data: datas }], {
      title: { text: '历年同期' + item_name + '序列图' },
      subtitle: { text: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) + '至' + $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date) },
    });
  };
  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'chart':
        initChart(data);
        break;
    }
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
    title: '站点'
  }).find('.tpl-station').on('ready.station', function() {
    if (!G.User.isCity()) return;
    $(this).find('input').attr({
      placeholder: '国家站',
      'data-code': '5%'
    });
  }).customStationInput({
    data: corePage.StationData
  });
  if (G.User.isCity()) {
    $stationinput.append('<i class="separator"></i><button type="button" value="5%" class="tpl-station-all radiobutton-min tpl-radiobtn-item active">国家站</button>')
      .append('<button type="button" value="*" class="tpl-station-all radiobutton-min tpl-radiobtn-item">全部站</button>')
      .find('.tpl-station-all').click(function() {
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
  }

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
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
      { text: '气温年较差', data: { service: 'TmpGapService/getTmpGapByYears/' }, attr: { 'data-unit': '°C', value: 'TEMGAP' } },
    ],
    handler: function(event) {
      queryType = $(this).val();
      // 默认运算符
      $results.siblings('.active').removeClass('active');
      if (/PRETIME/.test(queryType)) {
        $results.siblings('*[value="SUM"]').addClass('active');
      } else {
        $results.siblings('*[value="AVG"]').addClass('active');
      }
      corePage.onStatistics();
      event.preventDefault();
    }
  });

  var $results = tpl.Plugin.radiobtn(this.$condition, {
    title: '期间',
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
    className: 'same-operators',
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
      tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'same-operator' })
        .insertAfter('.same-operators');
    }
  }, 5);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', title: '统计年份' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', title: '气候标准值' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '指标',
    items: [{
      title: false,
      content: [
        '<span class="tpl-check"><input type="checkbox" class="same-index-check">缺测日数&lt;总日数的1&nbsp;/&nbsp;</span>',
        '<input class="singleTime sm same-index-input" value="10" min="1" type="number">'
      ].join('')
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
  $operators.siblings('.active').removeClass('active').click();
  $typeRadios.siblings('.active').removeClass('active').click();

};

/**
 * 高温日数
 */
var highTempPage = function() {
  var queryData;
  var queryType = 'highTmpTotalList';

  var initGrid = function(para) {
    var cols = [
        { title: '站号', data: 'station_Id_C' },
        { title: '站名', data: 'station_Name' },
        { title: '≥35.0℃', data: 'gt35Days', type: 'numeric' },
        { title: '35.0~36.9℃', data: 'gt35lt37Days', type: 'numeric' },
        { title: '≥37.0℃', data: 'gt37Days', type: 'numeric' },
        { title: '37.0~39.9℃', data: 'gt37lt39Days', type: 'numeric' },
        { title: '≥40.0℃', data: 'gt40Days', type: 'numeric' }
      ],
      data = JSON.parse(JSON.stringify(para[queryType])); //clone

    if (queryType === 'highTmpSequenceList') {
      cols = [
        { title: '站号', data: 'station_Id_C' },
        { title: '站名', data: 'station_Name' }
      ];
      try {
        var values = data[0].valueMap;
        for (var key in values) {
          cols.push({ title: key.slice(2), data: 'valueMap.' + key });
        }
        anaylze(data);
      } catch (e) {}
    }
    corePage.Grid = corePage.grid(cols, data);
  };

  var anaylze = function(data) {
    var sp35 = $('input[name="index-display-35"]:checked').val() == 0 ? false : $('.index-display-sympol[name="index-display-35"]').val();
    var sp37 = $('input[name="index-display-37"]:checked').val() == 0 ? false : $('.index-display-sympol[name="index-display-37"]').val();
    var sp39 = $('input[name="index-display-39"]:checked').val() == 0 ? false : $('.index-display-sympol[name="index-display-39"]').val();
    var sp40 = $('input[name="index-display-40"]:checked').val() == 0 ? false : $('.index-display-sympol[name="index-display-40"]').val();
    var sympol = function(value) {
      if (value < 35 && sp35) value = sp35;
      else if (value >= 35 && value < 37 && sp37) value = sp37;
      else if (value >= 37 && value < 40 && sp39) value = sp39;
      else if (value >= 40 && sp40) value = sp40;
      return value;
    }
    for (var i = data.length; i--;) {
      for (var key in data[i].valueMap) {
        data[i].valueMap[key] = sympol(data[i].valueMap[key]);
      }
    }
  };

  this.page();

  this.toolbar(tpl.TOOLBAR.grid);

  tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '高温日数', attr: { value: 'highTmpTotalList' } },
      { text: '高温日期', attr: { value: 'highTmpSequenceList' } }
    ],
    handler: function(event) {
      queryType = $(this).val();
      if (!corePage.qCondition.change() && queryData)
        initGrid(queryData);
      else corePage.onStatistics();
    }
  });

  //时段
  var $datepicker = tpl.Plugin.yearmonth(this.$condition);

  tpl.Plugin.index(this.$condition, {
    title: '显示设置',
    items: [{
      title: '&lt;35℃',
      content: [
        '<input type="radio" name="index-display-35" value="0">高温值',
        '<i class="separator"></i>',
        '<input type="radio" name="index-display-35" value="1" checked>符号',
        '<input type="text" name="index-display-35" class="index-display-sympol singleTime sm" value="―">'
      ].join('')
    }, {
      title: '35~37℃',
      content: [
        '<input type="radio" name="index-display-37" value="0">高温值',
        '<i class="separator"></i>',
        '<input type="radio" name="index-display-37" value="1" checked>符号',
        '<input type="text" name="index-display-37" class="index-display-sympol singleTime sm" value="*">'
      ].join('')
    }, {
      title: '37~40℃',
      content: [
        '<input type="radio" name="index-display-39" value="0">高温值',
        '<i class="separator"></i>',
        '<input type="radio" name="index-display-39" value="1" checked>符号',
        '<input type="text" name="index-display-39" class="index-display-sympol singleTime sm" value="Ⅰ">'
      ].join('')
    }, {
      title: '≥40℃',
      content: [
        '<input type="radio" name="index-display-40" value="0">高温值',
        '<i class="separator"></i>',
        '<input type="radio" name="index-display-40" value="1" checked>符号',
        '<input type="text" name="index-display-40" class="index-display-sympol singleTime sm" value="Ⅱ">'
      ].join('')
    }],
  });
  this.$condition.find('input[name^="index-display-"]').change(function(event) {
    event.preventDefault();
    if (queryData) initGrid(queryData);
    else corePage.onStatistics();
  });

  this.condition();

  this.onStatistics(function(event) {
    event.preventDefault();
    var year = Number($datepicker.find('.year').val()),
      month = Number($datepicker.find('.month').val()),
      date = moment().year(year).month(month),
      para = {
        startTimeStr: date.clone().startOf('month').format(tpl.FORMATTER.date),
        endTimeStr: (year === moment().year() && month === moment().month()) ? date.format(tpl.FORMATTER.date) : date.endOf('month').format(tpl.FORMATTER.date),
      };
    tpl.ext.query('HighTmpService/highTmpByTimes', para, function(data) {
      if (tpl.ext.isExpectedType(data)) {
        corePage.qCondition.change(false);
        queryData = data;
        initGrid(data);
      } else console.log(data);

    });
  }).click();
};

/**
 * 积温计算
 */
var accTempPage = function() {
  var queryData;
  var queryType = 'activeAccumulatedTempList';
  var displayType = 'grid';

  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      perennialStartYear: Number($year.find('.start').val()),
      perennialEndYear: Number($year.find('.end').val()),
      minTmp: Number($('.index-tmp-min').val())
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    var cols = [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '积温', data: 'accumulatedTemp', type: 'numeric', format: '0.0' },
      { title: '多年均值', data: 'yearsAvg', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
    ];
    corePage.Grid = corePage.grid(cols, data);
  };
  var initMap = function(data) {
    corePage.Map = corePage.map({
      title: '积温分布图',
      subtitle: corePage.qCondition.get().startTimeStr + '至' + corePage.qCondition.get().endTimeStr,
      dataSchema: { value: 'accumulatedTemp' },
      meteoType: 'TEMP',
      style: { type: 'auto', option: { colorType: 'w' } }
    }, data);
  };
  var initSurfer = function(data) {
    corePage.Surfer = corePage.surfer({
      surfer: { fillColor: 'TEMP' },
      dataSchema: { value: 'accumulatedTemp' }
    }, data);
  };
  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = data[queryType];
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap(_data);
    } else if (displayType === 'surfer') {
      initSurfer(_data);
    }
  };

  this.page();

  tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '活动积温', attr: { value: 'activeAccumulatedTempList' } },
      { text: '有效积温', attr: { value: 'validAccumulatedTempList' } }
    ],
    handler: function() {
      queryType = $(this).val();
      if (!corePage.qCondition.change() && queryData)
        display(queryData);
      else corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year = tpl.Plugin.year(this.$condition, { type: 'perennial' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map', 'surfer']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  var $index = tpl.Plugin.index(this.$condition, {
    title: '积温指标',
    items: [{
      title: '最低温度',
      content: '<input type="number" name="index-tmp-min" class="index-tmp-min singleTime sm" value="10"><sub>℃</sub>'
    }]
  });

  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('AccumulatedTempService/accumulatedTempByTimes', getCondition(), function(data) {
      if (tpl.ext.isExpectedType(data)) {
        queryData = data;
        display(data);
      } else console.log(data);
    });
  }).click();
};

/**
 * 连续变化
 */
var conChangePage = function() {
  var displayType = 'grid';
  var queryData = null;
  var getCondition = function() {
    var station_all_val = $('.tpl-station-all.active').val();
    var stationCode = $stationinput.customStationInput('getCode');
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      station_Id_C: stationCode || station_all_val || '',
      statisticsType: $statiRadios.siblings('.active').val(),
      climTimeType: $timeRadios.siblings('.active').val(),
      standardStartYear: Number($year.find('.start').val()),
      standardEndYear: Number($year.find('.end').val()),
      eleTypes: $typeRadios.siblings('.active').val()
    };
    para.allStation = stationCode === '*' || stationCode === '5%' || !stationCode;
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    var cols = [
      { title: '日期', data: 'datetime' },
      { title: '值', data: 'value', type: 'numeric', format: '0.0' },
      { title: '多年均值', data: 'yearsValue', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' },
    ];

    function formatter() {
      var args = [].slice.call(arguments);
      var value = args[5];
      if ($.isNumeric(value)) {
        args[5] = Number(value).toFixed(2);
      }
      Handsontable.renderers.TextRenderer.apply(this, args);
    }
    if (corePage.qCondition.get().allStation) {
      cols = cols.concat([
        { title: '最大值', data: 'maxValue', renderer: formatter },
        { title: '最大值站', data: 'maxStation_Name' },
        { title: '最小值', data: 'minValue', renderer: formatter },
        { title: '最小值站', data: 'minStation_Name' }
      ]);
    }
    corePage.Grid = corePage.grid(cols, data);
  };

  function initChart(data) {
    var results = [],
      i;
    if (!corePage.qCondition.get().allStation) {
      return;
    }

    for (i = 0; i < data.length; i++) {
      var item = data[i];
      var date = moment(item.datetime, 'YYYY年MM月DD日');
      var serie = {
        x: date.valueOf(),
        open: item.yearsValue,
        high: item.maxValue,
        low: item.minValue,
        close: item.value
      };
      results.push(serie);
    }
    // 要素
    var _$active_ = $typeRadios.siblings('.active'),
      text = _$active_.text(),
      unit = _$active_.attr('data-unit');

    // 生成K线图
    var $chart = corePage.$panel.empty();
    var chartOpt = $.extend(true, {}, {
      title: {
        text: '连续变化'
      },
      tooltip: {
        formatter: function() {
          var pt = this.points[0].point;
          return '<b>' + this.points[0].series.name + '</b><br/>' +
            moment(pt.x).format('YYYY年MM月DD日') + '<br/>' +
            '实况值：<b>' + pt.close + '</b>' + unit + '<br/>' +
            '平均值：<b>' + pt.open + '</b>' + unit + '<br/>' +
            '最大值：<b>' + pt.high + '</b>' + unit + '<br/>' +
            '最小值：<b>' + pt.low + '</b>' + unit + '<br/>';
        }
      },
      rangeSelector: {
        buttons: [{
          type: 'day',
          count: 1,
          text: '日'
        }, {
          type: 'week',
          count: 1,
          text: '周'
        }, {
          type: 'month',
          count: 1,
          text: '月'
        }, {
          type: 'month',
          count: 3,
          text: '季度'
        }, {
          type: 'month',
          count: 6,
          text: '半年'
        }, {
          type: 'year',
          count: 1,
          text: '年'
        }, {
          type: 'all',
          count: 1,
          text: '所有'
        }],
        selected: 2,
        inputEnabled: true
      },
      yAxis: {
        title: { text: text + '(' + unit + ')' },
        opposite: false
      },
      series: [{
        name: text,
        // color: 'blue',
        // lineColor: 'blue',
        upColor: 'red',
        upLineColor: 'red',
        type: 'candlestick',
        data: results,
        tooltip: {
          valueDecimals: 2
        }
      }]
    }, ChartControl.defaults);

    $chart.highcharts('StockChart', chartOpt);
  }

  function display(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    if (!G.isPretty(data)) {
      corePage.$panel.empty();
      corePage.Alert.show('该时段（条件）没有统计结果...');
    }
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'chart':
        initChart(data);
        break;
      default:
        return;
    }
  }

  this.page();
  this.toolbar(tpl.TOOLBAR.grid);

  var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
    title: '站点'
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
      $input.val('');
      if ($this.hasClass('active')) {
        $this.removeClass('active');
        $input.attr({
          placeholder: '请输入站点',
          'data-code': ''
        });
      } else {
        $this.addClass('active').siblings('.tpl-station-all').removeClass('active');
        $input.attr({
          placeholder: text,
          'data-code': value
        });
      }
    });


  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    className: 'EleType',
    items: [
      { text: '平均气温', attr: { 'data-unit': '℃', value: 'AVGTEM' }, handler: function() { $statiRadios.eq(2).click(); } },
      { text: '最高气温', attr: { 'data-unit': '℃', value: 'AVGTEMMAX' }, handler: function() { $statiRadios.eq(0).click(); } },
      { text: '最低气温', attr: { 'data-unit': '℃', value: 'AVGTEMMIN' }, handler: function() { $statiRadios.eq(1).click(); } },
      { text: '08-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME0808' }, handler: function() { $statiRadios.eq(3).click(); } },
      { text: '08-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME0820' }, handler: function() { $statiRadios.eq(3).click(); } },
      { text: '20-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME2008' }, handler: function() { $statiRadios.eq(3).click(); } },
      { text: '20-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME2020' }, handler: function() { $statiRadios.eq(3).click(); } },
      { text: '相对湿度', attr: { 'data-unit': '%', value: 'RHUAVG' }, handler: function() { $statiRadios.eq(2).click(); } },
      { text: '平均风速', attr: { 'data-unit': 'm/s', value: 'WINS2MIAVG' }, handler: function() { $statiRadios.eq(2).click(); } },
      { text: '平均气压', attr: { 'data-unit': 'hPa', value: 'PRSAVG' }, handler: function() { $statiRadios.eq(2).click(); } },
      { text: '日照时数', attr: { 'data-unit': 'h', value: 'SSH' }, handler: function() { $statiRadios.eq(3).click(); } },
      { text: '最小能见度', attr: { 'data-unit': 'm', value: 'VISMIN' }, handler: function() { $statiRadios.eq(1).click(); } }
    ]
  });

  var $statiRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '运算',
    className: 'statisticsType',
    items: [
      { text: '最大', attr: { value: 'MAX' } },
      { text: '最小', attr: { value: 'MIN' } },
      { text: '平均', attr: { value: 'AVG' } },
      { text: '求和', attr: { value: 'SUM' } }
    ],
    handler: function(event) {
      corePage.onStatistics();
    }
  }, 2);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $timeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '运算',
    className: 'climTimeType',
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
  });

  var $year = tpl.Plugin.year(this.$condition, { type: 'perennial' });
  if (G.User.isCity()) {
    tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
      displayType = $(this).val();
      if (!corePage.qCondition.change() && queryData)
        display(queryData);
      else corePage.onStatistics();
    });
  }

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('SequenceChangService/sequenceChangByTimes', getCondition(), function(data) {
      if (tpl.ext.isExpectedType(data)) {
        queryData = data;
        display(data);
      } else {
        console.log(data);
        queryData = null;
        display([]);
      }
    });
  }).click();
};

function windPage() {
  var displayType = 'grid';
  var queryData = null;
  var cols = [
    { data: 'station_Id_C', title: '站号' },
    { data: 'station_Name', title: '站名' },
    { data: 'datetime', title: '日期' },
    { data: 'hour', title: '时次' },
    { data: 'winDAvg1', title: '02时风向' },
    { data: 'winDCode1', title: '02时风向代码' },
    { data: 'winSAvg1', title: '02时风速' },
    { data: 'winDAvg2', title: '08时风向' },
    { data: 'winDCode2', title: '08时风向代码' },
    { data: 'winSAvg2', title: '08时风速' },
    { data: 'winDAvg3', title: '14时风向' },
    { data: 'winDCode3', title: '14时风向代码' },
    { data: 'winSAvg3', title: '14时风速' },
    { data: 'winDAvg4', title: '20时风向' },
    { data: 'winDCode4', title: '20时风向代码' },
    { data: 'winSAvg4', title: '20时风速' }
  ];

  function getCondition() {
    return {
      startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      stationType: $stationRadios.siblings('.active').attr('data'),
    };
  }

  function initGrid(data) {
    corePage.Grid = corePage.grid(cols, data);
  }

  function display(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    if (!G.isPretty(data)) {
      corePage.$panel.empty();
      corePage.Alert.show('该时段（条件）没有统计结果...');
    }
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      default:
        return;
    }
  }

  this.page();

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  // var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
  //  displayType = $(this).val();
  //  if (!corePage.qCondition.change() && queryData)
  //    display(queryData);
  //  else corePage.onStatistics();
  // });

  this.condition();
  this.onStatistics(function(event) {
      event.preventDefault();
      tpl.ext.query('WinAvgCloCovHourService/queryWinAvg2MinByTimeRange', getCondition(), function(data) {
        if (tpl.ext.isExpectedType(data)) {
          queryData = data;
          display(data);
        } else {
          console.log(data);
          queryData = null;
          display([]);
        }
      });
    })
    .click();
}

function cloudPage() {
  var displayType = 'grid';
  var queryData = null;
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '日期', data: 'datetime' },
    { title: '02时总云量', data: 'cloCov1' },
    { title: '02时低云量', data: 'cloCovLow1' },
    { title: '08时总云量', data: 'cloCov2' },
    { title: '08时低云量', data: 'cloCovLow2' },
    { title: '14时总云量', data: 'cloCov3' },
    { title: '14时低云量', data: 'cloCovLow3' },
    { title: '20时总云量', data: 'cloCov4' },
    { title: '20时低云量', data: 'cloCovLow4' },
    { title: '平均总云量', data: 'avgCloCov' },
    { title: '平均低云量', data: 'avgCloCovLow' }
  ];

  function getCondition() {
    return {
      startTime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTime: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      stationType: $stationRadios.siblings('.active').attr('data'),
    };
  }

  function initGrid(data) {
    corePage.Grid = corePage.grid(cols, data);
  }

  function display(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    if (!G.isPretty(data)) {
      corePage.$panel.empty();
      corePage.Alert.show('该时段（条件）没有统计结果...');
    }
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      default:
        return;
    }
  }

  this.page();

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });

  // var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
  //  displayType = $(this).val();
  //  if (!corePage.qCondition.change() && queryData)
  //    display(queryData);
  //  else corePage.onStatistics();
  // });

  this.condition();
  this.onStatistics(function(event) {
      event.preventDefault();
      tpl.ext.query('WinAvgCloCovHourService/queryCloCovByTimeRange', getCondition(), function(data) {
        if (tpl.ext.isExpectedType(data)) {
          queryData = data;
          display(data);
        } else {
          console.log(data);
          queryData = null;
          display([]);
        }
      });
    })
    .click();
}



/**
 * 测试服务端插值
 */
function testMap4Server(data) {
  var container = corePage.$panel.empty();
  if (!G.isPretty(data)) return;
  var tempStyles = [
    [14, 15.5, {
      strokeColor: "#ff0000",
      strokeWidth: 0.5,
      stroke: false,
      fill: true,
      fillColor: "#e5fffb",
      fillOpacity: ".75"
    }],
    [15.5, 17, {
      strokeColor: "#ff0000",
      strokeWidth: 0.5,
      stroke: false,
      fill: true,
      fillColor: "#c1e1b3",
      fillOpacity: ".75"
    }],
    [17, 18.5, {
      strokeColor: "#ff0000",
      strokeWidth: 0.5,
      stroke: false,
      fill: true,
      fillColor: "#a3cd56",
      fillOpacity: ".75"
    }],
    [18.5, 20, {
      strokeColor: "#ff0000",
      strokeWidth: 0.5,
      stroke: false,
      fill: true,
      fillColor: "#44af42",
      fillOpacity: ".75"
    }],
    [20, 99.9, {
      strokeColor: "#ff0000",
      strokeWidth: 0.5,
      stroke: false,
      fill: true,
      fillColor: "#009932",
      fillOpacity: ".75"
    }]
  ];
  var MC = new MapControl(container, {
    title: '分布图',
    dataSchema: { value: 'tEM_Avg' },
    style: { type: 'fill', styles: null }
  });
  MC.init();
  MC.loadTextFeatures(data, G.User.isCity()); //标注图层

  console.log(data);
  MC.getGeoFromJson(data, function(features) {
    console.log(features);
    MC.interpolateByServer(features, tempStyles).done(function(features) {
      if (!MC.layerISO) {
        MC.layerISO = new WeatherMap.Layer.Vector('layerIsoSurfaceTextData', { renderers: ['Canvas'] });
        MC.addLayer(MC.layerISO);
      }
      MC.layerISO.removeAllFeatures();
      MC.layerISO.addFeatures(features);
    });
  });
}

/**
 * 重现期
 * @author rexer
 * @date   2017-06-23
 * @param  {[type]}   PHI [description]
 * @return {[type]}       [description]
 */
function cxqPage(PHI) {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { 'title': '500年', 'data': 'r500' },
    { 'title': '300年', 'data': 'r300' },
    { 'title': '200年', 'data': 'r200' },
    { 'title': '100年', 'data': 'r100' },
    { 'title': '50年', 'data': 'r50' },
    { 'title': '20年', 'data': 'r20' },
    { 'title': '10年', 'data': 'r10' },
    { 'title': '5年', 'data': 'r5' }
  ];
  var getCondition = function() {
    var startTime = $datepicker.customDatePicker('getStartTime'),
      endTime = $datepicker.customDatePicker('getEndTime');
    var para = {
      startDay: startTime.date(),
      startMon: startTime.month() + 1,
      endDay: endTime.date(),
      endMon: endTime.month() + 1,
      currentYear: startTime.year(),
      startYear: Number($year_h.find('.start').val()),
      endYear: Number($year_h.find('.end').val()),
      FilterType: $operators.siblings('.active').val() || '',
      min: $('#jxMinValue').val(),
      max: $('#jxMaxValue').val(),
      contrast: $('#jxValue').val(),
      EleType: queryType,
      StatisticsType: $results.siblings('.active').val(),
      standardStartYear: Number($year_p.find('.start').val()),
      standardEndYear: Number($year_p.find('.end').val()),
      station_Id_C: $stationpanel.customStationPanel('getCodes')
    };
    if ($('.same-index-check').is(':checked')) para.MissingRatio = 1 / parseFloat($('.same-index-input').val())
    if (!para.min) delete para.min;
    if (!para.max) delete para.max;
    if (!para.contrast) delete para.contrast;
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid([
      { 'title': '站号', 'data': 'station_Id_C' },
      { 'title': '站名', 'data': 'station_Name' }
    ].concat(cols), data);
  };

  function initMap(data) {
    var select_type = $('#map-type-r');
    var selected_name = select_type.find('option:checked').text();
    var selected_value = select_type.val();
    corePage.Map = corePage.map({
      title: '重现期(' + selected_name + ')等值面图',
      style: { type: 'auto', option: { colorType: 'c' } },
      dataSchema: { value: selected_value }
    }, data);
  }
  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'map':
        // 按钮组
        var options = cols.map(function(i) {
          return '<option value="' + i.data + '">' + i.title + '</option>'
        })
        $('<div class="tpl-toolbar-group"></div>')
          .append('<span class="tpl-toolbar-title">要素</span>')
          .append(
            '<select id="map-type-r" class="tpl-toolbar-item">' +
            options.join('') +
            '</select>'
          ).prependTo(corePage.$toolbar)
          .on('change', 'select', function(event) {
            event.preventDefault();
            initMap(queryData);
          });
        initMap(data);
        break;
    }
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition)
    .on('close.station', function() {
      corePage.onStatistics()
    })

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '要素',
    items: [
      { text: '08-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME0808' } },
      { text: '08-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME0820' } },
      { text: '20-08降水', attr: { 'data-unit': 'mm', value: 'PRETIME2008' } },
      { text: '20-20降水', attr: { 'data-unit': 'mm', value: 'PRETIME2020' } }
    ],
    handler: function(event) {
      queryType = $(this).val();
      // 默认运算符
      $results.siblings('.active').removeClass('active');
      if (/PRETIME/.test(queryType)) {
        $results.siblings('*[value="SUM"]').addClass('active');
      } else {
        $results.siblings('*[value="AVG"]').addClass('active');
      }
      corePage.onStatistics();
      event.preventDefault();
    }
  });

  var $results = tpl.Plugin.radiobtn(this.$condition, {
    title: '期间',
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
    className: 'same-operators',
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
      tpl.Plugin.customize(corePage.$condition, html, { title: false, className: 'same-operator' })
        .insertAfter('.same-operators');
    }
  }, 5);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', title: '统计年份' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', title: '气候标准值' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '指标',
    items: [{
      title: false,
      content: [
        '<span class="tpl-check"><input type="checkbox" class="same-index-check">缺测日数&lt;总日数的1&nbsp;/&nbsp;</span>',
        '<input class="singleTime sm same-index-input" value="10" min="1" type="number">'
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('SameCalendarService/sameBatch', para, function(data) {
      if (tpl.ext.isExpectedType(data)) {
        var results = [];
        for (var key in data) {
          var item = data[key];
          var xi = [];
          var station_Id_C = item[0].station_Id_C;
          var station_Name = item[0].station_Name;
          for (var i in item) {
            xi.push(item[i]['value']);
          }
          var result = P3(PHI, xi);
          result.station_Id_C = station_Id_C
          result.station_Name = station_Name
          results.push(result);
        }
        queryData = results;
        display(queryData);
      } else {
        console.log(data);
        queryData = null;
        display([]);
      }
    });
  });
  //默认
  $operators.siblings('.active').removeClass('active').click();
  $typeRadios.siblings('.active').removeClass('active').click();
}

/**
 * P3重现期
 * @author rexer
 * @date   2017-06-23
 * @param  {[type]}   PHI [description]
 * @param  {[type]}   xi  [description]
 */
function P3(PHI, xi) {
  var n = xi.length;

  //计算平均值m
  var sum = 0;
  for (var key in xi)
    sum += xi[key];
  var m = sum / n;
  m = Math.round(m * 10.0) / 10.0; //仅保留1位小数

  //计算均方差s
  var sum1 = 0;
  for (var key in xi)
    sum1 += Math.pow((xi[key] - m), 2);
  var s = Math.sqrt(sum1 / n);

  //计算偏态系数cv
  var cv = s / m;
  cv = Math.round(cv * 10.0) / 10.0; //仅保留1位小数

  //计算变差系数cs
  var sum2 = 0;
  for (var key in xi)
    sum2 += Math.pow((xi[key] - m), 3);
  var cs = (sum2 / n) / (Math.pow(sum1 / n, 3 / 2));
  cs = Math.round(cs * 10.0) / 10.0; //仅保留1位小数
  if (cs <= 0.0) //调整是否合理，有待验证
    cs = 0.0;
  else if (cs > 1.9)
    cs = 1.9;

  //计算各重现期雨量
  var pa = { r5: "20.0", r10: "10.0", r20: "5.0", r50: "2.0", r100: "1.0", r200: "0.50", r300: "0.33", r500: "0.20" }; //概率单位为%
  var result = {};
  for (var a in pa) {
    var p = pa[a];
    var phi = PHI[p][cs.toFixed(1)]; //查表得
    var x = m * (phi * cv + 1);
    x = Math.round(x);
    result[a] = x;
  }
  return result;
}
