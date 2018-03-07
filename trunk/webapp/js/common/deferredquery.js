/**
 * 多请求延时处理
 * @author rexer
 * @date   2016-11-02
 */

function DeferredQuery() {
    /**
     * 请求队列
     * @type {Array}
     */
    var XHRS = [];

    /**
     * 预定义回调
     * @type {Object}
     */
    var HOOKS = {};

    /**
     * 清空请求队列
     */
    this.clearQuery = function() {
        XHRS = [];
        return this;
    };
    /**
     * 添加请求
     * @param  {String}   url  地址
     * @param  {Object}   para 	   参数
     */
    this.addQuery = function(url, para) {
        XHRS.push($.post(url, G.paramize(para)));
        return this;
    };
    this.addHook = function(hookType, handler) {
        HOOKS[hookType] = handler;
        return this;
    };
    this.offHook = function(hookType) {
        delete HOOKS[hookType];
        return this;
    };
    /**
     * 请求
     * @param  {Function}   success 成功
     * @return {Deferred}
     */
    this.query = function(success) {
        var reqSize = XHRS.length;
        if (reqSize === 0) return false;
        return $.when.apply($, XHRS).done(function() {
            // 取出数据
            var data = [];
            var results = Array.prototype.slice.call(arguments);
            if (reqSize === 1) {
                data = results;
            } else {
                results.forEach(function(item) {
                    data.push(item[0]);
                });
            }
            success.apply(this, data);

            var doneHandler = HOOKS.done;
            if (typeof doneHandler === 'function') doneHandler.apply(this, results);
        }).fail(function() {
            $.each(XHRS, function() { this.abort(); });

            var failHandler = HOOKS.fail;
            if (typeof failHandler === 'function') failHandler.apply(this);
        });
    };
}
