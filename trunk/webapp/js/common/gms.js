/**
 * 数据监控
 *
 */
~function (request) {

  var Status = {
    warning: false, // 数据异常
    error: false, // 请求失败
    makeTime: null, // 制作时间
    updateTime: null // 更新时间
  };

  var gms = Object.create(null);

  /**
   * 获取监控数据
   *
   * @param param
   * @returns {Promise}
   */
  gms.getData = function (param) {

    var timeStr = param.makeTime; // 1612210500

    Status.makeTime = new Date('20' + timeStr.substr(0, 2) + '-' + timeStr.substr(2, 2) + '-' + timeStr.substr(4, 2) + ' ' + timeStr.substr(6, 2) + ':00:00');

    return request.post(gms.options.api, param || gms.param).then(function (_ref) {
      var errcode = _ref.errcode,
          message = _ref.message,
          data = _ref.data;

      if (errcode !== 0) {
        throw new Error(message);
      }
      if (!request.isPretty(data)) {
        throw new Error('暂无数据');
      }

      console.log('GMS: Monitoring=%o', data);

      var alias = message.alias || {};

      Status.updateTime = new Date();

      return { data: data, alias: alias };
    }).catch(function (error) {
      Status.updateTime = new Date();

      console.error(error);
    });
  };

  /**
   * 初始化仪表盘
   */
  gms.initDash = function (Status) {
    var container = document.querySelector(gms.options.dash);

    // 清空
    container.innerHTML = '';

    function setCard(icon, content, theme) {
      var card = document.createElement('div');
      card.className = 'card card-' + (theme || 'primary');

      var cardIcon = document.createElement('div');
      cardIcon.className = 'card-icon';
      cardIcon.innerHTML = '<i class="' + icon + '"></i>';

      var cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      cardContent.innerHTML = '<div class="main">' + content + '</div>';

      var refresh = document.createElement('i');
      refresh.className = 'refresh iconfont icon-refresh';
      // event
      cardContent.appendChild(refresh);

      card.appendChild(cardIcon);
      card.appendChild(cardContent);

      return card;
    }

    var makeTime = Status.makeTime,
        updateTime = Status.updateTime,
        warning = Status.warning,
        error = Status.error;


    var msgInfo = null;
    var msgDanger = null;
    var msgUpdate = ['更新时间', updateTime.toLocaleDateString().replace(/\D/g, '-') + ' ' + updateTime.toTimeString().substr(0, 8)].join('<br>');

    if (error) {
      msgInfo = msgDanger = '无数据';
    } else {
      msgInfo = ['网格制作：' + makeTime.toLocaleDateString().replace(/\D/g, '-') + ' ' + makeTime.toTimeString().substr(0, 5), '是否异常：' + (warning ? '是' : '否')].join('<br>');
      msgDanger = ['融合结果：' + '已融合', '城镇报：' + '已完成'].join('<br>');
    }

    container.appendChild(setCard('iconfont icon-global', msgInfo, 'info'));
    container.appendChild(setCard('iconfont icon-fengche', msgDanger, 'danger'));
    container.appendChild(setCard('iconfont icon-time', msgUpdate, 'success'));
  };

  /**
   * 初始化表格
   */
  gms.initGrid = function (data, alias) {

    var elementAlias = alias ? alias.elements : {};

    // 表头
    var colProps = gms.param.prvn ? [{ title: '要素', data: 'element' }, { title: '预报', data: 'prvn_r' }, { title: '首席', data: 'prvn_p' }, { title: '中央台', data: 'bj_p', hourSpan: true }, { title: 'GRAPES', data: 'gp_p', hourSpan: true }, { title: '欧洲细网格', data: 'ec_p', hourSpan: true }, { title: 'T639', data: 't639_p', hourSpan: true }, { title: '日本', data: 'japan_p', hourSpan: true }] : [{ title: '要素', data: 'element' }, { title: '预报', data: 'cty_p' }, { title: '省台', data: 'prvn_p' }, { title: '中央台', data: 'bj_p', hourSpan: true }, { title: 'GRAPES', data: 'gp_p', hourSpan: true }, { title: '欧洲细网格', data: 'ec_p', hourSpan: true }, { title: 'T639', data: 't639_p', hourSpan: true }, { title: '日本', data: 'japan_p', hourSpan: true }];

    /**
     * 格式化时间
     * 'yyMMddHH00' --> 'yyyy/MM/dd HH:00'
     * @param dateStr
     */
    function dateFormat(dateStr) {
      return ['20' + dateStr.substr(0, 2), dateStr.substr(2, 2), dateStr.substr(4, 2)].join('/') + ' ' + dateStr.substr(6, 2) + ':00';
    }

    function findColIndex(col) {
      for (var i = 0; i < colProps.length; i++) {
        if (col === colProps[i].data) return i;
      }
    }

    function renderer(colData, colProp) {
      var value = colData.value,
          hourSpan = colData.hourSpan;

      var key = colProp.data;
      var td = document.createElement('td');
      td.setAttribute('data-index', key);
      var data = null;
      // 要素列
      if (key === 'element') {
        data = elementAlias[colData];
      }
      // 数据列
      else {
          // 无数据
          if (!value) {
            td.className = 'warning';
            Status.warning = true; // 标记
            data = value;
          }
          if (colProp.hourSpan) {
            if (value > 0) {
              data = dateFormat(value + '') + ' ' + hourSpan;
            } else {
              data = '无';
            }
          } else {
            data = colData.value;
          }
        }

      td.innerText = data;

      return td;
    }

    var container = document.querySelector(gms.options.table);
    var table = document.createElement('table');

    // 清空
    container.innerHTML = '';

    // 设置列属性
    table.innerHTML = '<col width="50px" />';

    // 创建表头
    var header = document.createElement('tr');
    header.appendChild(document.createElement('th')); // 索引列
    colProps.forEach(function (_ref2) {
      var title = _ref2.title,
          data = _ref2.data;

      var th = document.createElement('th');
      th.setAttribute('data-key', data);
      th.innerText = title;
      header.appendChild(th);
    });
    table.appendChild(header);

    // table-body 渲染数据
    data.forEach(function (rowData, index) {
      var row = document.createElement('tr');
      row.setAttribute('data-index', index);
      // 索引列
      var indexCol = document.createElement('td');
      indexCol.innerText = index + 1;

      var cols = [indexCol];
      for (var key in rowData) {
        var dataIndex = findColIndex(key);
        var colProp = colProps[dataIndex];
        var colIndex = dataIndex + 1;
        var colData = rowData[key];
        cols[colIndex] = renderer(colData, colProp);
      }
      cols.forEach(function (col) {
        return row.appendChild(col);
      });

      table.appendChild(row);
    });

    // 设置table尺寸
    var cellHeight = gms.options.cellHeight;
    table.style.height = cellHeight * (data.length + 1) + 'px';

    // append
    container.appendChild(table);

    // 暂无数据
    if (data.length === 0) {
      var noData = document.createElement('div');
      noData.className = 'noData';
      noData.innerHTML = '暂无监控数据';
      container.appendChild(noData);
    }
  };

  gms.monitor = function (param) {
    if (param) gms.param = param;

    if (!gms.param.makeTime) {
      // 根据当前时间设置监控的制作时间
      var now = new Date();
      var hour = now.getHours();
      var makeTime = now.toISOString().replace(/\D/g, '').substr(2, 6);
      if (hour > 16) {
        makeTime += '0500';
      } else {
        makeTime += '1600';
      }
      gms.param.makeTime = makeTime;
    }

    return gms.getData(gms.param).then(function (_ref3) {
      var data = _ref3.data,
          alias = _ref3.alias;

      gms.initGrid(data, alias);
      gms.initDash(Status);
    }).catch(function (error) {
      Status.error = true;
      gms.initGrid([]);
      gms.initDash(Status);
      alert('无监控数据，请重试');
    });
  };

  /**
   * 默认参数
   */
  gms.param = {
    elements: {
      'r12': 240,
      'tmax': 240,
      'tmin': 240,
      'wmax': 240,
      'w': 240,
      '2t': 240,
      'r3': 240,
      '10uv': 240,
      'rh': 240,
      'tcc': 240,
      'pph': 240
    },
    makeTime: null,
    prvn: true

    // 默认设置
  };gms.options = {
    api: '/gms/service/monitor', // 接口地址
    table: '.gms-monitor_table', // 表格container
    dash: '.gms-monitor_dash', // 仪表盘container
    cellHeight: 30 // 表格单元格高度


    // exports
  };window.gms = gms;
}(request);