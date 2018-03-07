/**
 * const
 * @author rexer
 * @date   2016-07-01
 */
tpl.CONST = {};

/**
 * 时间格式
 * @type {Object}
 */
tpl.FORMATTER = {
  date: 'YYYY-MM-DD',
  dateCN: 'YYYY年MM月DD日',
  time: 'HH:mm:ss',
  hour: 'YYYY-MM-DD HH:00',
  hourCN: 'YYYY年MM月DD日HH时',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  datetimeCN: 'YYYY年MM月DD日 HH:mm:ss'
};

/**
 * 预定义工具栏
 * @type {Object}
 * @requires corePage{tpl}
 */
tpl.TOOLBAR = {
  grid: [{
    title: '保存',
    items: [{
      text: 'Excel',
      handler: function(event) {
        var tableUtil = new Handsontable.addon.Util(corePage.Grid);
        var auth = G.User.getAuthority();
        if (!auth.D && auth.B) {
          $.post(G.URL.getDataService() + 'CommonService/getStationsByUser', null, function(filterValue) {
            var filterKey = '站号';
            var getIndex = function(header) {
              for (var i = 0; i < header.length; i++) {
                if (filterKey === header[i]) return i;
              }
            };
            tableUtil.exportToExcel(function(data, header) {
              var result = [];
              var filterIndex = getIndex(header);
              var expr = new RegExp('^' + filterValue.replace(/\,/g, '$|^') + '$');
              data.forEach(function(item, i) {
                if (expr.test(item[filterIndex])) result.push(item);
              });
              return result;
            });
          });
        } else {
          tableUtil.exportToExcel();
        }
      }
    }],
  }],
  chart: [{
    title: '保存',
    items: [
      { text: '图片', attr: { 'data-type': 'image/png' } },
      { text: 'SVG', attr: { 'data-type': 'image/svg+xml' } }
    ],
    handler: function(event) {
      var mimeType = $(this).attr('data-type');
      corePage.Chart.export(mimeType);
    }
  }],
  map: [{
      title: '保存',
      items: [{
        text: '图片',
        handler: function(event) {
          corePage.Map.exportToImage();
        }
      }]
    }
    // ,{
    //     title: '编辑',
    //     items: [{
    //         text: '数据排除',
    //         handler: function() {
    //             // var colProp = corePage.Grid.getHeaders()
    //             // var editGridPanel = tpl.EditGridPanel(0);
    //             // editGridPanel.open();
    //         }
    //     }]
    // }
  ],
  surfer: []
};

/**
 * Plugin.station默认参数
 * @type {Object}
 */
tpl.PLUGIN_STATION_KEY = {
  nation: {
    text: '国家站',
    attr: { value: 'nation', data: 'AWS' }
  },
  area: {
    text: '城市站',
    attr: { value: 'area', data: 'MWS' }
  },
  all: {
    text: '全部站',
    attr: { value: 'all', data: 'ALL' }
  }
};

/**
 * 天气现象
 */
tpl.CONST.WEPS = [
  { code: '01', name: '露' },
  { code: '02', name: '霜' },
  { code: '03', name: '结冰' },
  { code: '04', name: '烟幕' },
  { code: '05', name: '霾' },
  { code: '06', name: '浮尘' },
  { code: '07', name: '扬沙' },
  { code: '08', name: '尘卷风' },
  { code: '10', name: '轻雾' },
  { code: '13', name: '闪电' },
  { code: '14', name: '极光' },
  { code: '15', name: '大风' },
  { code: '16', name: '积雪' },
  { code: '17', name: '雷暴' },
  { code: '18', name: '飑' },
  { code: '19', name: '龙卷' },
  { code: '31', name: '沙尘暴' },
  { code: '38', name: '吹雪' },
  { code: '39', name: '雪暴' },
  { code: '42', name: '雾' },
  { code: '48', name: '雾凇' },
  { code: '50', name: '毛毛雨' },
  { code: '56', name: '雨凇' },
  { code: '60', name: '雨' },
  { code: '68', name: '雨夹雪' },
  { code: '70', name: '雪' },
  { code: '76', name: '冰针' },
  { code: '77', name: '米雪' },
  { code: '79', name: '冰粒' },
  { code: '80', name: '阵雨' },
  { code: '83', name: '阵性雨夹雪' },
  { code: '85', name: '阵雪' },
  { code: '87', name: '霰' },
  { code: '89', name: '冰雹' }
];


tpl.CONST.WINDS = [
  { name: '无风', speed: '0~0.2 小于1', desc: '静，烟直上。', sea: '平静如镜' },
  { name: '软风', speed: '0.3~1.5 1~5', desc: '烟能表示风向，但风向标不能转动。', sea: '微浪' },
  { name: '轻风', speed: '1.6~3.3 6~11 ', desc: '人面感觉有风，树叶有微响，风向标能转动。', sea: '小浪' },
  { name: '微风', speed: '3.4~5.4 12~19', desc: '树叶及微枝摆动不息，旗帜展开。', sea: '小浪' },
  { name: '和风', speed: '5.5~7.9 20~28', desc: '吹起地面灰尘纸张和地上的树叶，树的小枝微动。', sea: '轻浪' },
  { name: '清劲风', speed: ' 8.0~10.7  29~38', desc: '有叶的小树枝摇摆，内陆水面有小波。', sea: '中浪' },
  { name: '强风', speed: '10.8~13.8 39~49', desc: '大树枝摆动，电线呼呼有声，举伞困难。', sea: '大浪' },
  { name: '疾风', speed: '13.9~17.1 50~61', desc: '全树摇动，迎风步行感觉不便。', sea: '巨浪' },
  { name: '大风', speed: '17.2~20.7 62~74', desc: '微枝折毁，人向前行感觉阻力甚大', sea: '猛浪' },
  { name: '烈风', speed: '20.8~24.4 75~88', desc: '建筑物有损坏（烟囱顶部及屋顶瓦片移动）', sea: '狂涛' },
  { name: '狂风', speed: '24.5~28.4 89~102', desc: '陆上少见，见时可使树木拔起将建筑物损坏严重', sea: '狂涛' },
  { name: '暴风', speed: '28.5~32.6 103~117', desc: '陆上很少，有则必有重大损毁', sea: '风暴潮' },
  { name: '台风，又名“飓风”', speed: '32.6~36.9 118~133', desc: '陆上绝少，其摧毁力极大', sea: '风暴潮' },
  { name: '台风', speed: '37.0~41.4 134~149', desc: '陆上绝少，其摧毁力极大', sea: '海啸' },
  { name: '强台风', speed: '41.5~46.1 150~166', desc: '陆上绝少，其摧毁力极大', sea: '海啸' },
  { name: '强台风', speed: '46.2~50.9 167~183', desc: '陆上绝少，其摧毁力极大', sea: '海啸' },
  { name: '超强台风', speed: '51.0~56.0 184~202', desc: '陆上绝少，范围较大，强度较强，摧毁力极大', sea: '大海啸' },
  { name: '超强台风', speed: '≥56.1 ≥203', desc: '陆上绝少，范围最大，强度最强，摧毁力超级大', sea: '特大海啸' },
];
