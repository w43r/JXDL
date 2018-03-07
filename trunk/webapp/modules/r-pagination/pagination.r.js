/**
 * 分页器
 * @author rexer
 * @date   2016-08-15
 */
~ function($) {
    /**
     * Pagination
     * @param  {[type]}   $container [description]
     * @param  {[type]}   opts       [description]
     * @constructor
     */
    var Pagination = function($container, opts) {
        var current = 0;
        var pages = opts.pages;
        var limit = opts.limit;

        var limitter = function(page) {
            var prev = current;
            var error = null;
            current = page || current;
            if (current < 1 || current > pages) {
                error = new Error('R.Pagination, Out of bounds of pages: ' + current);
                current = prev;
            }
            if (pages == 1) {
                $container.find('a.first').addClass('disabled');
                $container.find('a.previous').addClass('disabled');
                $container.find('a.next').addClass('disabled');
                $container.find('a.last').addClass('disabled');
                return error;
            }
            if (current == 1) {
                $container.find('a.first').addClass('disabled');
                $container.find('a.previous').addClass('disabled');
                $container.find('a.next').removeClass('disabled');
                $container.find('a.last').removeClass('disabled');
            } else if (current == pages) {
                $container.find('a.first').removeClass('disabled');
                $container.find('a.previous').removeClass('disabled');
                $container.find('a.next').addClass('disabled');
                $container.find('a.last').addClass('disabled');
            } else {
                $container.find('a.first').removeClass('disabled');
                $container.find('a.previous').removeClass('disabled');
                $container.find('a.next').removeClass('disabled');
                $container.find('a.last').removeClass('disabled');
            }
            return error;
        };
        var formatter = function() {
            return opts.format.replace(/\{page\}/g, current).replace(/\{pages\}/g, pages);
        };
        /**
         * getInstance
         */
        this.getInstance = function() {
            return this;
        };
        /**
         * 当前页
         */
        this.getPage = function() {
            return current;
        };
        /**
         * 更改设置
         * @param  {Object}   opts [description]
         */
        this.updateSetting = function(opts) {
            if (opts.hasOwnProperty('pages'))
                pages = opts.pages;
            if (opts.hasOwnProperty('limit'))
                limit = opts.limit;
            return this;
        };
        /**
         * init body
         */
        this.init = function() {
            var that = this;
            $container.empty().off().addClass('R pagination')
                .append('<input type="text"/>')
                .append('<a class="first" data-action="first">&laquo;</a>')
                .append('<a class="previous" data-action="prev">&lsaquo;</a>')
                .append('<a class="next" data-action="next">&rsaquo;</a>')
                .append('<a class="last" data-action="last">&raquo;</a>')
                .on('click', 'a', function(event) {
                    event.preventDefault();
                    var action = $(this).attr('data-action');
                    that[action]();
                }).on('change', 'input', function(event) {
                    event.preventDefault();
                    var page = Number($(this).val());
                    if (page === current) return;
                    that.goto(page);
                }).on('focus', 'input', function(event) {
                    $(this).attr('type', 'number').val(current).removeClass('disabled').select();
                }).on('blur', 'input', function(event) {
                    $(this).attr('type', 'text').val(formatter()).addClass('disabled');
                });
        };
        /**
         * 首页
         */
        this.first = function() {
            return this.goto(1);
        };
        /**
         * 尾页
         */
        this.last = function() {
            return this.goto(pages);
        };
        /**
         * 前一页
         */
        this.prev = function() {
            return this.goto(current - 1);
        };
        /**
         * 后一页
         */
        this.next = function() {
            return this.goto(current + 1);
        };
        /**
         * 跳转至
         */
        this.goto = function(page, isFired) {
            var error = limitter(page);
            $container.find('input').blur();
            if (error) throw error;
            if (isFired === false) return;
            return opts.callback([(current - 1) * limit, current * limit], [current, pages, limit]);
        };

        this.init();
    };

    /**
     * rpagination
     */
    $.fn.rpagination = function() {
        var instance = this.data('rpagination'),
            arg = arguments[0];
        if (arguments.length === 0 || typeof arg === 'object') {
            var options = $.extend(true, {}, $.fn.rpagination.defaults, arg);
            instance = new Pagination(this, options);
            instance.goto(options.first || 1, !!options.first);
            this.data('rpagination', instance);
            return $.extend(true, this, instance);
        }
        if (typeof arg === 'string') {
            var fn = instance[arg];
            if (fn) {
                var args = $.makeArray(arguments).slice(1);
                return fn.apply(instance, args);
            }
        }
    };

    $.fn.rpagination.defaults = {
        first: 1, //初始页
        limit: 20, //每页条数
        pages: null, //总页数
        format: '第{page} / {pages}页', //格式
        callback: function(indexes, cursors) {} //跳转回调
    };

}(jQuery);
