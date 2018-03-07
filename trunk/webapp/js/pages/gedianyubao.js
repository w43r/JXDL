var corePage;

function run() {
  corePage = new tpl('格点预报').ready(function (event) {
    // 添加样式作用域
    corePage.$page.addClass('gedianyubao');
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');

    corePage.menu([
      {text: 'DERF', value: 'm1', handler: derfPage},
      {text: 'CFS', value: 'm2', handler: cfsPage}
    ]);

  })
}

function derfPage() {

  this.page();

  // 添加条件栏
  this.toggle('condition', true);

  // noinspection JSAnnotator
  tpl.Plugin.customize(
    this.$condition,
    `<select>
      <option value="0">00时</option>
    </select>
    <input class="date" type="date" value="${moment().format('YYYY-MM-DD')}">`,
    {title: '制作时间', className: 'makeTime__condition'}
  );

  // noinspection JSAnnotator
  tpl.Plugin.customize(
    this.$condition,
    `<div class="hourSpan-group">${function () {
      var hourSpans = '';
      // 添加className .4 demo
      for (var i = 1; i <= 40; i++) {
        var classNameList = ['btn', 'hourSpan'];
        if (i <= 24) {
          classNameList.push('modified');
        } else if (i === 25) {
          classNameList.push('opened');
        } else if (i <= 29) {
          classNameList.push('submitted');
        } else {
          classNameList.push('none')
        }

        // noinspection JSAnnotator
        hourSpans += `<button class="${classNameList.join(' ')}" value="${i}">${i}</button>`;
      }
      return hourSpans;
    }()}
     <div class="indicator">
       <i class="opened">已打开</i>
       <i class="modified">已修改</i>
       <i class="submitted">已提交</i>
       <i class="none">无数据</i>
     </div>
    </div>`,
    {title: '制作时间'}
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

  tpl.Plugin.radiobtn(this.$condition, {
    className: '',
    title: '操作',
    items: [
      {text: '历史订正场'},
      {text: '提交'}
    ]
  });


}


function cfsPage() {
  this.page();
}
