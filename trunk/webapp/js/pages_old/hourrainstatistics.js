/**
 * 小时降水
 */

var corePage;
var run = function() {
  //tpl.const
  tpl.PLUGIN_STATION_KEY.area.text = '区域站';

  corePage = new tpl('小时降水统计').ready(function(event) {
    // Cache Variables
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');
    //加载模块
    // corePage.plugins([
    //     new CommonConfig(),
    //     new CommonData(),
    //     new CommonTool(),
    //     new StationInfoQuery(),
    //     new FeatureUtilityClass()
    // ]);
    tpl.ext.loadStation(function(data) { //回调
      corePage.StationData = data;
      corePage.menu([
        { text: '累计统计', value: 'm2', handler: hourRainAccumulate },
        { text: '极值统计', value: 'm1', handler: hourRainExt },
        { text: '过程统计', value: 'm3', handler: hourRainSequence },
        { text: '时段位次', value: 'm4', handler: hourRainRankTimes },
        { text: '同期位次', value: 'm5', handler: hourRainRankYears },
        { text: '历年极值', value: 'm6', handler: hourRainExtYears },
        { text: '逐时演变', value: 'm7', handler: hourRainChange },
        { text: '建站时间', value: 'm8', handler: stationTime },
        { text: '按站排序', value: 'm9', handler: hourRainSort  }
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

/**********小时降雨极值统计***********/
var hourRainExt = function() {
  // Cache Variables
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = {
    all: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '1小时', data: 'hour1', type: 'numeric', format: '0.0' },
      { title: '3小时', data: 'hour3', type: 'numeric', format: '0.0' },
      { title: '6小时', data: 'hour6', type: 'numeric', format: '0.0' },
      { title: '12小时', data: 'hour12', type: 'numeric', format: '0.0' },
      { title: '24小时', data: 'hour24', type: 'numeric', format: '0.0' }
    ],
    max: [
      { title: '站号', data: 'station_Id_C' },
      { title: '站名', data: 'station_Name' },
      { title: '地区', data: 'area' },
      { title: '极值类型', data: 'type' },
      { title: '极值', data: 'extValue', type: 'numeric', format: '0.0' },
      { title: '极值日期', data: 'extTimes' },
      { title: '历史排位', data: 'sort', type: 'numeric' },
      { title: '建站时间', data: 'buildDate' }
    ]
  };

  // 制图排除数据
  var checkData = {
    eleItem: null, // 当前项
    data: null, // 数据
    source: null // 原数据
  }

  var getCondition = function() { //获取条件 同步至corePage.qCondition
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      type: $stationRadios.siblings('.active').attr('data'),
      areaCode: $areapanel.customStationPanel('getCodes', 'data-area'),
      '_service_': queryType === 'max' ? 'hourRainExtByTimes' : 'hourRainExt'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols[queryType], data);
  };


  function initMap(data) {
    var para = corePage.qCondition.get(),
      startTime = para.startTimeStr,
      endTime = para.endTimeStr;
    var $chartType = $('#map-toolbar-type'),
      typeName = $chartType.find('option:selected').text(),
      typeKey = $chartType.val();
    // 排除数据
    var mapData = [];
    data.forEach(function(item) {
      if (item.checked) return;
      mapData.push(item);
    });
    corePage.Map = corePage.map({
      title: typeName + '降水分布图',
      style: { type: 'auto', option: { colorType: 'c' } },
      dataSchema: { value: typeKey }
    }, mapData);
    debugger

  }


  function checkMapDataByGrid() {
    debugger
    // var eleItem = $('.tpl-map-ele').val();
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
        var colProp = cols[queryType];
        var columns = [{ title: '制图排除', data: 'checked', type: 'checkbox' }]
          .concat(colProp);

        var hot = gridHelper.initGrid('#checkData-table', columns, queryData, {
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

  var display = function(data) { //呈现结果切换
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'map':
        if (queryType === 'max') {
          $display.siblings('[value="map"]').click();
        }
        $('<div class="tpl-toolbar-group"></div>')
          .prependTo(corePage.$toolbar)
          .append('<span class="tpl-toolbar-title">类型</span>')
          .append(
            '<select id="map-toolbar-type" class="tpl-toolbar-item">' +
            '<option value="hour1" selected>1小时</option>' +
            '<option value="hour3">3小时</option>' +
            '<option value="hour6">6小时</option>' +
            '<option value="hour12">12小时</option>' +
            '<option value="hour24">24小时</option>' +
            '</select>'
          ).on('change', 'select', function(event) {
            event.preventDefault();
            initMap(queryData);
          });

        // 添加站点排除按钮
        $('<button id="map-data-check" class="map-ctrl tpl-btn btn-success">数据排除</button>').on('click', function(event) {
          checkMapDataByGrid();
        }).appendTo(corePage.$toolbar);
        initMap(data);

        break;
    }
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  }

  this.page(); //重置页面

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '统计类别',
    items: [{
      text: '所有数据',
      attr: { value: 'all' }
    }, {
      text: '最大值',
      attr: { value: 'max' }
    }],
    handler: function() {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'time' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all', {
    text: '选择区域',
    attr: { value: 'choose', data: 'AREA' }
  }]).click(function() {
    if ('choose' === $(this).val()) {
      $('.areapanel').show();
      $areapanel.customStationPanel('show');
      return;
    }
    $('.areapanel').hide();
    $areapanel.customStationPanel('hide');
    corePage.onStatistics();
  });

  var $areapanel = tpl.Plugin.areapanel(this.$condition, { title: false, className: 'areapanel' }).on('close.station', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });
  $('.areapanel').hide();

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition(); //同步条件状态
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

/*******************累积降雨统计**********************/
var hourRainAccumulate = function() {
  var queryData;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '降水总量', data: 'sumRain', type: 'numeric', format: '0.0' },
    { title: '降水时数', data: 'sumHours', type: 'numeric' }
  ];

  // 制图排除数据
  var checkData = {
    eleItem: null, // 当前项
    data: null, // 数据
    source: null // 原数据
  }

  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      type: $stationRadios.siblings('.active').attr('data'),
      areaCode: $areapanel.customStationPanel('getCodes', 'data-area'),
      '_service_': 'hourRainAccumulate'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };


  function checkMapDataByGrid() {
    debugger
    // var eleItem = $('.tpl-map-ele').val();
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
        var colProp = cols;
        var columns = [{ title: '制图排除', data: 'checked', type: 'checkbox' }]
          .concat(colProp);

        var hot = gridHelper.initGrid('#checkData-table', columns, queryData, {
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
  var initMap = function(data) {
    var areaName = G.User.getAreaName();
    // 排除数据
    var mapData = [];
    data.forEach(function(item) {
      if (item.checked) return;
      mapData.push(item);
    });
    corePage.Map = corePage.map({
      title: areaName + '雨量分布图',
      subtitle: corePage.qCondition.get().startTimeStr + '至' + corePage.qCondition.get().endTimeStr,
      style: { type: 'auto', option: { colorType: 'c' } },
      meteoType: 'PRE',
      dataSchema: { value: 'sumRain' },
    }, mapData);
  };
  var initSurfer = function(data) {
    corePage.Surfer = corePage.surfer({
      surfer: { fillColor: 'PRE' },
      toolbar: { color: true, contour: false },
      dataSchema: { value: 'sumRain' }
    }, data);
  };
  var display = function(data) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    switch (displayType) {
      case 'grid':
        initGrid(data);
        break;
      case 'map':

        // 添加站点排除按钮
        $('<button id="map-data-check" class="map-ctrl tpl-btn btn-success">数据排除</button>').on('click', function(event) {
          checkMapDataByGrid();
        }).appendTo(corePage.$toolbar);
        initMap(data);
        break;
      case 'surfer':
        initSurfer(data);
        break;
    }
    if (data.length === 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'time' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all', {
    text: '选择区域',
    attr: { value: 'choose', data: 'AREA' }
  }]).click(function() {
    if ('choose' === $(this).val()) {
      $('.areapanel').show();
      $areapanel.customStationPanel('show');
      return;
    }
    $('.areapanel').hide();
    $areapanel.customStationPanel('hide');
    corePage.onStatistics();
  });

  var $areapanel = tpl.Plugin.areapanel(this.$condition, { title: false, className: 'areapanel' }).on('close.station', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });
  $('.areapanel').hide();

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'map', 'surfer']).click(function(event) {
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
  $display.siblings('.active').removeClass('active').click();
};

/********************过程降雨********************/
var hourRainSequence = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '开始时间', data: 'startTime' },
    { title: '结束时间', data: 'endTime' },
    { title: '持续时数', data: 'sumHours', type: 'numeric' },
    { title: '降水总量', data: 'sumRain', type: 'numeric', format: '0.0' }
  ];
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      type: $stationRadios.siblings('.active').attr('data'),
      areaCode: $areapanel.customStationPanel('getCodes', 'data-area'),
      '_service_': 'hourRainSequence'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data, { pagination: false });
  };
  var display = function(data) {
    var _data = (data[queryType] || []);
    initGrid(_data);
    if (_data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  corePage.toolbar(tpl.TOOLBAR[displayType]);

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '时次',
    items: [{
      text: '逐次降水',
      attr: { value: 'hourRainSequenceResultList' }
    }, {
      text: '最大降水量',
      attr: { value: 'hourRainMaxResultList' }
    }],
    handler: function() {
      queryType = $(this).val();
      if (!corePage.qCondition.change() && queryData)
        display(queryData);
      else corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'time' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all', {
    text: '选择区域',
    attr: { value: 'choose', data: 'AREA' }
  }]).click(function() {
    if ('choose' === $(this).val()) {
      $('.areapanel').show();
      $areapanel.customStationPanel('show');
      return;
    }
    $('.areapanel').hide();
    $areapanel.customStationPanel('hide');

    corePage.onStatistics();
  });

  var $areapanel = tpl.Plugin.areapanel(this.$condition, { title: false, className: 'areapanel' }).on('close.station', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });
  $('.areapanel').hide();

  this.condition();

  function query(para) {
    tpl.ext.query('DisasterService/' + para._service_, para, function(data) {
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

  this.onStatistics(function(event) {
    event.preventDefault();
    var para = getCondition();
    var hourStep = (para.type === 'ALL' ? 5 : 30) * 24;
    var limit = (para.type === 'ALL' ? 2000 : 34) * hourStep;
    var startTime = moment(para.startTimeStr);
    var endTime = moment(para.endTimeStr);
    var pages = Math.ceil(endTime.diff(startTime, 'h') / hourStep)
    // 分页
    if (queryType === 'hourRainSequenceResultList' && pages > 1) {
      corePage.paginate({
        pages: pages,
        limit: limit
      }, function(indexes, cursors) {
        var current = cursors[0] - 1;
        var startDate = startTime.clone().add(hourStep * current + 1, 'h')
        var endDate = startTime.clone().add(hourStep * (current + 1), 'h')
        if (endDate.isAfter(endTime)) endDate = endTime
        query($.extend({}, para, {
          startTimeStr: startDate.format(tpl.FORMATTER.datetime),
          endTimeStr: endDate.format(tpl.FORMATTER.datetime)
        }))
      })
      query($.extend({}, para, {
        endTimeStr: startTime.clone().add(hourStep, 'h').format(tpl.FORMATTER.datetime)
      }))
    } else {
      corePage.paginate('destroy')
      query(para)
    }
  });
  //默认
  $typeRadios.siblings('.active').removeClass('active').click();
};

/****************************时段位次统计*******************************/
var hourRainRankTimes = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '极值', data: 'extValue', type: 'numeric', format: '0.0' },
    { title: '位次', data: 'rank', type: 'numeric' },
    { title: '历史极值', data: 'hisExtValue', type: 'numeric', format: '0.0' },
    { title: '极值日期', data: 'hisExtTimes' }
  ];
  var getCondition = function() {
    var para = {
      extStartTimeStr: $datepicker_ext.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      extEndTimeStr: $datepicker_ext.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      rankStartTimeStr: $datepicker_rank.customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      rankEndTimeStr: $datepicker_rank.customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      hour: Number($typeRadios.siblings('.active').val()),
      type: $stationRadios.siblings('.active').attr('data'),
      areaCode: $areapanel.customStationPanel('getCodes', 'data-area'),
      '_service_': 'hourRainRankTimesStatistics'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  corePage.toolbar(tpl.TOOLBAR[displayType]);

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '时长',
    items: [{
      text: '1小时',
      attr: { value: 1 }
    }, {
      text: '3小时',
      attr: { value: 3 }
    }, {
      text: '6小时',
      attr: { value: 6 }
    }, {
      text: '12小时',
      attr: { value: 12 }
    }, {
      text: '24小时',
      attr: { value: 24 }
    }],
    handler: function() {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $datepicker_ext = tpl.Plugin.datepicker(this.$condition, { title: '极值', type: 'time' });

  var $datepicker_rank = tpl.Plugin.datepicker(this.$condition, { title: '位次', type: 'time' });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all', {
    text: '选择区域',
    attr: { value: 'choose', data: 'AREA' }
  }]).click(function() {
    if ('choose' === $(this).val()) {
      $('.areapanel').show();
      $areapanel.customStationPanel('show');
      return;
    }
    $('.areapanel').hide();
    $areapanel.customStationPanel('hide');
    corePage.onStatistics();
  });

  var $areapanel = tpl.Plugin.areapanel(this.$condition, { title: false, className: 'areapanel' }).on('close.station', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });
  $('.areapanel').hide();

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

/*****************同期位次统计*************************/
var hourRainRankYears = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '极值', data: 'extValue', type: 'numeric', format: '0.0' },
    { title: '位次', data: 'rank', type: 'numeric' },
    { title: '历史极值', data: 'hisExtValue', type: 'numeric', format: '0.0' },
    { title: '极值日期', data: 'hisExtTime' }
  ];
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val()),
      hour: Number($typeRadios.siblings('.active').val()),
      type: $stationRadios.siblings('.active').attr('data'),
      areaCode: $areapanel.customStationPanel('getCodes', 'data-area'),
      '_service_': 'hourRainRankYearsStatistics'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };
  var display = function(data) {
    initGrid(data || []);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  corePage.toolbar(tpl.TOOLBAR[displayType]);

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '时长',
    items: [{
      text: '1小时',
      attr: { value: 1 }
    }, {
      text: '3小时',
      attr: { value: 3 }
    }, {
      text: '6小时',
      attr: { value: 6 }
    }, {
      text: '12小时',
      attr: { value: 12 }
    }, {
      text: '24小时',
      attr: { value: 24 }
    }],
    handler: function() {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { title: '极值', type: 'time' });

  var $year = tpl.Plugin.year(this.$condition, { type: 'history', start: 1991, end: moment().year() });

  var $stationRadios = tpl.Plugin.station(this.$condition, ['nation', 'area', 'all', {
    text: '选择区域',
    attr: { value: 'choose', data: 'AREA' }
  }]).click(function() {
    if ('choose' === $(this).val()) {
      $('.areapanel').show();
      $areapanel.customStationPanel('show');
      return;
    }
    $('.areapanel').hide();
    $areapanel.customStationPanel('hide');
    corePage.onStatistics();
  });

  var $areapanel = tpl.Plugin.areapanel(this.$condition, { title: false, className: 'areapanel' }).on('close.station', function(event) {
    event.preventDefault();
    corePage.onStatistics();
  });
  $('.areapanel').hide();

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

/****************************历年极值*********************************/
var hourRainExtYears = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  var cols = [
    { title: '年份', data: 'year' },
    { title: '极值', data: 'extValue', type: 'numeric', format: '0.0' },
    { title: '极值日期', data: 'extTimes' }
  ];
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      startYear: Number($year.find('.start').val()),
      endYear: Number($year.find('.end').val()),
      hour: Number($typeRadios.siblings('.active').val()),
      Station_Id_C: ($stationinput.customStationInput('getCode') || '*'),
      '_service_': 'hourRainExtYearsStatistics'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };
  var initChart = function(data) {
    var times = [],
      datas = [];
    data.forEach(function(item) {
      times.push(item.year);
      datas.push(item.extValue);
    });
    corePage.Chart = corePage.chart({ categories: times }, { title: { text: '降雨量' } }, [{ name: '极值', data: datas }], {
      title: { text: corePage.qCondition.get().hour + '小时雨量历年极值' },
      subtitle: { text: corePage.qCondition.get().startTimeStr + '至' + corePage.qCondition.get().endTimeStr }
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
  }).find('.tpl-station').customStationInput({
    data: corePage.StationData,
    first: 57516
  });

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '时长',
    items: [{
      text: '1小时',
      attr: { value: 1 }
    }, {
      text: '3小时',
      attr: { value: 3 }
    }, {
      text: '6小时',
      attr: { value: 6 }
    }, {
      text: '12小时',
      attr: { value: 12 }
    }, {
      text: '24小时',
      attr: { value: 24 }
    }],
    handler: function() {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { title: '极值', type: 'time' });

  var $year = tpl.Plugin.year(this.$condition, { type: 'history', start: 1991, end: moment().year() });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
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

/*******************逐时演变********************/
var hourRainChange = function() {
  var queryData;
  var displayType = 'grid';
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '时间', data: 'datetime' },
    { title: '1小时降水', data: 'r1', type: 'numeric', format: '0.0' },
    { title: '3小时降水', data: 'r3', type: 'numeric', format: '0.0' },
    { title: '6小时降水', data: 'r6', type: 'numeric', format: '0.0' },
    { title: '12小时降水', data: 'r12', type: 'numeric', format: '0.0' },
    { title: '24小时降水', data: 'r24', type: 'numeric', format: '0.0' }
  ];
  var getCondition = function() {
    var para = {
      startTimeStr: $datepicker.first().customDatePicker('getStartTime').format(tpl.FORMATTER.datetime),
      endTimeStr: $datepicker.first().customDatePicker('getEndTime').format(tpl.FORMATTER.datetime),
      Station_Id_C: $stationinput.customStationInput('getCode'),
      '_service_': 'hourRainChange'
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data, { pagination: false });
  };
  var initChart = function(data) {
    var para = corePage.qCondition.get();
    var datas = { r1: [], r3: [], r6: [], r12: [], r24: [] };
    var times = [];
    data.forEach(function(item) {
      datas.r1.push(item.r1);
      datas.r3.push(item.r3);
      datas.r6.push(item.r6);
      datas.r12.push(item.r12);
      datas.r24.push(item.r24);
      times.push(moment(item.datetime).format('HH:mm'));
    });
    corePage.Chart = corePage.chart({ categories: times }, { title: { text: '降水' } }, [
      { name: '1时降水', data: datas.r1 },
      { name: '3时降水', data: datas.r3 },
      { name: '6时降水', data: datas.r6 },
      { name: '12时降水', data: datas.r12 },
      { name: '24时降水', data: datas.r24 },
    ], {
      title: { text: '逐时演变序列图' },
      subtitle: { text: para.startTimeStr + '至' + para.endTimeStr }
    });
  };
  var display = function(data) {

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

  var $datepicker = tpl.Plugin.datepicker(this.$condition, { type: 'time' });

  var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
    title: '站点'
  }).find('.tpl-station').customStationInput({
    data: corePage.StationData,
    first: 57516
  });

  var $display = tpl.Plugin.display(this.$condition, ['grid', 'chart']).click(function(event) {
    displayType = $(this).val();
    if (!corePage.qCondition.change() && queryData)
      display(queryData);
    else corePage.onStatistics();
  });

  this.condition();

  function query(para) {
    tpl.ext.query('DisasterService/' + para['_service_'], para, function(data) {
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
  this.onStatistics(function(event) {
    corePage.toolbar(tpl.TOOLBAR[displayType]);
    event.preventDefault();
    var para = getCondition();
    var yearStep = 1;
    var startTime = moment(para.startTimeStr);
    var endTime = moment(para.endTimeStr);
    var pages = Math.ceil((endTime.diff(startTime, 'y')) / yearStep);
    // 分页
    if (pages > 1) {
      corePage.paginate({
        pages: pages,
        limit: 24 * 365
      }, function(indexes, cursors) {
        var current = cursors[0] - 1;
        var startDate = startTime.clone().add(yearStep * current, 'y').add(1, 'd')
        var endDate = startTime.clone().add(yearStep * (current + 1), 'y')
        if (endDate.isAfter(endTime)) endDate = endTime
        query($.extend({}, para, {
          startTimeStr: startDate.format(tpl.FORMATTER.datetime),
          endTimeStr: endDate.format(tpl.FORMATTER.datetime)
        }))
      })
      query($.extend({}, para, {
        endTimeStr: startTime.clone().add(yearStep, 'y').format(tpl.FORMATTER.datetime)
      }))
    } else {
      corePage.paginate('destroy')
      query(para)
    }
  }).click();
};

/**
 * 站点时间
 */
var stationTime = function() {
  var queryData;
  var station;
  var cols = [
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name', className: '' },
    { title: '建站时间', data: 'buildDate' },
    { title: '所属地区', data: 'area' }
  ];
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(cols, data);
  };
  var display = function(data) {
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
    else {
      if (!$stationinput.find('input').val()) return initGrid(queryData);
      for (var i = data.length; i--;) {
        var item = data[i];
        if (item['station_Id_C'] === station) {
          return initGrid([item]);
        }
      }
      initGrid([]);
      corePage.Alert.show('无该站点数据...');
    }
  };
  this.page();
  this.toolbar(tpl.TOOLBAR.grid);
  this.condition();

  var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
    title: '站点筛选'
  }).find('.tpl-station').on('change.station', function(event, code) {
    event.preventDefault();
    station = code;
    if (queryData) display(queryData);
    else corePage.onStatistics();
  }).on('ready.station', function(event) {
    event.preventDefault();
    $(this).find('input').attr('placeholder', '所有站');
  }).customStationInput({
    data: corePage.StationData,
    limit: 15,
    // first: 57516
  });

  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('DisasterService/hourRainStation', null, function(data) {
      if (tpl.ext.isExpectedType(data)) {
        queryData = data;
        display(data);
      } else {
        console.log(data);
        display([]);
      }
    });
  }).click();
};

/**
 * 小时雨量
 */
var hourRainSort  = function() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  // var cols = [
  //     { title: '站号', data: 'station_Id_C' },
  //     { title: '站名', data: 'station_Name' },
  //     { title: '地区', data: 'area' },
  //     { title: '极值', data: 'extValue' },
  //     { title: '极值日期', data: 'extTimes' },
  //     { title: '极值类型', data: 'type' },
  //     { title: '建站时间', data: 'buildDate' },
  //     { title: '历史排位', data: 'sort' }
  // ];
  var cols = [
    { title: '序号', data: 'index' },
    { title: '站号', data: 'station_Id_C' },
    { title: '站名', data: 'station_Name' },
    { title: '地区', data: 'area' },
    { title: '时间', data: 'datetime' },
    { title: '值', data: 'value', type: 'numeric', format: '0.0' },
  ];
  var getCondition = function() {
    var para = {
      Station_Id_C: $stationinput.customStationInput('getCode'),
      limit: Number($('.sort-index-input').val()),
      type: queryType
    };
    corePage.qCondition.set(para);
    return para;
  };
  var initGrid = function(data) {
    corePage.Grid = corePage.grid(corePage.qCondition.get().isHistory ? cols : cols.slice(0, 7), data);
  };
  var display = function(data) {
    initGrid(data);
    if (data.length == 0) corePage.Alert.show('该时段（条件）没有统计结果...');
  };

  this.page();
  this.toolbar(tpl.TOOLBAR[displayType]);

  var $typeRadios = tpl.Plugin.radiobtn(this.$condition, {
    title: '降水类型',
    items: [
      { text: '1小时', attr: { value: 'R1' } },
      { text: '3小时', attr: { value: 'R3' } },
      { text: '6小时', attr: { value: 'R6' } },
      { text: '12小时', attr: { value: 'R12' } },
      { text: '24小时', attr: { value: 'R24' } }
    ],
    handler: function(event) {
      queryType = $(this).val();
      corePage.onStatistics();
    }
  });
  var $stationinput = tpl.Plugin.customize(this.$condition, '<div class="tpl-station"></div>', {
    title: '站点'
  }).find('.tpl-station').customStationInput({
    data: corePage.StationData,
    first: 57516
  });
  tpl.Plugin.index(this.$condition, {
    title: '返回条数',
    items: [{
      title: false,
      content: 'Limit&nbsp;=&nbsp;<input class="singleTime sm sort-index-input" value="20" min="1" type="number">'
    }]
  });
  this.condition();
  this.onStatistics(function(event) {
    event.preventDefault();
    tpl.ext.query('DisasterService/hourRainSortByStation', getCondition(), function(data) {
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
