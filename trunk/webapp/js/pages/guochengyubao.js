//@ sourceURL=test.js
var corePage;

function run() {
  corePage = new tpl('格点预报').ready(function (event) {
    // 添加样式作用域
    corePage.$page.addClass('guochengyubao');
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');

    corePage.menu([
      {text: '南昌单站', value: 'm1', handler: nanchangPage},
      {text: '模式预报', value: 'm2', handler: modeForecastPage},
      {text: '阴阳历', value: 'm3', handler: calendar},
      {text: '配料法', value: 'm4', handler: nanchangPage},
      {text: 'MAPPFS', value: 'm5', handler: nanchangPage}
    ]);

  })
}

function nanchangPage() {

  this.page();

  this.$panel.html('<img src="imgs/demo/gcyb-01.png">')
}

/**
 * 模式预报
 */
function modeForecastPage() {

  this.page();

  this.toggle('condition', true);

  // noinspection JSAnnotator
  tpl.Plugin.customize(
    this.$condition,
    `<div class="cross-line">
       <div class="title colon">模式</div>
       <div class="content">
        <button class="btn radiobutton" value="CFS">CFS</button>
        <button class="btn radiobutton" value="DERF">DERF</button>
       </div>
    </div>
     <div class="cross-line">
       <div class="title colon">要素</div>
       <div class="content">
        <button class="btn radiobutton" value="降水量">降水量</button>
        <button class="btn radiobutton" value="气温">气温</button>
       </div>
    </div>
     <div class="cross-line">
       <div class="title colon">类型</div>
       <div class="content">
        <button class="btn radiobutton" value="格点">格点</button>
        <button class="btn radiobutton" value="站点">站点</button>
       </div>
    </div>
     <div class="cross-line">
       <div class="title colon">起报时间</div>
       <div class="content">
        <input type="date" class="date" value="${moment().format('YYYY-MM-DD')}">
       </div>
    </div>`,
    {title: false, className: 'cross-line__condition'}
  );

  // noinspection JSAnnotator
  tpl.Plugin.customize(
    this.$condition,
    `<div class="hourSpan-group no-indicator">${function () {
      var hourSpans = '';
      // 添加className .4 demo
      for (var i = 1; i <= 40; i++) {
        var classNameList = ['btn', 'hourSpan'];
        if (i === 26) {
          classNameList.push('modified');
        } else {
          classNameList.push('none');
        }

        // noinspection JSAnnotator
        hourSpans += `<button class="${classNameList.join(' ')}" value="${i}">${i}</button>`
      }
      return hourSpans;
    }()}
    </div>
    <div class="w center" style="padding-top: 10px;"><button class="btn btn-primary">载入数据</button></div>`,
    {title: '预报时效'}
  );

  tpl.Plugin.radiobtn(this.$condition, {
    className: '',
    title: '显示方式',
    items: [
      {text: '填值'},
      {text: '填色'},
      {text: '等值线'},
      {text: '站点'},
      {text: '白化'},
      {text: '动画'}
    ]
  });
  $('.content button').off('click').on('click',function () {
    if($(this).hasClass('active')){$(this).removeClass('active')}else {$(this).addClass('active')}
  })


}
/**
 * 阴阳历
 */

var calendar = function () {
  //初始化页面
  this.page();
  //左右结构
  this.toggle('condition', true);

  //自定义条件：公历
  tpl.Plugin.customize(
      this.$condition,
      `<div  class="condition-content-datebox" style="margin-bottom: 10px">
         <span>开始</span>：
         <input class="date" type="date" value="${moment().format('2000-01-01')}">
       </div>
       <div class="condition-content-datebox">
         <span>结束</span>：
         <input class="date" type="date" value="${moment().format('YYYY-MM-DD')}">
       </div>
    `,
      {title: '公历', className: ''}
  );
  //自定义条件：农历
  tpl.Plugin.customize(
      this.$condition,
      `<div  class="condition-content-datebox" style="margin-bottom: 10px">
         <span>开始</span>：
         <input class="date" type="date" value="${moment().format('2000-01-01')}">
       </div>
       <div class="condition-content-datebox">
         <span>结束</span>：
         <input class="date" type="date" value="${moment().format('YYYY-MM-DD')}">
       </div>
    `,
      {title: '农历', className: ''}
  );
    //自定义条件：降水过程
  tpl.Plugin.customize(
      this.$condition,
      `<div class="condition-content-station f">
          <span>站点</span>：
          <select name="station" id=""><option value="">南昌</option></select>
       </div>
       <div class="condition-content-rank f">
          <span>级别</span>：  
          <select name="station" id="">
            <option value="0.1-4.9">0.1-4.9</option>
            <option value="5.0-9.9">5.0-9.9</option>
            <option value="10.0-24.9">10.0-24.9</option>
            <option value="50.0-99.9">50.0-99.9</option>
          </select>
       </div>
       <div style="margin-top: 15px">
        <button class="btn calculator">计算</button>
       </div>`,

      {title:'降水过程',className: 'condition-process'}
  )
  //自定义条件：冷空气过程
  tpl.Plugin.customize(
      this.$condition,
      `<div class="condition-content-station f">
          <span>站点</span>：
          <select name="station" id=""><option value="">南昌</option></select>
       </div>
       <div style="margin-top: 15px">
        <button class="btn calculator">计算</button>
       </div>`,

      {title:'冷空气过程',className: 'condition-coldAir'}
  )
};
