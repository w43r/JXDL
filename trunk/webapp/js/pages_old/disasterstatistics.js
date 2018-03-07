/**
 * 灾害统计分析
 * @author rexer
 * @date   2016-06-12
 */

var corePage;
var run = function() {
  corePage = new tpl('灾害统计分析').ready(function() {
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');
    // corePage.plugins([
    //     new CommonConfig(),
    //     new CommonData(),
    //     new CommonTool(),
    //     new StationInfoQuery(),
    //     new FeatureUtilityClass()
    // ]);

    tpl.ext.loadStation(function(data) {
      corePage.StationData = data;
      corePage.menu([
        { text: '暴雨', value: 'm2', style: { minWidth: '93px' }, handler: stormPage },
        { text: '干旱', value: 'm3', style: { minWidth: '93px' }, handler: mciPage },
        { text: '地方干旱', value: 'm14', style: { minWidth: '93px' }, handler: mciLocalPage },
        { text: '高温', value: 'm4', style: { minWidth: '93px' }, handler: highTempPage },
        { text: '连阴雨', value: 'm1', style: { minWidth: '93px' }, handler: continueousRainPage },
        { text: '低温', value: 'm5', style: { minWidth: '93px' }, handler: lowTempPage },
        { text: '强降温', value: 'm6', style: { minWidth: '93px' }, handler: strongCoolingPage },
        { text: '大风', value: 'm7', style: { minWidth: '93px' }, handler: maxWindPage },
        { text: '雷暴', value: 'm8', style: { minWidth: '93px' }, handler: thunderPage },
        { text: '冰雹', value: 'm9', style: { minWidth: '93px' }, handler: hailPage },
        { text: '积雪', value: 'm10', style: { minWidth: '93px' }, handler: snowPage },
        { text: '霜冻', value: 'm11', style: { minWidth: '93px' }, handler: frostPage },
        { text: '雾', value: 'm12', style: { minWidth: '93px' }, handler: fogPage },
        { text: '天气现象', value: 'm13', style: { minWidth: '93px' }, handler: wepPage }
      ]);
    });
  });
};

function getDisasterStyles(colors) {
  return [
    [0, 3, {
      title: '3次及以下',
      stroke: false,
      fill: true,
      fillColor: colors[0],
      fillOpacity: '0.75'
    }],
    [4, 5, {
      title: '4-5次',
      stroke: false,
      fill: true,
      fillColor: colors[1],
      fillOpacity: '0.75'
    }],
    [6, 7, {
      title: '6-7次',
      stroke: false,
      fill: true,
      fillColor: colors[2],
      fillOpacity: '0.75'
    }],
    [8, 9, {
      title: '8-9次',
      stroke: false,
      fill: true,
      fillColor: colors[3],
      fillOpacity: '0.75'
    }],
    [10, Infinity, {
      title: '10次及以上',
      stroke: false,
      fill: true,
      fillColor: colors[4],
      fillOpacity: '0.75'
    }]
  ];
}

function initMap2FillRegion(data, colors, option) {
  corePage.$panel.empty();
  if (!G.User.isCity()) {
    corePage.$toolbar.empty();
    corePage.Alert.show('对不起，区县用户无法查看...');
    return;
  }
  if (!G.isPretty(data)) return;
  // if (colors.length !== 5) return;
  var INIT_STYLE = getDisasterStyles(colors);
  var defaultStyle = {
    stroke: false,
    fill: true,
    fillColor: colors[0],
    fillOpacity: '0.75'
  }


  function render(value) {
    var cnt = parseInt(value);
    if (isNaN(cnt)) return defaultStyle;
    for (var i = INIT_STYLE.length; i--;) {
      var style = INIT_STYLE[i];
      if (value <= style[1] && value >= style[0])
        return style[2];
    }
    return defaultStyle;
  }

  // 初始化
  var MC = corePage.map(option, data, false);

  // 样式对象
  var style = {
    type: 'fill',
    styles: INIT_STYLE
  }
  // 数值范围
  var dataRange = [];
  var key = MC.option.dataSchema.value;
  data.forEach(function(item) {
    var value = item[key];
    dataRange.push(value);
  });

  // 单值填色
  MC.fillRegionColor(data, render, ['stationcode'], defaultStyle);
  // 加载图例
  MC.LegendManager.load({
    type: 'fill',
    styles: INIT_STYLE
  }, null);

  // 样式编辑器
  var styleEditor = new StyleEditor(style, function(style) {
    INIT_STYLE = style.styles;
    MC.fillRegionColor(data, render, ['stationcode'], defaultStyle);
    MC.LegendManager.update(style);
  }, {
    dataRange: dataRange,
    extraStyles: MC.option.extraStyles
  });
  // 加载图例
  MC.LegendManager.load(style, styleEditor.open.bind(styleEditor));
  MC.StyleEditor = styleEditor;

  corePage.Map = MC;
}

/*连阴雨*/
var continueousRainPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    contrastList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现次数', data: 'cnt', type: 'numeric' },
      { title: '最重程度', data: 'mostLevel' },
      { title: '最重程度开始期', data: 'startTime' },
      { title: '最重程度结束期', data: 'endTime' },
      { title: '最重程度持续天数', data: 'persist', type: 'numeric' }
    ],
    sequenceList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '年份', data: 'year' },
      { title: '开始期', data: 'startDatetime' },
      { title: '结束期', data: 'endDatetime' },
      { title: '持续天数', data: 'persistDays', type: 'numeric' },
      { title: '无照日数', data: 'noSunDays', type: 'numeric' },
      { title: '有雨日数', data: 'preDays', type: 'numeric' },
      { title: '程度', data: 'level' },
      { title: '降水量', data: 'preValue', type: 'numeric', format: '0.0' },
      { title: '最大日雨量', data: 'maxDayPreValue', type: 'numeric', format: '0.0' }
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '出现次数', data: 'cnt', type: 'numeric' },
      { title: '常年出现次数', data: 'contrastCnt', type: 'numeric' },
      { title: '距平率', data: 'cntAnomalyRatio', type: 'numeric', format: '0.0' },
      { title: '轻度次数', data: 'slightCnt', type: 'numeric' },
      { title: '常年轻度次数', data: 'contrastSlightCnt', type: 'numeric' },
      { title: '轻度距平率', data: 'slightCntAnomalyRatio', type: 'numeric', format: '0.0' },
      { title: '严重次数', data: 'severityCnt', type: 'numeric' },
      { title: '常年严重次数', data: 'contrastSeverityCnt', type: 'numeric' },
      { title: '严重距平率', data: 'severityCntAnomalyRatio', type: 'numeric', format: '0.0' }
    ]
  };

  var getCondition = function() {
    var $lx_day = $('.query-type-lianxu-day'),
      $day = $('.query-type-day'),
      $rain = $('.query-type-rain'),
      para = {
        startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
        endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        slightNoSSHDays: Number($lx_day.eq(0).val()),
        slightPreDays: Number($day.eq(0).val()),
        slightMinValue: Number($rain.eq(0).val()),
        severityNoSSHDays: Number($lx_day.eq(1).val()),
        severityPreDays: Number($day.eq(1).val()),
        severityMinValue: Number($rain.eq(1).val()),
        terminPreDays: Number($day.eq(2).val()),
        terminValue: Number($rain.eq(2).val()),
        '_service_': 'continuousRainsByRange'
      };

    if (queryType === 'yearsResult') {
      $.extend(para, {
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'continuousRainsYearsSequnence'
      });
    }
    corePage.qCondition.set(para);
    return para;
  }

  var initGrid = function(data) {
    var _data = (data[queryType] || data);
    corePage.Grid = corePage.grid(cols[queryType], _data);
  };
  var display = function(data) {

    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap2FillRegion(_data, ['#efe4b0', '#99d9da', '#00a2e8', '#3f48cc', '#0d47a1'], {
        dataSchema: { value: 'cnt', code: 'station_Id_C' },
        title: '连阴雨',
        subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
          '至' +
          $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
      });
    }
    if (_data.length === 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };


  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    className: 'dataType',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'contrastList' } },
      { text: '逐次', attr: { value: 'sequenceList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  //站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map'], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '连阴雨标准',
    items: [{
      title: '一般连阴雨',
      content: [
        '连续&gt;=',
        '<input class="singleTime sm query-type-lianxu-day" value="6" type="number"><sub>天</sub>&nbsp;阴雨且无日照',
        '<i class="separator"></i>其中任意',
        '<input class="singleTime sm query-type-day" value="4" type="number"><sub>天</sub>&nbsp;白天雨量&gt;=',
        '<input class="singleTime sm query-type-rain" value="0.1" type="number"><sub>mm</sub>',
      ].join('')
    }, {
      title: '严重连阴雨',
      content: [
        '连续&gt;=',
        '<input class="singleTime sm query-type-lianxu-day" value="10" type="number"><sub>天</sub>&nbsp;阴雨且无日照',
        '<i class="separator"></i>其中任意',
        '<input class="singleTime sm query-type-day" value="7" type="number"><sub>天</sub>&nbsp;白天雨量&gt;=',
        '<input class="singleTime sm query-type-rain" value="0.1" type="number"><sub>mm</sub>',
      ].join('')
    }, {
      title: '终止条件',
      content: [
        '连续&gt;=',
        '<input class="singleTime sm query-type-day" value="3" type="number"><sub>天</sub>&nbsp;白天降水&lt;=',
        '<input class="singleTime sm query-type-rain" value="0.0" type="number"><sub>mm</sub>',
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*暴雨*/
var stormPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    totalResult: [
      { title: '站名', data: 'station_Name' },
      { title: '站号', data: 'station_Id_C' },
      { title: '地区', data: 'area' },
      { title: '总次数', data: 'sum', type: 'numeric' },
      { title: '暴雨次数', data: 'level1Cnt', type: 'numeric' },
      { title: '大暴雨次数', data: 'level2Cnt', type: 'numeric' },
      { title: '特大暴雨次数', data: 'level3Cnt', type: 'numeric' },
      { title: '降水极值', data: 'extValue', type: 'numeric', format: '0.0' },
      { title: '极值日期', data: 'extDatetime', type: 'numeric', format: '0.0' }
    ],
    seqResult: [
      { title: '站名', data: 'station_Name' },
      { title: '站号', data: 'station_Id_C' },
      { title: '地区', data: 'area' },
      { title: '日期', data: 'datetime' },
      { title: '降水量', data: 'value', type: 'numeric', format: '0.0' },
      { title: '强度', data: 'level' }
    ],
    yearsResult: [
      { title: '年份', data: 'year', type: 'numeric' },
      { title: '总次数', data: 'cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsCnt', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'cntAnomaly', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'cntAnomalyRate', type: 'numeric', format: '0.0' },
      { title: '降水极值', data: 'extValue', type: 'numeric', format: '0.0' },
      { title: '出现日期', data: 'extDatetime' },
      { title: '暴雨次数', data: 'level1Cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsLevel1Cnt', type: 'numeric', format: '0.0' },
      { title: '大暴雨次数', data: 'level2Cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsLevel2Cnt', type: 'numeric', format: '0.0' },
      { title: '特大暴雨次数', data: 'level3Cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsLevel3Cnt', type: 'numeric', format: '0.0' }
    ]
  };
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      type: $rainRadios.siblings('.active').val(),
      level1: Number($('#rainstorm-index-normal').val()),
      level2: Number($('#rainstorm-index-large').val()),
      level3: Number($('#rainstorm-index-great').val()),
      stationType: $stationRadios.siblings('.active').attr('data'),
      '_service_': 'rainstormByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'rainstormByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {

    var select_type = $('#map-type-snow');
    var selected_name = select_type.find('option:checked').text(),
      selected_value = select_type.val();

    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: selected_value, code: 'station_Id_C' },
      title: selected_name + '空间分布'
    });
  };

  function initMapToolbar() {
    // 按钮组
    $('<div class="tpl-toolbar-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="tpl-toolbar-title">类型</span>')
      .append(
        '<select id="map-type-snow" class="tpl-toolbar-item">' +
        '<option value="sum" checked>总次数</option>' +
        '<option value="level1Cnt">暴雨次数</option>' +
        '<option value="level2Cnt" checked>大暴雨次数</option>' +
        '<option value="level3Cnt">特大暴雨次数</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData[queryType] || queryData);
      });
  }

  function initChart(data) {
    // 数据
    var series = [];
    // 配置参数
    var chartOpt = {
      title: { text: '' },
      subtitle: {
        text: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
          '至' + $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
      }
    };
    // X轴参数
    var x = {
      categories: [],
      title: { text: '' }
    };
    // Y轴参数
    var y = {
      plotLines: null,
      title: { text: '' }
    };
    switch (queryType) {
      case 'totalResult':
        chartOpt.title.text = '暴雨灾害站次序列';

        // x.title.text = '站次';
        y.title.text = '降水量(mm)';

        var y1s = { name: '总次数', data: [] },
          y2s = { name: '暴雨次数', data: [] },
          y3s = { name: '大暴雨次数', data: [] },
          y4s = { name: '特大暴雨次数', data: [] };
        data.forEach(function(item) {
          x.categories.push(item.station_Name);
          y1s.data.push(item.sum);
          y2s.data.push(item.level1Cnt);
          y3s.data.push(item.level2Cnt);
          y4s.data.push(item.level3Cnt);
        });
        series = [y1s, y2s, y3s, y4s];
        break;
      case 'seqResult':
        chartOpt.title.text = '暴雨逐次序列';
        // x.title.text = '站次';
        y.title.text = '出现次数';

        var y1s = { name: '降水量', data: [] };
        data.forEach(function(item) {
          x.categories.push(item.station_Name);
          y1s.data.push(item.value);
        });
        series = [y1s, y2s, y3s, y4s];
        break;
      case 'yearsResult':
        break;
    }
    corePage.Chart = corePage.chart(x, y, series, chartOpt);
  }
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (!G.isPretty(_data)) {
      corePage.$panel.empty();
      corePage.Alert.show('该时段（条件）没有统计结果...');
    }

    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMapToolbar();
      initMap(_data);
    } else if (displayType === 'chart') {
      initChart(_data);
    }

  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0,.query-item-2', value: 'totalResult' } },
      { text: '逐次', attr: { data: '.query-item-2', value: 'seqResult' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
    ],
    handler: function() {
      resetNoMapDisplay();
      tpl.ext.toggleCondition(this);
      var isPretty = queryType !== 'yearsResult';
      queryType = $(this).val();
      if (isPretty && queryType !== 'yearsResult' && !corePage.qCondition.change() && queryData)
        display(queryData);
      else corePage.onStatistics();
    }
  });
  var $rainRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '时次',
    items: [
      { text: '08-08', attr: { value: 'RAINSTORM0808' } },
      { text: '08-20', attr: { value: 'RAINSTORM0820' } },
      { text: '20-08', attr: { value: 'RAINSTORM2008' } },
      { text: '20-20', attr: { value: 'RAINSTORM2020' } }
    ],
    handler: function() {
      corePage.onStatistics();
    }
  }, 3);

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all'], 'query-item-2').click(function() {
    corePage.onStatistics();
  });

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart', {
    type: 'map',
    className: 'query-item-0'
  }]).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  function resetNoMapDisplay() {
    $display.siblings('*[value="map"]').hide();
    $display.siblings('*[value="surfer"]').hide();
    if (displayType === 'map' || displayType === 'surfer') {
      $display.siblings('.active').removeClass('active');
      $display.siblings('*[value="grid"]').addClass('active');
      displayType = 'grid';
    }
  }

  tpl.Plugin.index(this.$condition, {
    title: '暴雨标准',
    items: [{
      title: '暴雨',
      content: [
        '日雨量',
        '<input id="rainstorm-index-normal" class="singleTime" value="50" type="number"> ~&nbsp;99.9',
        '<sub>mm</sub>'
      ].join('')
    }, {
      title: '大暴雨',
      content: [
        '日雨量',
        '<input id="rainstorm-index-large" class="singleTime" value="100" type="number"> ~&nbsp;250.0',
        '<sub>mm</sub>'
      ].join('')
    }, {
      title: '特大暴雨',
      content: [
        '日雨量&nbsp;&gt;',
        '<input id="rainstorm-index-great" class="singleTime" value="250" type="number">',
        '<sub>mm</sub>',
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*干旱*/
var mciPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    sequenceResult: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: 'SPIW60', data: 'sPIW60', type: 'numeric', format: '0.0' },
      { title: 'MI', data: 'mI', type: 'numeric', format: '0.0' },
      { title: 'SPI90', data: 'sPI90', type: 'numeric', format: '0.0' },
      { title: 'SPI150', data: 'sPI150', type: 'numeric', format: '0.0' },
      { title: 'MCI', data: 'mCI', type: 'numeric', format: '0.0' },
      { title: '等级', data: 'level', type: 'numeric', format: '0.0' }
    ],
    stationResult: [
      { title: '时间', data: 'datetime' },
      { title: '特旱', data: 'level4', type: 'numeric' },
      { title: '重旱', data: 'level3', type: 'numeric' },
      { title: '中旱', data: 'level2', type: 'numeric' },
      { title: '轻旱', data: 'level1', type: 'numeric' },
      { title: '有旱', data: 'existDays', type: 'numeric' },
      { title: '无旱', data: 'noDays', type: 'numeric' }
    ],
    agmesoilStatisticsByTime: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '土壤深度', data: 'soil_Depth_BelS', type: 'numeric' },
      { title: '土壤体积含水量', data: 'sVWC', type: 'numeric', format: '0.0' },
      { title: '土壤相对湿度', data: 'sRHU', type: 'numeric', format: '0.0' },
      { title: '土壤重量含水率', data: 'sWWC', type: 'numeric', format: '0.0' },
      { title: '土壤有效水分贮存量', data: 'sVMS', type: 'numeric', format: '0.0' }
    ]
  };
  var getCondition = function() {
    var $lvl = $('.query-type-ganhan');
    var para = {
      level1: Number($lvl.eq(0).val()),
      level2: Number($lvl.eq(1).val()),
      level3: Number($lvl.eq(2).val()),
      level4: Number($lvl.eq(3).val())
    };
    if (queryType === 'sequenceResult')
      $.extend(para, {
        datetime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
        _service_: 'mciByTime'
      });
    else if (queryType === 'stationResult')
      $.extend(para, {
        startTimeStr: $daterange.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
        endTimeStr: $daterange.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
        _service_: 'mciStatisticsByTime'
      });
    else {
      $.extend(para, {
        datetime: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
        _service_: queryType
      });
    }
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };

  function getMCIStyles() {
    var para = getCondition();
    var mciStyles = StyleManager.getStyleByName('mciStyles');
    mciStyles[0][1] = para.level4;
    mciStyles[1][0] = para.level4;
    mciStyles[1][1] = para.level3;
    mciStyles[2][0] = para.level3;
    mciStyles[2][1] = para.level2;
    mciStyles[3][0] = para.level2;
    mciStyles[3][1] = para.level1;
    mciStyles[4][0] = para.level1;

    return mciStyles;
  }

  var initMapToolbar = function() {
    corePage.$toolbar.empty();
    // 按钮组
    $('<div class="tpl-toolbar-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="tpl-toolbar-title">类型</span>')
      .append(
        '<select class="tpl-toolbar-item">' +
        '<option value="iso" checked>等值面图</option>' +
        '<option value="">单值填色图</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        var $this = $(this).find('option:checked');
        corePage.Map.setTitle('干旱等级' + $this.html());
        if (this.value) {
          initMap(queryData);
        } else {
          var instance = corePage.Map;
          var mciStyles = getMCIStyles();
          instance.removeLayer(instance.layerISO);
          instance.fillRegionColor(queryData, function(value) {
            if (isNaN(value)) return StyleManager.plainStyle;
            for (var i = mciStyles.length; i--;) {
              var style = mciStyles[i];
              if (value <= style[1] && value > style[0])
                return style[2];
            }
            return StyleManager.plainStyle;
          });
        }
      });
  };
  var initMap = function(data) {
    initMapToolbar();
    corePage.Map = corePage.map({
      title: '干旱等级等值面图',
      subtitle: corePage.qCondition.get().datetime,
      style: { type: 'fill', styles: getMCIStyles() },
      dataSchema: { code: 'areaCode', value: 'mCI' }
    }, data);
  };
  var initSurfer = function(data) {
    corePage.Surfer = corePage.surfer({
      surfer: { fillColor: 'MCI' },
      toolbar: { color: false, contour: false },
      dataSchema: { value: 'mCI' }
    }, data);
  };

  var initChart = function(data) {
    var para = corePage.qCondition.get();
    var datas = { level1: [], level2: [], level3: [], level4: [] };
    var times = [];
    data.forEach(function(item) {
      datas.level1.push(item.level1);
      datas.level2.push(item.level2);
      datas.level3.push(item.level3);
      datas.level4.push(item.level4);
      times.push(item.datetime);
    });
    corePage.Chart = corePage.chart({ categories: times }, { title: { text: '干旱站次' } }, [
      { name: '特旱', data: datas.level4, color: '#700016' },
      { name: '重旱', data: datas.level3, color: '#fe0000' },
      { name: '中旱', data: datas.level2, color: '#fe9533' },
      { name: '轻旱', data: datas.level1, color: '#ffff8b' }
    ], {
      title: { text: '干旱等级序列图' },
      subtitle: { text: para.startTimeStr + '至' + para.endTimeStr },
      tooltip: { shared: true, crosshairs: true },
      plotOptions: {
        column: { stacking: 'normal' },
        spline: { stacking: 'normal' },
        areaspline: { stacking: 'normal' }
      }
    });
  };

  /**
   * 土壤湿度出图
   * @author rexer
   * @date   2017-08-11
   * @param  {[type]}   data [description]
   * @return {[type]}        [description]
   */
  function initMap4agmesoil(data) {
    var $depth = $('#map-toolbar-soil');
    var depth = Number($depth.val()); // 土壤深度
    var depth_title = $depth.find('option:selected').text();


    var results = []; // 结果

    var valueKey = 'sRHU'; // 数值字段


    if (isNaN(depth)) { // 合计各深度平均值
      // 按站点分组
      var stationGroup = {}
      data.forEach(function(item, index) {
        var stationId = item.station_Id_C
        if (stationGroup.hasOwnProperty(stationId)) {
          stationGroup[stationId].push(item);
        } else {
          stationGroup[stationId] = [item];
        }
      });
      // 求平均值
      for (var key in stationGroup) {
        var stations = stationGroup[key];
        var sum = 0;
        stations.forEach(function(item) {
          sum += item[valueKey];
        });

        var avg = sum / stations.length;

        var stationData = stations[0];
        stationData[valueKey] = avg; // 赋值
        // 加入结果
        results.push(stationData)
      }
    } else { // 按深度提取值
      var stationMap = {}; // Map
      data.forEach(function(item, index) {
        if (item['soil_Depth_BelS'] === depth) {
          stationMap[item.station_Id_C] = item;
        }
      });
      // 转为数组
      for (var key in stationMap) {
        results.push(stationMap[key]);
      }
    }

    corePage.Map = corePage.map({
      title: '土壤湿度分布图 深度' + depth_title,
      style: { type: 'auto', option: { colorType: 'w', isReverse: true } },
      dataSchema: { value: valueKey }
    }, results);

  }

  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      if (queryType === 'agmesoilStatisticsByTime') {
        // 土壤湿度
        $('<div class="tpl-toolbar-group"></div>')
          .prependTo(corePage.$toolbar)
          .append('<span class="tpl-toolbar-title">土壤深度层级</span>')
          .append(
            '<select id="map-toolbar-soil" class="tpl-toolbar-item">' +
            '<option value="10" selected>0~10</option>' +
            '<option value="20">10~20</option>' +
            '<option value="30">20~30</option>' +
            '<option value="40">30~40</option>' +
            '<option value="all">0~40</option>' +
            '</select>'
          ).on('change', 'select', function(event) {
            event.preventDefault();
            initMap4agmesoil(queryData);
          });
        initMap4agmesoil(_data);
      } else initMap(_data);
    } else if (displayType === 'surfer') {
      initSurfer(_data);
    } else if (displayType === 'chart') {
      initChart(_data);
    }
    if (_data.length === 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '逐次', attr: { data: '.query-item-0', value: 'sequenceResult' } },
      { text: '站次', attr: { data: '.query-item-1', value: 'stationResult' } },
      { text: '土壤湿度', attr: { data: '.query-item-2', value: 'agmesoilStatisticsByTime' } }
    ],
    handler: function() {
      tpl.ext.toggleCondition(this);
      queryType = $(this).val();
      displayType = 'grid';
      $('button[value="grid"]').addClass('active').siblings('.active').removeClass('active');
      corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-0 query-item-2', type: 'date', single: true, config: { startDate: moment().subtract('d', 1) } });

  var $daterange = tpl.Plugin.datepicker(this.$condition, { className: 'query-item-1', type: 'date' });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map', 'surfer'], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  var $display2 = tpl.Plugin.display(this.$condition, ['grid', 'chart'], 'query-item-1').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  // 土壤湿度
  var $display3 = tpl.Plugin.display(this.$condition, ['grid', 'map'], 'query-item-2').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '干旱等级',
    items: [{
      title: '轻旱',
      content: 'CI值≤<input class="query-type-ganhan singleTime" value="-1.00" type="number">'
    }, {
      title: '中旱',
      content: 'CI值≤<input class="query-type-ganhan singleTime" value="-1.50" type="number">'
    }, {
      title: '重旱',
      content: 'CI值≤<input class="query-type-ganhan singleTime" value="-2.00" type="number">'
    }, {
      title: '特旱',
      content: 'CI值≤<input class="query-type-ganhan singleTime" value="-2.50" type="number">'
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
      if (tpl.ext.isExpectedType(data)) {
        queryData = data;
        display(data);
      } else {
        console.log(data);
        queryData = null;
        display([]);
        corePage.Alert.show('该时段（条件）没有统计结果...');
      }
    });
  });
  //默认
  $typeRadios.siblings('.active').removeClass('active').click();

};

/*高温*/
var highTempPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    highTmpRangeResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '总次数', data: 'totalCnt', type: 'numeric' },
      { title: '一般高温次数', data: 'level1Cnt', type: 'numeric' },
      { title: '中等高温日数', data: 'level2Cnt', type: 'numeric' },
      { title: '严重高温日数', data: 'level3Cnt', type: 'numeric' },
      { title: '高温极值', data: 'extHighTmp', type: 'numeric', format: '0.0' },
      { title: '极值日期', data: 'extHighTmpTime' },
    ],
    highTmpRangeResultSequenceList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'country' },
      { title: '日期', data: 'datetime' },
      { title: '程度', data: 'level' },
      { title: '高温', data: 'tem_Max', type: 'numeric', format: '0.0' },
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '高温', data: 'totalCnt', type: 'numeric', format: '0.0' },
      { title: '常年值', data: 'yearsTotalCnt', type: 'numeric', format: '0.0' },
      { title: '距平率(%)', data: 'totalCntAnomaly', type: 'numeric', format: '0.0' },
      { title: '一般高温', data: 'level1Cnt', type: 'numeric', format: '0.0' },
      { title: '常年值', data: 'yearsLevel1Cnt', type: 'numeric', format: '0.0' },
      { title: '距平率(%)', data: 'level1CntAnomaly', type: 'numeric', format: '0.0' },
      { title: '中等高温', data: 'level2Cnt', type: 'numeric', format: '0.0' },
      { title: '常年值', data: 'yearsLevel2Cnt', type: 'numeric', format: '0.0' },
      { title: '距平率(%)', data: 'level2CntAnomaly', type: 'numeric', format: '0.0' },
      { title: '严重高温', data: 'level3Cnt', type: 'numeric', format: '0.0' },
      { title: '常年值', data: 'yearsLevel3Cnt', type: 'numeric', format: '0.0' },
      { title: '距平率(%)', data: 'level3CntAnomaly', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var $lvl = $('.query-type-gaowen');
    var para = {
      level1HighTmp: Number($lvl.eq(0).val()),
      level2HighTmp: Number($lvl.eq(1).val()),
      level3HighTmp: Number($lvl.eq(2).val()),
      station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      '_service_': 'highTmpByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'highTmpByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };

  var initMap = function(data) {

    var select_type = $('#map-type-ht');
    var selected_name = select_type.find('option:checked').text(),
      selected_value = select_type.val();

    initMap2FillRegion(data, ['#c3c3c3', '#ffff8b', '#fe9533', '#fe0000', '#700016'], {
      dataSchema: { value: selected_value, code: 'station_Id_C' },
      title: selected_name + '空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };

  function initMapToolbar() {
    // 按钮组
    $('<div class="tpl-toolbar-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="tpl-toolbar-title">类型</span>')
      .append(
        '<select id="map-type-ht" class="tpl-toolbar-item">' +
        '<option value="totalCnt" checked>总次数</option>' +
        '<option value="level1Cnt" checked>一般高温次数</option>' +
        '<option value="level2Cnt" checked>中等高温日数</option>' +
        '<option value="level3Cnt" checked>严重高温日数</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData[queryType] || queryData);
      });
  }
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMapToolbar();
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'highTmpRangeResultList' } },
      { text: '逐次', attr: { value: 'highTmpRangeResultSequenceList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  //站点

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '高温灾害',
    items: [{
      title: '一般高温',
      content: '<input class="singleTime query-type-gaowen" value="35.0" type="number"><sub>℃</sub>'
    }, {
      title: '中等高温',
      content: '<input class="singleTime query-type-gaowen" value="37.0" type="number"><sub>℃</sub>'
    }, {
      title: '严重高温',
      content: '<input class="singleTime query-type-gaowen" value="40.0" type="number"><sub>℃</sub>'
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*低温*/
var lowTempPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    lowTmpSequenceResult: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现次数', data: 'cnt', type: 'numeric' },
      { title: '最重程度', data: 'level' },
      { title: '开始期', data: 'startDatetime' },
      { title: '结束期', data: 'endDatetime' },
      { title: '持续候数', data: 'persistHous', type: 'numeric' },
    ],
    lowTmpResultTimesListResult: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '开始期', data: 'startDatetime' },
      { title: '结束期', data: 'endDatetime' },
      { title: '持续候数', data: 'persistHous', type: 'numeric' },
      { title: '平均气温', data: 'avgTmp', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
      { title: '程度', data: 'level' },
    ],
    lowTmpResultHousResult: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '时间', data: 'time' },
      { title: '值', data: 'value', type: 'numeric', format: '0.0' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '总出现次数', data: 'sum', type: 'numeric' },
      { title: '常年出现次数', data: 'sumYears', type: 'numeric' },
      { title: '距平率', data: 'sumAnomalyRate', type: 'numeric', format: '0.0' },
      { title: '程度一般总出现次数', data: 'normalSum', type: 'numeric' },
      { title: '程度一般常年出现次数', data: 'normalSumYears', type: 'numeric' },
      { title: '程度一般距平率', data: 'normalAnomalyRate', type: 'numeric', format: '0.0' },
      { title: '程度严重总出现次数', data: 'seriousnessSum', type: 'numeric' },
      { title: '程度严重常年出现次数', data: 'seriousnessSumYears', type: 'numeric' },
      { title: '程度严重距平率', data: 'seriousnessAnomalyRate', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var $hou_index = $('.query-type-hou'),
      $tmp_index = $('.query-type-tmp'),
      $month_index = $('.query-type-month');

    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      startYear: Number($year_h.find('.start').val()),
      endYear: Number($year_h.find('.end').val()),
      constatStartYear: Number($year_p.find('.start').val()),
      constatEndYear: Number($year_p.find('.end').val()),
      level1SequenceSeason: Number($hou_index.eq(0).val()),
      level1SequenceTmp: Number($tmp_index.eq(0).val()),
      level1ExceptMonthes: $month_index.eq(0).prop('checked') ? $month_index.eq(0).val() : '',
      level2SequenceSeason: Number($hou_index.eq(1).val()),
      level2SequenceTmp: Number($tmp_index.eq(1).val()),
      level2ExceptMonthes: $month_index.eq(1).val(),
      '_service_': 'lowTmpByRange'
    };
    if (queryType === 'yearsResult') {
      para.station_Id_Cs = $stationpanel.customStationPanel('getCodes');
      para._service_ = 'lowTmpByYear';
    }
    corePage.qCondition.set(para);
    return para;
  };
  var houFormat = function(data) {
    var result = [],
      i;
    for (i = 0; i < data.length; i++) {
      var list = data[i].list,
        j;
      for (j = 0; j < list.length; j++) {
        var time = list[j].time.split('-');
        result.push($.extend({}, list[j], {
          station_Id_C: data[i].station_Id_C,
          station_Name: data[i].station_Name,
          time: time[0] + '年' + time[1] + '月第' + time[2] + '候'
        }));
      }
    }
    return result;
  };
  var initGrid = function(data) {
    if (queryType === 'lowTmpResultHousResult')
      corePage.Grid = corePage.grid(cols[queryType], houFormat(data));
    else corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {
    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: 'persistHous', code: 'station_Id_C' },
      title: '低温累积候数空间分布'
    });
  };
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap(_data);
    }
    if (_data.length === 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [ // FIXME 合计逐次后台字段名写反
      { text: '合计', attr: { data: '.query-item-0', value: 'lowTmpSequenceResult' } },
      { text: '逐次', attr: { value: 'lowTmpResultTimesListResult' } },
      { text: '逐候', attr: { value: 'lowTmpResultHousResult' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } }
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

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  // var $hou = tpl.Plugin.hou(this.$condition);
  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '低温标准',
    items: [{
      title: '一般低温',
      content: [
        '连续&gt;=<input class="singleTime query-type-hou" value="2" type="number"> 候平均气温低于多年同期候平均温度',
        '<input class="singleTime query-type-tmp" value="2.0" type="number"> ℃以上的时段',
        '<input class="query-type-month" value="7,8" type="checkbox" style="margin-left: 10px;" checked> 7、8月除外'
      ].join('')
    }, {
      title: '严重低温',
      content: [
        '连续&gt;=<input class="singleTime query-type-hou" value="3" type="number"> 候平均气温低于多年同期候平均温度',
        '<input class="singleTime query-type-tmp" value="2.0" type="number" disabled> ℃以上的时段',
        '<input class="query-type-month" value="7,8" type="checkbox" style="margin-left: 10px;" checked disabled> 7、8月除外'
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*强降温*/
var strongCoolingPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    strongCoolingTotalResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现次数', data: 'cnt', type: 'numeric' },
      { title: '最重程度', data: 'mostLevel' },
      { title: '最后一次开始日期', data: 'startDatetimeLast' },
      { title: '最后一次结束日期', data: 'endDatetimeLast' },
      { title: '最后一次持续天数', data: 'persistDaysLast', type: 'numeric' },
      { title: '最后一次程度', data: 'levelLast' },
    ],
    strongCoolingSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '开始日期', data: 'startDatetime' },
      { title: '结束日期', data: 'endDatetime' },
      { title: '持续天数', data: 'persistDays', type: 'numeric' },
      { title: '过程降温', data: 'totalLowerTmp', type: 'numeric', format: '0.0' },
      { title: '72小时内降幅', data: 'hours72LowerTmp', type: 'numeric', format: '0.0' },
      { title: '程度', data: 'level' },
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '总次数', data: 'cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsCnt', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' },
      { title: '最强72小时降温', data: 'mostLowerTmp72Hours', type: 'numeric', format: '0.0' },
      { title: '特强降温次数', data: 'level1LowerTmpCnt', type: 'numeric' },
      { title: '常年值', data: 'yearsLevel1LowerTmpCnt', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'level1AnomalyRate', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var $winter = $('.query-type-winter'),
      $spring = $('.query-type-spring'),
      $summer = $('.query-type-summer'),
      $summer_check = $('.query-type-summer-check');
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      level1WinterTmp: Number($winter.eq(0).val()),
      level1springAutumnTmp: Number($spring.eq(0).val()),
      level1SummerTmp: Number($summer.eq(0).val()),
      level2WinterTmp: Number($winter.eq(1).val()),
      level2springAutumnTmp: Number($spring.eq(1).val()),
      level2SummerTmp: Number($summer.eq(1).val()),
      level1SummerFlag: $summer_check.eq(0).is(':checked'),
      level2SummerFlag: $summer_check.eq(1).is(':checked'),
      stationType: $stationRadios.siblings('.active').attr('data'),
      '_service_': 'strongCoolingByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        '_service_': 'strongCoolingByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {
    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: 'cnt', code: 'station_Id_C' },
      title: '强降温累积次数空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'strongCoolingTotalResultList' } },
      { text: '逐次', attr: { value: 'strongCoolingSequenceResultList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all'], 'query-item-1').click(function() {
    corePage.onStatistics();
  });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '强降温标准',
    items: [{
      title: '强降温',
      content: [
        '冬季(12~2月)72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-winter" value="6" type="number"><sub>℃</sub>',
        '<i class="separator"></i> 春季和秋季72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-spring" value="8" type="number"><sub>℃</sub>',
        '<i class="separator"></i>',
        '<input class="query-type-summer-check" type="checkbox">夏季(5~9月)72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-summer" value="8" type="number"><sub>℃</sub>',
      ].join('')
    }, {
      title: '特强降温',
      content: [
        '冬季(12~2月)72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-winter" value="8" type="number"><sub>℃</sub>',
        '<i class="separator"></i> 春季和秋季72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-spring" value="10" type="number"><sub>℃</sub>',
        '<i class="separator"></i>',
        '<input class="query-type-summer-check" type="checkbox">夏季(5~9月)72小时内日平均气温下降&gt;=',
        '<input class="singleTime sm query-type-summer" value="10" type="number"><sub>℃</sub>',
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*大风*/
var maxWindPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    maxWindRangeResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '大风出现次数', data: 'cnt', type: 'numeric' },
      { title: '最严重程度', data: 'maxLevel' },
      { title: '最大风速', data: 'maxWindS', type: 'numeric', format: '0.0' },
      { title: '最大风速对应的风向', data: 'maxWindD', type: 'numeric', format: '0.0' },
      { title: '最大风速发生的时间', data: 'maxWindTimes' },
      { title: '轻度风灾次数', data: 'mildCnt', type: 'numeric' },
      { title: '中度风灾次数', data: 'moderateCnt', type: 'numeric' },
      { title: '严重风灾次数', data: 'severityCnt', type: 'numeric' },
    ],
    maxWindRangeResultSequenceList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现时间', data: 'maxWindTime' },
      { title: '极大风速', data: 'wIN_S_Inst_Max', type: 'numeric', format: '0.0' },
      { title: '极大风速对应的风向', data: 'wIN_D_INST_Max', type: 'numeric', format: '0.0' },
      { title: '风力程度', data: 'level' },
      { title: '风力等级', data: 'levelNum' }
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '总次数', data: 'cnt', type: 'numeric' },
      { title: '常年值', data: 'yearsCnt', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' },
      { title: '轻度次数', data: 'mildCnt', type: 'numeric' },
      { title: '中度次数', data: 'moderateCnt', type: 'numeric' },
      { title: '严重次数', data: 'severityCnt', type: 'numeric' },
    ]
  };
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      stationType: $stationRadios.siblings('.active').attr('data'),
      '_service_': 'maxWindByRange',
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'maxWindByYear'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };

  var initMap = function(data) {

    var select_type = $('#map-type-wind');
    var selected_name = select_type.find('option:checked').text(),
      selected_value = select_type.val();

    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: selected_value, code: 'station_Id_C' },
      title: selected_name + '空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };

  function initMapToolbar() {
    // 按钮组
    $('<div class="btn-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="btn label-group-addon">类型</span>')
      .append(
        '<select id="map-type-wind" class="tpl-toolbar-item">' +
        '<option value="cnt" checked>大风出现次数</option>' +
        '<option value="mildCnt" checked>轻度风灾次数</option>' +
        '<option value="moderateCnt" checked>中度风灾次数</option>' +
        '<option value="severityCnt" checked>严重风灾次数</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData[queryType] || queryData);
      });
  }
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMapToolbar();
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'maxWindRangeResultList' } },
      { text: '逐次', attr: { data: '.query-item-1', value: 'maxWindRangeResultSequenceList' } },
      { text: '历年同期', attr: { data: '.query-item-2', value: 'yearsResult' } },
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
  // var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all'], 'query-item-1').click(function() {
  //     if (!corePage.qCondition.change() && queryData)
  //         display(queryData);
  //     else corePage.onStatistics();
  // });
  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-2');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-2' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-2' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    debugger;
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*雷暴*/
var thunderPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    thundTotalResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '发生次数', data: 'cnt', type: 'numeric' },
    ],
    thundSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '发生时间', data: 'datetime' },
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '常年次数', data: 'yearsCnt', type: 'numeric' },
      { title: '当年次数', data: 'currentCnt', type: 'numeric' },
      { title: '距平', data: 'anomaly', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      '_service_': 'thundByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'thundByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {
    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: 'cnt', code: 'station_Id_C' },
      title: '雷暴累积次数空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'thundTotalResultList' } },
      { text: '逐次', attr: { value: 'thundSequenceResultList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  //站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*冰雹*/
var hailPage = function() {
  var queryData;
  var displayType = 'grid';
  var cols = [
    { title: '站名', data: 'station_Name' },
    { title: '站号', data: 'station_Id_C' },
    { title: '地区', data: 'area' },
    { title: '日期', data: 'date' },
    { title: '开始时间点', data: 'startTime' },
    { title: '结束时间点', data: 'endTime' },
    { title: '最大冰雹直径', data: 'diameter', type: 'numeric', format: '0.0' },
  ];
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      '_service_': 'hailByRange'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };
  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    if (displayType === 'grid') {
      initGrid(data);
    } else if (displayType === 'map') {
      // initMap(data);
    }
    if (data.length === 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  var $datepicker = tpl.Plugin.datepicker(this.$condition, {
    type: 'date',
    config: {
      startDate: moment('1951-01-01'),
      endDate: moment()
    }
  });
  // var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
  //     displayType = $(this).val();
  //     if (!corePage.qCondition.change() && queryData)
  //         display(queryData);
  //     else corePage.onStatistics();
  // });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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
  this.onStatistics();
  // $display.siblings('.active').removeClass('active').click();
};

/*积雪*/
var snowPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    snowResultTotalList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '有积雪日数', data: 'gssDays', type: 'numeric' },
      { title: '有降雪日数', data: 'snowDays', type: 'numeric' },
      { title: '积雪最深深度', data: 'maxSnow_Depth', type: 'numeric', format: '0.0' },
      { title: '积雪平均深度', data: 'avgSnow_Depth', type: 'numeric', format: '0.0' },
    ],
    snowSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '日期', data: 'datetime' },
      { title: '积雪', data: 'gSS', type: 'numeric' },
      { title: '积雪深度', data: 'snow_Depth', type: 'numeric', format: '0.0' },
      { title: '降雪', data: 'snow', type: 'numeric' },
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '降雪日数', data: 'snowDays', type: 'numeric' },
      { title: '积雪日数', data: 'gssDays', type: 'numeric' },
      { title: '常年值', data: 'gssYearsDays', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'gssDaysAnomalyRate', type: 'numeric', format: '0.0' },
      { title: '最大积雪深度', data: 'maxSnowDepth', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      '_service_': 'snowByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'snowByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {

    var select_type = $('#map-type-snow');
    var selected_name = select_type.find('option:checked').text(),
      selected_value = select_type.val();

    initMap2FillRegion(data, ['#efe4b0', '#99d9da', '#00a2e8', '#3f48cc', '#0000ff'], {
      dataSchema: { value: selected_value, code: 'station_Id_C' },
      title: selected_name + '空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };

  function initMapToolbar() {
    // 按钮组
    $('<div class="btn-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="btn label-group-addon">类型</span>')
      .append(
        '<select id="map-type-snow" class="tpl-toolbar-item">' +
        '<option value="gssDays" checked>有积雪日数</option>' +
        '<option value="snowDays">有降雪日数</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData[queryType] || queryData);
      });
  }
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMapToolbar();
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'snowResultTotalList' } },
      { text: '逐次', attr: { value: 'snowSequenceResultList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  //站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, {
    type: 'date',
    config: {
      startDate: moment('1951-01-01'),
      endDate: moment()
    }
  });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*霜冻*/
var frostPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    frostTotalResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现次数', data: 'cnt', type: 'numeric' },
      { title: '最重程度', data: 'maxLevel' },
      { title: '极端低温', data: 'extLowTmp', type: 'numeric', format: '0.0' },
      { title: '开始期Last', data: 'startDatetimeLast' },
      { title: '结束期Last', data: 'endDatetimeLast' },
      { title: '持续天数Last', data: 'persistDaysLast', type: 'numeric' },
      { title: '程度Last', data: 'levelLast' }
    ],
    frostSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '开始日期', data: 'startDatetime' },
      { title: '结束日期', data: 'endDatetime' },
      { title: '持续天数', data: 'persistDays' },
      { title: '开始期Last', data: 'lowTmpDays' },
      { title: '极端低温', data: 'extLowTmp', type: 'numeric', format: '0.0' },
      { title: '程度', data: 'level' }
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '总次数', data: 'cnt', type: 'numeric' },
      { title: '常年值', data: 'yearCnt', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' },
      { title: '严重次数', data: 'level2Cnt', type: 'numeric', format: '0.0' },
      { title: '常年值', data: 'yearsLevel2Cnt', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'level2AnomalyRate', type: 'numeric', format: '0.0' },
    ]
  };
  var getCondition = function() {
    var $lx_day_index = $('.query-type-lianxu-day'),
      $lx_tmp_index = $('.query-type-lianxu-tmp'),
      $day_index = $('.query-type-day'),
      $tmp_index = $('.query-type-tmp');
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      level1PersistDays: Number($lx_day_index.eq(0).val()),
      level1LowTmp: Number($lx_tmp_index.eq(0).val()),
      level1LTLowTmpDays: Number($day_index.eq(0).val()),
      level1LTLowTmp: Number($tmp_index.eq(0).val()),
      level2PersistDays: Number($lx_day_index.eq(1).val()),
      level2LowTmp: Number($lx_tmp_index.eq(1).val()),
      level2LTLowTmpDays: Number($day_index.eq(1).val()),
      level2LTLowTmp: Number($tmp_index.eq(1).val()),
      stationType: $stationRadios.siblings('.active').attr('data'),
      '_service_': 'frostByRange',
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'frostByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    if (queryType === 'frostSequenceResultList')
      corePage.Grid = corePage.grid(cols[queryType], tpl.ext.Analyze.filterByStationType($stationRadios.siblings('.active').val(), data, 'station_Id_C'));
    else corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {
    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: 'cnt', code: 'station_Id_C' },
      title: '霜冻累积次数空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'frostTotalResultList' } },
      { text: '逐次', attr: { data: '.query-item-1', value: 'frostSequenceResultList' } },
      { text: '历年同期', attr: { data: '.query-item-2', value: 'yearsResult' } },
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
  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'all']).click(function() {
    corePage.onStatistics();
  });
  // var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all'], 'query-item-1').click(function() {
  //     if (!corePage.qCondition.change() && queryData)
  //         display(queryData);
  //     else corePage.onStatistics();
  // });
  //站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-2');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-2' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-2' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  tpl.Plugin.index(this.$condition, {
    title: '霜冻标准',
    items: [{
      title: '一般冻害',
      content: [
        '连续天数=<input class="singleTime sm query-type-lianxu-day" value="5" type="number"><sub>天</sub>&nbsp;温度&lt;=',
        '<input class="singleTime sm query-type-lianxu-tmp" value="2" type="number"><sub>℃</sub>',
        '<i class="separator"></i>',
        '任意天数=<input class="singleTime sm query-type-day" value="3" type="number"><sub>天</sub>&nbsp;温度&lt;=',
        '<input class="singleTime sm query-type-tmp" value="0" type="number"><sub>℃</sub>',
      ].join('')
    }, {
      title: '严重冻害',
      content: [
        '连续天数=<input class="singleTime sm query-type-lianxu-day" value="7" type="number"><sub>天</sub>&nbsp;温度&lt;=',
        '<input class="singleTime sm query-type-lianxu-tmp" value="2" type="number"><sub>℃</sub>',
        '<i class="separator"></i>',
        '任意天数=<input class="singleTime sm query-type-day" value="5" type="number"><sub>天</sub>&nbsp;温度&lt;=',
        '<input class="singleTime sm query-type-tmp" value="0" type="number"><sub>℃</sub>',
      ].join('')
    }]
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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

/*雾*/
var fogPage = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    fogResultTotalList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '最小能见度', data: 'vis_Min', type: 'numeric', format: '0.0' },
      { title: '最小能见度日期', data: 'vis_Min_Time' },
      { title: '雾次数', data: 'cnt', type: 'numeric' },
      { title: '轻雾次数', data: 'mistCnt', type: 'numeric' }
    ],
    fogSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '日期', data: 'datetime' },
      { title: '雾出现时间', data: 'fogTime' },
      { title: '最小能见度', data: 'vis_Min', type: 'numeric', format: '0.0' },
      { title: '最小相对湿度', data: 'rhu_Min', type: 'numeric', format: '0.0' },
      { title: '平均相对湿度', data: 'rhu_Avg', type: 'numeric', format: '0.0' }
    ],
    mistSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '日期', data: 'datetime' },
      { title: '最小能见度', data: 'vis_Min', type: 'numeric', format: '0.0' },
      { title: '最小相对湿度', data: 'rhu_Min', type: 'numeric', format: '0.0' },
      { title: '平均相对湿度', data: 'rhu_Avg', type: 'numeric', format: '0.0' }
    ],
    yearsResult: [
      { title: '年份', data: 'year' },
      { title: '雾日', data: 'fogDays' },
      { title: '常年值', data: 'yearsFogDays', type: 'numeric', format: '0.0' },
      { title: '距平率', data: 'anomalyRate', type: 'numeric', format: '0.0' },
      { title: '最小能见度', data: 'vis_Min' },
      { title: '轻雾日数', data: 'mistCnt' }
    ]
  };
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      '_service_': 'fogByRange'
    };
    if (queryType === 'yearsResult')
      $.extend(para, {
        station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
        startYear: Number($year_h.find('.start').val()),
        endYear: Number($year_h.find('.end').val()),
        perennialStartYear: Number($year_p.find('.start').val()),
        perennialEndYear: Number($year_p.find('.end').val()),
        '_service_': 'fogByYears'
      });

    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };
  var initMap = function(data) {

    var select_type = $('#map-type-fog');
    var selected_name = select_type.find('option:checked').text(),
      selected_value = select_type.val();

    initMap2FillRegion(data, ['#c3c3c3', '#efe4b0', '#99d9da', '#00a2e8', '#3f48cc'], {
      dataSchema: { value: selected_value, code: 'station_Id_C' },
      title: selected_name + '空间分布',
      subtitle: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date) +
        '至' +
        $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date)
    });
  };

  function initMapToolbar() {
    // 按钮组
    $('<div class="btn-group"></div>')
      .prependTo(corePage.$toolbar)
      .append('<span class="btn label-group-addon">类型</span>')
      .append(
        '<select id="map-type-fog" class="tpl-toolbar-item">' +
        '<option value="cnt" checked>雾次数</option>' +
        '<option value="mistCnt">轻雾次数</option>' +
        '</select>'
      ).on('change', 'select', function(event) {
        event.preventDefault();
        initMap(queryData[queryType] || queryData);
      });
  }
  var display = function(data) {
    // 展示类型
    if ($typeRadios.siblings('.active').text() != '合计' && displayType === 'map') {
      displayType = 'grid';
    }
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    var _data = (data[queryType] || data);
    if (displayType === 'grid') {
      initGrid(_data);
    } else if (displayType === 'map') {
      initMapToolbar();
      initMap(_data);
    }
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { data: '.query-item-0', value: 'fogResultTotalList' } },
      { text: '雾逐次', attr: { value: 'fogSequenceResultList' } },
      { text: '轻雾逐次', attr: { value: 'mistSequenceResultList' } },
      { text: '历年同期', attr: { data: '.query-item-1', value: 'yearsResult' } },
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

  //站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {}, 'query-item-1');

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  var $year_h = tpl.Plugin.year(this.$condition, { type: 'history', className: 'query-item-1' });

  var $year_p = tpl.Plugin.year(this.$condition, { type: 'perennial', className: 'query-item-1' });

  var $display = tpl.Plugin.display(this.$condition, [{ type: 'grid' }, { type: 'map' }], 'query-item-0').click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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
 * 天气现象
 */
function wepPage() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '日期', data: 'datetime' },
    { title: '开始时间', data: 'startTime' },
    { title: '结束时间', data: 'endTime' },
    { title: '代码', data: 'code' }, {
      title: '现象',
      data: 'code',
      renderer: function() { //显示代码对应中文现象说明
        // 天气现象
        var weps = tpl.CONST.WEPS;
        // 参数数组
        var args = Array.prototype.slice.call(arguments);
        var value = args[5]; //值
        var name = ''; //显示名
        for (var i = weps.length; i--;) {
          var wep = weps[i]
          if (value === wep.code) {
            name = wep.name;
            break;
          }
        }
        args[5] = name;
        Handsontable.renderers.TextRenderer.apply(this, args);
      }
    },
    { title: '天气现象', data: 'wepRecord' }
  ];

  function getCondition() {
    var para = {
      weps: $weps.find('.wep-list').val(),
      startTimeStr: $datepicker.customDatePicker('getStartTime').format(tpl.FORMATTER.date),
      endTimeStr: $datepicker.customDatePicker('getEndTime').format(tpl.FORMATTER.date),
      station_Id_Cs: $stationpanel.customStationPanel('getCodes'),
    };

    return para;
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

  // 天气现象列表
  var $weps = tpl.Plugin.customize(this.$condition, function(weps) {

    var $list = $('<select class="wep-list" style="font-size: 14px; font-weight: normal; line-height: 1.428571429; padding: 6px 12px; text-align: center; vertical-align: middle; white-space: nowrap; border: 1px solid #9ac3f3; border-radius: 4px;"></select>')
      .append('<option value="*">所有现象</option>');
    weps.forEach(function(wep) {
      var value = wep.code,
        text = wep.code + ' ' + wep.name;
      $list.append('<option value="' + value + '">' + text + '</option>');
    });
    return $list;
  }(tpl.CONST.WEPS), {
    title: '天气现象'
  }).on('change', '.wep-list', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });

  var $stationpanel = tpl.Plugin.stationpanel(this.$condition);

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'date' });

  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    tpl.ext.query('DisasterService/wepByRange', para, function(data) {
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

/**
 * 本地干旱
 */
function mciLocalPage() {
  var queryData;
  var queryType;
  var staticType;
  var displayType = 'grid';
  var cols = {
    localDroughTotalResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '出现次数', data: 'times' },
      { title: '最重程度', data: 'level' },
      { title: '类别', data: 'type' },
      { title: '最后一次开始日期', data: 'lastStartTimes' },
      { title: '最后一次结束期', data: 'lastEndTimes' },
      { title: '最后一次持续天数', data: 'lastPersistDays' },
      { title: '最后一次类别', data: 'lastType' },
      { title: '最后一次程度', data: 'lastLevel' }
    ],
    localDroughSequenceResultList: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '开始期', data: 'startTimes' },
      { title: '结束期', data: 'endTimes' },
      { title: '持续天数', data: 'persistDays' },
      { title: '过程雨量', data: 'sumPre' },
      { title: '干旱类别', data: 'type' },
      { title: '程度', data: 'level' }
    ]
  };


  function display(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    debugger
    var displayData = data[staticType] || [];

    switch (displayType) {
      case 'grid':
        corePage.Grid = corePage.grid(cols[staticType], displayData);
        break;
      case 'chart':
        break;
      case 'map':
        break;
      case 'surfer':
        break;
    }

    if (displayData.length === 0) {
      corePage.Alert.show('该时段（条件）没有统计结果...');
    }
  }


  this.page();

  // ## 设置条件

  $staticTypes = tpl.Plugin.radiobtn(this.$condition, {
    title: '类型',
    items: [
      { text: '合计', attr: { value: 'localDroughTotalResultList' } },
      { text: '逐次', attr: { value: 'localDroughSequenceResultList' } }
    ],
    handler: function() {
      staticType = $(this).val();
      if (!corePage.qCondition.change() && queryData)
        display(queryData);
      else corePage.onStatistics();
    }
  });
  // 设置默认
  staticType = $staticTypes.siblings('.active').val();

  // 干旱类型
  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '干旱标准',
    items: [{
        text: '春旱',
        handler: function() {
          $period.customDatePicker('setTimes', moment('2017-02-21'), moment('2017-04-30'));

          $startDays.eq(0).val(30) & $endDays.eq(0).text(39);
          $startDays.eq(1).val(40) & $endDays.eq(1).text(49);
          $startDays.eq(2).val(50) & $endDays.eq(2).text(59);
          $startDays.eq(3).val(60);

          $minRains.val('0.5');

          $startRain.val('0.0');

          $endRain.val('10.0') & $endDay.val(7);

        }
      },
      {
        text: '夏旱',
        handler: function() {
          $period.customDatePicker('setTimes', moment('2017-04-21'), moment('2017-06-30'));

          $startDays.eq(0).val(20) & $endDays.eq(0).text(29);
          $startDays.eq(1).val(30) & $endDays.eq(1).text(39);
          $startDays.eq(2).val(40) & $endDays.eq(2).text(49);
          $startDays.eq(3).val(50);

          $minRains.val('1.2');

          $startRain.val('1.0');

          $endRain.val('25.0') & $endDay.val(7);
        }
      },
      {
        text: '伏旱',
        handler: function() {
          $period.customDatePicker('setTimes', moment('2017-06-21'), moment('2017-09-10'));

          $startDays.eq(0).val(20) & $endDays.eq(0).text(29);
          $startDays.eq(1).val(30) & $endDays.eq(1).text(39);
          $startDays.eq(2).val(40) & $endDays.eq(2).text(49);
          $startDays.eq(3).val(50);

          $minRains.val('1.3');

          $startRain.val('1.0');

          $endRain.val('30.0') & $endDay.val(7);
        }
      },
      {
        text: '秋旱',
        handler: function() {
          $period.customDatePicker('setTimes', moment('2017-09-01'), moment('2017-11-30'));

          $startDays.eq(0).val(30) & $endDays.eq(0).text(39);
          $startDays.eq(1).val(40) & $endDays.eq(1).text(49);
          $startDays.eq(2).val(50) & $endDays.eq(2).text(59);
          $startDays.eq(3).val(60);

          $minRains.val('0.5');

          $startRain.val('0.0');

          $endRain.val('10.0') & $endDay.val(7);
        }
      },
      {
        text: '冬旱',
        handler: function() {
          $period.customDatePicker('setTimes', moment('2017-11-21'), moment('2018-02-28'));

          $startDays.eq(0).val(40) & $endDays.eq(0).text(49);
          $startDays.eq(1).val(50) & $endDays.eq(1).text(59);
          $startDays.eq(2).val(60) & $endDays.eq(2).text(69);
          $startDays.eq(3).val(70);

          $minRains.val('0.1');

          $startRain.val('0.0');

          $endRain.val('5.0') & $endDay.val(7);
        }
      },
    ],
    handler: function() {
      queryType = $(this).text();
      corePage.onStatistics();
    }
  });
  // 干旱时期
  var $period = tpl.Plugin.datepicker(this.$condition, {
    title: '干旱时期',
    type: 'date',
    clearCtrl: true,
    config: {
      locale: {
        format: 'MM-DD'
      }
    }
  });

  var $year = tpl.Plugin.year(this.$condition, {
    title: '统计年份',
    start: moment().year(),
    end: moment().year()
  });

  // var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart', 'map', 'surfer']).click(function(event) {
  //   displayType = $(this).val();
  //   if (!corePage.qCondition.change() && queryData)
  //     display(queryData);
  //   else corePage.onStatistics();
  // });

  tpl.Plugin.index(this.$condition, {
    title: '干旱等级',
    items: [{
      title: '轻旱',
      content: '任意连续<input class="MCI-days singleTime" value="30" type="number"> ~ <i class="MCI-days-high i">39</i>天内，<br/>日均降水量≤<input class="MCI-rains singleTime" value="0.5" type="number">毫米'
    }, {
      title: '中旱',
      content: '任意连续<input class="MCI-days singleTime" value="40" type="number"> ~ <i class="MCI-days-high i">49</i>天内，<br/>日均降水量≤<input class="MCI-rains singleTime" value="0.5" type="number">毫米'
    }, {
      title: '重旱',
      content: '任意连续<input class="MCI-days singleTime" value="50" type="number"> ~ <i class="MCI-days-high i">59</i>天内，<br/>日均降水量≤<input class="MCI-rains singleTime" value="0.5" type="number">毫米'
    }, {
      title: '特重旱',
      content: '任意连续<input class="MCI-days singleTime" value="60" type="number">天以上，<br/>日均降水量≤<input class="MCI-rains singleTime" value="0.5" type="number">毫米'
    }, {
      title: '开始',
      content: '初日降水<input class="MCI-rains-start singleTime" value="0.0" type="number">毫米'
    }, {
      title: '终止',
      content: '连续2天降水总量≥<input class="MCI-rains-end singleTime" value="10.0" type="number">毫米，或连续<input class="MCI-days-end singleTime" value="7" type="number">天未达到干旱标准'
    }]
  });

  this.condition();

  // declare conditions
  var $startDays = $('.MCI-days'),
    $endDays = $('.MCI-days-high'),
    $minRains = $('.MCI-rains'),
    $startRain = $('.MCI-rains-start'),
    $endRain = $('.MCI-rains-end'),
    $endDay = $('.MCI-days-end');

  /**
   * 获取参数
   */
  function getCondition() {
    return {
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val()),
      stations: '5%',
      type: queryType,
      startMonthDay: $period.customDatePicker('getStartTime').format('MM-DD'),
      endMonthDay: $period.customDatePicker('getEndTime').format('MM-DD'),
      level1LowDays: $startDays.eq(0).val(),
      level1HighDays: $endDays.eq(0).text(),
      level2LowDays: $startDays.eq(1).val(),
      level2HighDays: $endDays.eq(1).text(),
      level3LowDays: $startDays.eq(2).val(),
      level3HighDays: $endDays.eq(2).text(),
      level4LowDays: $startDays.eq(3).val(),
      level4HighDays: 100,
      startPre: $startRain.val(),
      endSumPre: $endRain.val(),
      persistDays: $endDay.val(),
      minPre: $minRains.val()
    }
  }

  this.onStatistics(function(event) {
    event.preventDefault();
    debugger
    var para = getCondition();
    tpl.ext.query('LocalDroughService/droughByTimes', para, function(data) {
      debugger
      if (tpl.ext.isExpectedType(data)) {
        queryData = data;
        display(data);
      } else {
        console.log(data);
        queryData = null;
        display({});
        corePage.Alert.show('该时段（条件）没有统计结果...');
      }
    });
  });
  //默认
  $typeRadios.siblings('.active').removeClass('active').click();

}
