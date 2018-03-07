/**
 * Created by lenovo on 2018/1/26.
 */
var corePage;

function run() {
  corePage = new tpl('解释应用').ready(function (event) {
   
    corePage.menu([
      {text: 'FODAS', value: 'm1',handler:FODAS},
      {text: 'MODES', value: 'm2',handler:MODES},
      {text: 'EFO迭代', value: 'm3',handler:iteration},
      {text: 'R方程', value: 'm4',handler:REquation},
      {text: '配料法', value: 'm5',handler:burdening}
    ]);

  })
}
/**
 * FODAS
 * @constructor
 */
var FODAS = function () {
  this.page();
  $('#mainContent').html('<h1 style="width: 100%;margin: 10rem auto;text-align: center;">启动中...</h1>')
};
/**
 * MODES
 */
var MODES = function () {
  this.page();
  $('#mainContent').html('<h1 style="width: 100%;margin: 10rem auto;text-align: center;">启动中...</h1>')
};
/**
 * iteration EFO迭代
 */
var iteration = function () {
  this.page();
  //工具栏
  var template = '<div class="content-toolbar">' +
                    '<div class="content-toolbar-c">'+
                      '<div class="toolbar-item" style="flex: 1">' +
                          '<div>'+
                            '<span>起报时间</span>：'+
                            '<input type="date" class="datepicker" name="date" value="'+moment().format('YYYY-MM-DD')+'" style="width:140px">'+
                          '</div>'+
                      '</div>' +
                      '<div class="toolbar-item" style="flex: 1">' +
                          '<span>预测时段</span>：'+
                          '<input type="date" class="datepicker" name="date" value="'+moment().format('YYYY-MM-DD')+'" style="width:140px">'+
                      '</div>' +
                      '<div class="toolbar-item" style="flex: 1">' +
                        '<span>预报对象</span>：'+
                        '<button class="radiobutton ">降水量</button><button class="radiobutton ">气温</button>'+
                      '</div>' +
                    '</div>'+
                  '</div>';
  this.$panel.addClass('jieshiyingyong').before(template).html(
      '<div class="clearfix" style="width: 65%;margin: 5px auto">'+
          '<img src="imgs/demo/jsyy-01.png" class="image left" alt="">'+
          '<img src="imgs/demo/jsyy-02.png" class="image right" alt="">'+
      '</div>'+
      '<div class="clearfix" style="width: 65%;margin: 5px auto">' +
          '<img src="imgs/demo/jsyy-03.png" class="image left" alt="">'+
          '<img src="imgs/demo/jsyy-04.png" class="image right" alt="">'+
      '</div>' )
};
/**
 * REquation R方程
 */
var REquation = function () {
  this.page();
  var template = `<div class="content-toolbar">
                    <div class="toolbar-item">
                      <span>预测时间</span>：
                      <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
                      <button class="radiobutton ">开始计算</button>
                    </div>
                 </div>`;
  this.$panel.addClass('REquation').before(template).html(`<img src="imgs/demo/jsyy-05.png" class="images" style="margin: auto;" alt="">`)
};
/**
 * burdening 配料法
 */
var burdening = function () {
  this.page();
  var template = `<div class="content-toolbar"> 
                    <div class="toolbar-item">
                      <span>气场背景</span>：
                      <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
                      至
                      <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
                    </div>
                    <div class="toolbar-item" style="margin-left: 130px">
                      <span>预测时间</span>：
                      <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
                      <button class="radiobutton ">开始计算</button>
                    </div>
                  </div>`
  this.$panel.addClass('burdening').before(template).html(`<div class="burdening-content clearfix">
                                                              <img src="imgs/demo/jsyy-06.png" class="images left" alt="">
                                                              <img src="imgs/demo/jsyy-06.png" class="images right" alt="">
                                                           </div>
                                                           <div class="burdening-content clearfix">
                                                              <img src="imgs/demo/jsyy-07.png" class="images left" alt="">
                                                              <img src="imgs/demo/jsyy-07.png" class="images right" alt="">
                                                           </div>
  
  
  `)
};