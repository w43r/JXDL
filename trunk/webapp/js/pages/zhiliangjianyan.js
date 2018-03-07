/**
 * Created by lenovo on 2018/1/30.
 */
var corePage;

function run() {
  corePage = new tpl('数据浏览').ready(initPage)
}
var initPage = function () {
  //页面初始化
  this.page();
  // 添加条件栏
  this.toggle('condition', true);

  //自定义条件：时段
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
      {title: '时段', className: 'f'}
  );

   //自定义条件：站点
  var $stationpanel = tpl.Plugin.stationpanel(this.$condition, {first: false, single: false});


  //自定义条件：预报对象
  tpl.Plugin.radiobtn(this.$condition, {
    className: 'f',
    title: '预报对象',
    items: [
      {text: '降水量'},
      {text: '气温'}
    ]
  });

  //自定义条件：检验方法
  tpl.Plugin.radiobtn(this.$condition, {
    className: 'f',
    title: '检验方法',
    items: [
      {text: 'Ps评分',value:'Ps评分'},
      {text: 'Pg评分',value:'Pg评分'},
      {text: 'Pc评分',value:'Pc评分'},
      {text: 'MSSS评分',value:'MSSS评分'},
      {text: 'ACC评分',value:'ACC评分'}
    ]
  });
  this.condition();
  //结果页面this.$panel
  let template = `<div class="content-toolbar" style="display: block;height: 32px">
                       <button class="radiobutton right" style="margin-right: 100px">配料法</button>
                       <button class="radiobutton right">R方程</button>
                       <button class="radiobutton right" ">EFO迭代</button>
                  </div>
                 `;

  let resulpanel = `<img src="imgs/demo/jsyy-08.png" class="image" alt="">
                    <img src="imgs/demo/jsyy-09.png" class="image" alt="">  
                    `;
  this.$panel.addClass('quality').before(template).html(resulpanel);

};

