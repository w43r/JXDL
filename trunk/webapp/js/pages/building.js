/**
 * 页面建设中
 * @author rexer
 * @date   2016-06-28
 * @return {[type]}   [description]
 */

function run() {
  new tpl('Building').ready(function() {
    var moduleIndex = 0;
    var moduleName = G.BModule.data(moduleIndex).name;
    $('#mainContent').html('<h1 style="width: 100%;margin: 10rem auto;text-align: center;">页面建设中...</h1>')
  });
}
