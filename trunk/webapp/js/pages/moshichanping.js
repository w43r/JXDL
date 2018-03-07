//@ sourceURL=test.js
var corePage;

function run() {
  corePage = new tpl('模式产品').ready(function (event) {
    // 添加样式作用域
    corePage.$page.addClass('moshichanping');
    corePage.StationData = null;
    corePage.Grid = null;
    corePage.Chart = null;
    corePage.Map = null;
    corePage.Alert = new tpl.Plugin.alert('.resultPanel');

    corePage.menu([
      {text: '降水', value: 'm1', handler: rainPage},
      {text: '气温', value: 'm2', handler: rainPage},
      {text: '高度场', value: 'm3', handler: rainPage},
      {text: '风场', value: 'm3', handler: rainPage},
      {text: '海温', value: 'm4', handler: rainPage},
      {text: '常用网站', value: 'm5', handler: commonURL}
    ]);

  })
}


/**
 * 降水
 */
function rainPage() {
  var queryData;
  var queryType;
  var displayType = 'grid';

  this.page();

  // 添加条件栏
  this.toggle('condition', true);
  var $results = tpl.Plugin.radiobtn(this.$condition, {
    title: '模式',
    items: [
      {text: 'DERF2.0', attr: {value: 'DERF2.0'}},
      {text: 'BCC_CSM', attr: {value: 'BCC_CSM'}},
      {text: 'CFS', attr: {value: 'CFS'}},
      {text: 'CPC-NMME', attr: {value: 'CPC-NMME'}},
      {text: 'EC', attr: {value: 'EC'}},
      {text: 'TCC', attr: {value: 'TCC'}},
      {text: 'Frontier', attr: {value: 'Frontier'}}
    ],
    handler: togglePattern
  });
  this.condition();

  // noinspection JSAnnotator
  var toolbarTemplate = `<div class="content-toolbar">
                            <div class="toolbar-item">
                              <span>预测起始日期</span>：
                              <select name="Year" id="" class="select1">
                                <option value="2018">2018</option>
                                <option value="2017">2017</option>
                                <option value="2016">2016</option>
                                <option value="2015">2015</option>
                                <option value="2014">2014</option>
                              </select>  
                              <select name="Month" class="select1" id="">
                                <option value="1">Jan</option>
                                <option value="2">Feb</option>
                                <option value="3">Mar</option>
                                <option value="4">Apr</option>
                                <option value="5">May</option>
                                <option value="6">Jun</option>
                                <option value="7">Jul</option>
                                <option value="8">Aug</option>
                                <option value="9">Sep</option>
                                <option value="10">Oct</option>
                                <option value="11">Nov</option>
                                <option value="12">Dec</option>
                              </select>
                              <select name="Days" class="select1" id="">
                                <option value="1">1st</option>
                                <option value="2" selected>6th</option>
                                <option value="3">11th</option>
                                <option value="4">16th</option>
                                <option value="5">21st</option>
                                <option value="6">26th</option>
                              </select>
                            </div>
                            <div class="toolbar-item">
                              <span>时段</span>：
                              <select name="hourSpan">
                                <option value="D1">01-10天</option>
                                <option value="D2">11-20天</option>
                                <option value="D3">21-30天</option>
                                <option value="D4">31-40天</option>
                                <option value="M1">01-30天</option>
                                <option value="M2">11-40天</option>
                              </select>
                            </div>
                            <div class="toolbar-item">
                              <span>变量</span>：
                              <select name="Elem" id="id_Elem" class="select1">
                              <option value="RP">降水距平百分率</option>
                              <option value="T2">气温距平</option>
                              <option value="RT">降水概率</option>
                              <option value="TT">气温概率</option>
                              <option value="H5">500hpa高度场</option>
                              <option value="PS">海平面气压</option>
                              <option value="W2">200hpa风场</option>
                              <option value="W7">700hpa高度场</option>
                            </select>
                            </div>
                            <div class="toolbar-item">
                              <span>范围</span>：
                              <select name="extent">
                                <option value="CN">中国</option>
                                <option value="EA">亚洲</option>
                                <option value="GL">全球</option>
                              </select>
                            </div>
                          </div>`;
   this.$panel.before(toolbarTemplate).html('<img src="imgs/demo/mscp-01.png" alt="" />');
};
/**
 * 常用网址
 * @param ev
 */
function commonURL() {
  this.page();
  let toolbarTemplate = `<div>
                            <h3>(1)国家气候中心：</h3>
                            <p>月动力延伸预报（DERF2.0）模式(逐候更新)</p>
                            <a href="http://cmdp.ncc-cma.net/pred/md_gen2.php" target="view_window">http://cmdp.ncc-cma.net/pred/md_gen2.php</a>
                            <p>海气耦合模式季节预测(BCC_CSM)模式(逐月更新，月、季都可预测)</p>
                            <a href="http://cmdp.ncc-cma.net/pred/cs2gen.php" target="view_window">http://cmdp.ncc-cma.net/pred/cs2gen.php</a>
                         </div>
                         <div>
                            <h3>(2)美国CFS：</h3>
                            <p>月预测模式（逐日更新）</p>
                            <a href="http://origin.cpc.ncep.noaa.gov/products/people/mchen/CFSv2FCST/monthly/" target="view_window">http://origin.cpc.ncep.noaa.gov/products/people/mchen/CFSv2FCST/monthly/</a>
                            <p>周滚动预测（逐日更新）</p>
                            <a href="http://origin.cpc.ncep.noaa.gov/products/people/mchen/CFSv2FCST/weekly/" target="view_window">http://origin.cpc.ncep.noaa.gov/products/people/mchen/CFSv2FCST/weekly/</a>
                            <p>季滚动预测（逐旬更新）</p>
                            <a href="http://www.cpc.ncep.noaa.gov/products/people/wwang/cfsv2fcst//" target="view_window">http://www.cpc.ncep.noaa.gov/products/people/wwang/cfsv2fcst/</a>
                         </div>
                         <div>
                            <h3>(3)CPC  NMME: </h3>
                            <p>月滚动预测（逐月更新）</p>
                            <a href="http://www.cpc.ncep.noaa.gov/products/NMME/monanom.shtml" target="view_window">http://www.cpc.ncep.noaa.gov/products/NMME/monanom.shtml</a>
                            <p>季滚动预测（逐月更新）</p>
                            <a href="http://www.cpc.ncep.noaa.gov/products/NMME/seasanom.shtml" target="view_window">http://www.cpc.ncep.noaa.gov/products/NMME/seasanom.shtml</a>
                         </div>
                         <div>
                            <h3>(4)欧洲中心EC: </h3>
                            <p>逐周预报（4天更新一次）</p>
                            <a href="http://10.1.64.146/npt/product/iframe/50331" target="view_window">http://10.1.64.146/npt/product/iframe/50331(外网无法访问)</a>
                            <p>季节预测（逐月更新）</p>
                            <a href="https://www.ecmwf.int/en/forecasts/charts/catalogue/?time=2017050100,3648,2017093000&area=East%20Asia&forecast_type_and_skill_measures=tercile%20summary" target="view_window">https://www.ecmwf.int/en/forecasts/charts/catalogue/?time=2017050100,3648,2017093000&area=East%20Asia&forecast_type_and_skill_measures=tercile%20summary</a>
                         </div>
                         <div>
                            <h3>(5)日本TCC:  </h3>
                            <p>周滚动预测 （逐周更新，每周五更新）</p>
                            <a href="http://ds.data.jma.go.jp/tcc/tcc/products/model/map/1mE/map1/zpcmap.html" target="view_window">http://ds.data.jma.go.jp/tcc/tcc/products/model/map/1mE/map1/zpcmap.html</a>
                            <p>月、季滚动预测（逐月更新）</p>
                            <a href="http://ds.data.jma.go.jp/tcc/tcc/products/model/map/4mE/map1/zpcmap.html" target="view_window">http://ds.data.jma.go.jp/tcc/tcc/products/model/map/4mE/map1/zpcmap.html</a>
                            <p>Frontier季预测（逐月更新）</p>
                            <a href="http://www.jamstec.go.jp/frsgc/research/d1/iod/e/index.html" target="view_window">http://www.jamstec.go.jp/frsgc/research/d1/iod/e/index.html</a>
                         </div>`
  this.$panel.addClass('commonURL').append(toolbarTemplate);
}
var togglePattern = function (ev) {
  var target = $(ev.target).text();
  switch (target)
  {
    case 'DERF2.0':
 let toolbarTemplate1 =  `<div class="toolbar-item">
                            <span>预测起始日期</span>：
                            <select name="Year" id="" class="select1">
                                <option value="2018">2018</option>
                                <option value="2017">2017</option>
                                <option value="2016">2016</option>
                                <option value="2015">2015</option>
                                <option value="2014">2014</option>
                              </select>  
                              <select name="Month" class="select1" id="">
                                <option value="01">Jan</option>
                                <option value="02">Feb</option>
                                <option value="03">Mar</option>
                                <option value="04">Apr</option>
                                <option value="05">May</option>
                                <option value="06">Jun</option>
                                <option value="07">Jul</option>
                                <option value="08">Aug</option>
                                <option value="09">Sep</option>
                                <option value="10">Oct</option>
                                <option value="11">Nov</option>
                                <option value="12">Dec</option>
                              </select>
                              <select name="Days" class="select1" id="">
                                <option value="01">1st</option>
                                <option value="02">6th</option>
                                <option value="03">11th</option>
                                <option value="04">16th</option>
                                <option value="05">21st</option>
                                <option value="06">26th</option>
                              </select>
                          </div>
                          <div class="toolbar-item frame">
                            <span>时段</span>：
                            <select name="hourSpan">
                                <option value="D1">01-10天</option>
                                <option value="D2">11-20天</option>
                                <option value="D3">21-30天</option>
                                <option value="D4">31-40天</option>
                                <option value="M1">01-30天</option>
                                <option value="M2">11-40天</option>
                              </select>
                          </div>
                          <div class="toolbar-item">
                            <span>变量</span>：
                            <select name="Elem" id="id_Elem" class="select1">
                              <option value="rpd">降水距平百分率</option>
                              <option value="t2d">气温距平</option>
                              <option value="h2d">500hpa高度场</option>
                              <option value="w2d">200hpa风场</option>
                              <option value="h7d">700hpa高度场</option>
                            </select>
                          </div>
                          <div class="toolbar-item">
                            <span>范围</span>：
                           <select name="extent">
                                <option value="CN">中国</option>
                                <option value="EA">亚洲</option>
                                <option value="GL">全球</option>
                           </select>`;
      corePage.$panel.siblings().html('').html(toolbarTemplate1).siblings().html('').html('<img src="imgs/demo/mscp-01.png" alt="" />');
  // layer.alert('QQ是个大美女',{icon:1,skin: 'layer-ext-moon'});
      $('.frame select').on('change',function () {
        console.log('时段')
      })
      break;
    case 'BCC_CSM':
 let toolbarTemplate2 =     `<div class="toolbar-item">
                                <span>开始时间</span>：
                                <input type="date" class="datepicker" name="date" value="${moment().format('YYYY-MM-DD')}" style="width:140px">
                             </div>
                             <div class="toolbar-item area">
                                <span>区域</span>：
                                <select name="extent">
                                  <option value="CN">中国</option>
                                  <option value="EA">亚洲</option>
                                  <option value="GL">全球</option>
                                </select>
                             </div>
                             <div class="toolbar-item">
                                 <span>提前</span>：
                                 <select name="month" id="">
                                    <option value="0">0个月</option>
                                    <option value="1">1个月</option>
                                    <option value="2">2个月</option>
                                    <option value="3">4个月</option>
                                    <option value="0">5个月</option>
                                    <option value="1">6个月</option>
                                    <option value="2">7个月</option>
                                    <option value="3">8个月</option>
                                    <option value="0">9个月</option>
                                    <option value="1">10个月</option>
                                    <option value="2">11个月</option>
                                    <option value="3">12个月</option>
                                 </select>
                             </div>
                             <button class="radiobutton" value="month">月(一个月)</button>
                             &nbsp;&nbsp;
                             <button class="radiobutton" value="period">季(三个月)</button>`;
      corePage.$panel.siblings().html('').html(toolbarTemplate2).siblings().html('').html('<img src="imgs/demo/mscp-02.png" alt="" />');
        let a = {date:'20180101', frame:'D1',value:'rpd',range:'CN'}
      $('.area select').on('change',function () {

      })
      $.post('/JXDynamicService/services/Area/tt',{para:JSON.stringify(a)}).done(function (data) {
        console.log(data)
      })
      break;
    case 'CFS':
 let toolbarTemplate3 = `<div class="toolbar-item">
                            <span>预测模式</span>：   
                            <select name="predicted" id="">
                                <option value="month">月预测模式</option>
                                <option value="period">季滚动预测</option>
                                <option value="week">周滚动预测</option>
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>时间</span>：
                            <select name="date" id="">
                                <option value="">2017-09-01</option>
                                <option value="">2017-09-02</option>
                                <option value="">2017-09-03</option>
                                <option value="">2017-09-04</option>
                            </select>
                         </div>`
      corePage.$panel.siblings().html('').html(toolbarTemplate3).siblings().html('').html('<img src="imgs/demo/mscp-03.png" alt="" />');
      break;
    case 'CPC-NMME':
 let  toolbarTemplate4 = `<div class="toolbar-item">
                            <span>预测模式</span>：   
                            <select name="predicted" id="">
                                <option value="month">月滚动预测</option>
                                <option value="season">季滚动预测</option>
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>时间</span>：
                            <select name="date" id="dateSelect">
                                <option value="1">Lead 1</option>
                                <option value="2">Lead 2</option>
                                <option value="3">Lead 3</option>
                                <option value="4">Lead 4</option>
                            </select>
                         </div>`
      corePage.$panel.siblings().html('').html(toolbarTemplate4).siblings().html('').html('<img src="imgs/demo/mscp-04.png" alt="" />' +
                                                                                          '<img src="imgs/demo/mscp-04.png" alt="" />');
      $("select[name=predicted]").on('change',function () {
        if($(this).find('option:selected').val() == 'month'){
          $("select[name=date]").html('').html(`  <option value="1">Lead 1</option>
                                                  <option value="2">Lead 2</option>
                                                  <option value="3">Lead 3</option>
                                                  <option value="4">Lead 4</option>`)
        }else {
          $("select[name=date]").html('').html(`  <option value="1">Season 1</option>
                                                  <option value="2">Season 2</option>
                                                  <option value="3">Season 3</option>
                                                  <option value="4">Season 4</option>`)
        }

      })
      break;
    case 'EC':
let  toolbarTemplate5 = `<div class="toolbar-item">
                            <span>预测模式</span>：   
                            <select name="predicted" id="">
                                <option value="week">周预测</option>
                                <option value="period">季节预测</option>
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>起始时间</span>：
                            <select name="date" id="">
                                <option value="2017-06">2017-06</option>
                                <option value="2017-07">2017-07</option>
                                <option value="2017-08">2017-08</option>
                             
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>预测季节</span>：
                            <select name="" id="">
                                <option value="D1">未来1-3月</option>
                                <option value="D2">未来2-4月</option>
                                <option value="D3">未来3-5月</option>
                                <option value="D4">未来4-6月</option>
                            </select>
                        </div>`
      corePage.$panel.siblings().html('').html(toolbarTemplate5).siblings().html('').html('<img src="imgs/demo/mscp-04.png" alt="" />');
      break;
    case 'TCC':
let  toolbarTemplate6 = `<div class="toolbar-item">
                           
                            <select name="predicted" id="">
                                <option value="week">周滚动预测</option>
                                <option value="month">月滚动预测</option>
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>起始时间</span>：
                            <select name="date" id="">
                                <option value="2018-02-01">2018-02-01</option>
                                <option value="2018-02-08">2018-02-08</option>
                                <option value="2018-02-15">2018-02-15</option>
                                <option value="2018-02-22">2018-02-22</option>
                            </select>
                            <span>预测时段</span>：
                            <select name="" id="">
                              <option value="W1">第一周</option>
                              <option value="W2">第二周</option>
                              <option value="W3">第三四周</option>
                            <option value="W4">28天平均</option>
</select>
                         </div>`
      corePage.$panel.siblings().html('').html(toolbarTemplate6).siblings().html('').html('<img src="imgs/demo/mscp-04.png" alt="" />' +
          '<img src="imgs/demo/mscp-04.png" alt="" />');
      break;
    case 'Frontier':
let  toolbarTemplate7 = `<div class="toolbar-item">
                            <span>起始时间</span>：   
                            <select name="" id="">
                                <option value="2017-06">2017-06</option>
                                <option value="2017-07">2017-07</option>
                                <option value="2017-08">2017-08</option>
                                <option value="2017-09">2017-09</option>
                            </select>
                         </div>
                         <div class="toolbar-item">
                            <span>预测时段</span>：
                            <select name="date" id="">
                                <option value="W1">未来1-3月</option>
                                <option value="W2">未来2-4月</option>
                                <option value="W3">未来3-5月</option>
                            </select>
                         </div>`
      corePage.$panel.siblings().html('').html(toolbarTemplate7).siblings().html('').html('<img src="imgs/demo/mscp-04.png" alt="" />' +
          '<img src="imgs/demo/mscp-04.png" alt="" />');
      break;
    default:
    layer.alert('QQ是个大美女',{icon:2,skin: '数据出错，请联系管理员'});
    break;
  }

};
