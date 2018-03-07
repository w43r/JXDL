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
        var Alert = new tpl.Plugin.alert('#mainContent').show('页面建设中...', 'info');
        var loader = new tpl.Plugin.loader('#mainContent').show('即将跳转至<i>' + moduleName + '</i>');
        setTimeout(function() {
            Alert.remove(true);
            loader.destroy();
            G.BModule.active(moduleIndex);
        }, 3000);
    });
}
