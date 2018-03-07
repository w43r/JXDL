//@ sourceURL=test.js
var corePage;

function run() {
  corePage = new tpl('数据浏览').ready(function (event) {
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');

    corePage.menu([
      {text: '数据浏览', value: 'm1', handler: dissPage},
      {text: '数据下载监控', value: 'm5', handler: monitorPage}
    ]);

  })
}


/**
 * 数据展示
 */
function dissPage() {
  var queryData;
  var queryType;
  var displayType = 'grid';
  this.page();

  // noinspection JSAnnotator
  var template = `<div class="content-toolbar">
   <div class="toolbar-item">
    <span class="title">模式</span>
  </div>
  <div class="toolbar-item">
    <span>时间</span>
    <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
  </div>
  <div class="toolbar-item">
    <span>时效</span>
    <select name="hourSpan">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
      <option value="9">9</option>
      <option value="10">10</option>
      <option value="11" selected>11</option>
      <option value="12">12</option>
    </select>
  </div>
  <div class="toolbar-item">
    <span>要素</span>
    <select name="element">
      <option value="pre">降水</option>
      <option value="temp">气温</option>
    </select>
  </div>
  
  <div class="toolbar-item" style="margin-left: 260px;">
    <span class="title">台站</span>
  </div>
  <div class="toolbar-item">
    <span>时间</span>
    <input type="date" class="datepicker" name="startDate" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
    <span>至</span>
    <input type="date" class="datepicker" name="endDate" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
  </div>
  <div class="toolbar-item">
    <span>要素</span>
    <select name="element">
      <option value="pre">气温距平</option>
      <option value="temp">降水距平</option>
    </select>
  </div>
</div>`;

  // noinspection JSAnnotator
  this.$panel.addClass('shujuliulan').before(template)
    .html(`<div class="image-group">
            <div class="image left ">
                <img src="imgs/demo/sjll-01.png">
                <div class="buttonBox clearfix">
                    <buton class="radiobutton right">输出GRD</buton>
                    <buton class="radiobutton right">输出TXT</buton>
                </div>
                <div class="table-grid-o" style="width: 97%"></div>
            </div>
            <div class="image right ">
                <img src="imgs/demo/sjll-02.png">    
                  <div class="buttonBox clearfix">
                    <buton class="radiobutton right">输出GRD</buton>
                    <buton class="radiobutton right">输出TXT</buton>
                  </div>
                  <div class="table-grid-t" style="width: 98%"></div>
            </div>
        </div>
        <div class="table"></div>`);
 initGrid($('.table-grid-o'),cols,raw)
  initGrid($('.table-grid-t'),cols,raw)
}
var cols = [
  {data:'name',title:'站号'},
  {data:'station',title:'站名'},
  {data:'气温',title:'气温',format:'0.0',type:"numeric"},
  {data:'气温距平',title:'气温距平',format:'0.0',type:"numeric"}
];
var raw = [
  {name:57516,'station':'沙坪坝','气温':35.2,'气温距平':30},
  {name:57511,'station':'北碚','气温':50,'气温距平':80},
  {name:57513,'station':'渝北','气温':50,'气温距平':80},
  {name:57518,'station':'巴南','气温':50,'气温距平':80},
  {name:57512,'station':'合川','气温':50,'气温距平':80},
  {name:57502,'station':'大足','气温':50,'气温距平':80},
  {name:57514,'station':'璧山','气温':50,'气温距平':80},
  {name:57505,'station':'荣昌','气温':50,'气温距平':80},
  {name:57506,'station':'永川','气温':50,'气温距平':80},
  {name:57517,'station':'江津','气温':50,'气温距平':80},
  {name:57512,'station':'湛江','气温':50,'气温距平':80},
  {name:57509,'station':'万盛','气温':50,'气温距平':80},
  {name:57518,'station':'巴南','气温':50,'气温距平':80},
  {name:57519,'station':'巴南','气温':50,'气温距平':80},
  {name:57518,'station':'南川','气温':50,'气温距平':80},
  {name:57520,'station':'长寿','气温':50,'气温距平':80},
  {name:57522,'station':'涪陵','气温':50,'气温距平':80}
];
//构建表格
function initGrid($container, cols, data) {
  var newHeight = '';
  var $grid = $('<div style="width:100%;margin-bottom: 10px"></div>');
  // 添加元素
  //$container.html('').append($grid);
  var hot = gridHelper.initGrid($container[0], cols, data);
  // // 计算高度
  newHeight = ($('.htCore tr').height() + 10) * (data.length + 1);
  $container.find('.wtHolder').height(newHeight)
}
/**
 * 数据监控
 */
function monitorPage() {

  // noinspection JSAnnotator
  this.$page.html(`<div class="gms-monitor_container h">
    <div class="gms-monitor_dash w"></div>
    <div class="gms-monitor_table f"></div>
  </div>`);

  /**
   * 刷新频率
   * @type {number}
   */
  var gmsRefreshInterval = 5 * 60000;

  /**
   * 参数配置
   */
  var gmsOptions = {
    elements: {
      'r12': 216,
      'tmax': 216,
      'tmin': 216,
      'wmax': 216,
      'w': 216,
      '2t': 216,
      'r3': 216,
      '10uv': 216,
      'rh': 216,
      'tcc': 216,
      'pph': 216
    },
    makeTime: '1612210500', //测试时间
    prvn: true

    // 定时刷新监控
  };

  var timer = null;

  function monitoring() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      gms.monitor(gmsOptions).then(monitoring).catch(monitoring);
    }, gmsRefreshInterval);
  }

  // start to tick-tock
  // gms.monitor(gmsOptions).then(monitoring).catch(monitoring);

  gms.monitor(gmsOptions);
}
