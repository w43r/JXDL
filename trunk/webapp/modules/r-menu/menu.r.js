/**
 * 菜单栏
 * @author rexer
 * @date   2016-12-13
 */

~ function($) {
    /**
     * 控制菜单栏展示
     * @param  {jQuery}   $container
     * @param  {Object}   option     参数
     */
    function RMenu($container, option) {
        $container.addClass('R menu');
        this.container = $container;
        this.option = option;
        this.clear();
        this.init();
    }
    RMenu.prototype.init = function(index) {
        var menuItems = this.container.find('.menu-item');
        var menuSize = menuItems.length;

        if (menuSize === 0) return;

        // 显隐控制栏
        var $prev = $('<a class="prev btn" title="上一项"><i class="fa fa-chevron-left" aria-hidden="true"></i></a>');
        var $next = $('<a class="next btn" title="下一项"><i class="fa fa-chevron-right" aria-hidden="true"></i></a>');
        this.container.prepend($prev).append($next);

        // 菜单可用宽度 (保留20px)
        var innerWidth = this.container.innerWidth() - $prev.outerWidth() - $next.outerWidth() - 20;

        var showSize, //显示个数
            itemWidth, //菜单项宽度
            hiddenCurr; //隐藏指针

        // 计算最佳大小
        showSize = this.option.showSize; //默认显示个数
        itemWidth = innerWidth / showSize; //求平均宽度
        if (itemWidth < this.option.minItemWidth) { //默认值偏小
            showSize = Math.floor(innerWidth / this.option.minItemWidth);
            itemWidth = innerWidth / showSize;
        } else if (itemWidth > this.option.maxItemWidth) { //默认值偏大
            showSize = Math.floor(innerWidth / this.option.maxItemWidth);
            itemWidth = innerWidth / showSize;
        }

        // 设置每项的宽度
        menuItems.outerWidth(itemWidth);

        // 初始位置
        hiddenCurr = showSize;

        // 隐藏右侧超出部分
        if (hiddenCurr < menuSize) {
            for (var i = hiddenCurr; i < menuSize; i++) {
                menuItems.eq(i).hide();
            }
            $next.addClass('hasHidden');
        }
        // 激活Fn
        var activeFn = this.active.bind(this);

        // Events
        $prev.click(function(event) {
            event.preventDefault();
            if (hiddenCurr - showSize > 0) hiddenCurr--;
            else event.stopPropagation();
            activeFn(-1, true);
        });
        $next.click(function(event) {
            event.preventDefault();
            if (hiddenCurr < menuSize) hiddenCurr++;
            else event.stopPropagation();
            activeFn(1, true);
        });
        this.container.on('click', '.prev,.next', function(event) {
            event.preventDefault();
            var showCurr = hiddenCurr - showSize,
                i;
            // 左侧隐藏
            for (i = 0; i < showCurr; i++) {
                menuItems.eq(i).hide();
            }
            // 右侧隐藏
            for (i = hiddenCurr; i < menuSize; i++) {
                menuItems.eq(i).hide();
            }
            // 显示部分
            for (i = showCurr; i < hiddenCurr; i++) {
                menuItems.eq(i).show();
            }
            // 状态更改
            if (showCurr > 0) $prev.addClass('hasHidden');
            else $prev.removeClass('hasHidden');
            if (hiddenCurr < menuSize) $next.addClass('hasHidden');
            else $next.removeClass('hasHidden');
        });
    };
    RMenu.prototype.clear = function() {
        this.container.off('click', '.prev,.next');
        this.container.find('.prev').remove();
        this.container.find('.next').remove();
    };
    RMenu.prototype.active = function(index, related) {
        var menuItems = this.container.find('.menu-item');
        var activeIndex = index;
        if (related === true) {
            menuItems.each(function(i, el) {
                if ($(el).hasClass('active')) {
                    activeIndex = i + index;
                    return false;
                }
            });
        }
        if (activeIndex >= 0 && activeIndex < menuItems.length)
            menuItems.eq(activeIndex).click();
    };

    $.fn.rmenu = function(arg) {
        var instance = this.data('rmenu');
        if (typeof arg === 'string' && instance) {
            var fn = instance[arg];
            if (fn) {
                var args = $.makeArray(arguments).slice(1);
                return fn.apply(instance, args);
            }
        } else {
            var option = $.extend(true, {}, $.fn.rmenu.defaults, arg);
            instance = new RMenu(this, option);
            this.data('rmenu', instance);
            return $.extend(true, this, instance);
        }
    };

    $.fn.rmenu.defaults = {
        maxItemWidth: 200, // 菜单项最大宽度
        minItemWidth: 120, // 菜单项最小宽度
        showSize: 10 // 菜单个数
    };

}(jQuery);
