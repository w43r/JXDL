/**
 * popzoom
 * @author  rexer rexercn@gmail.com
 * @version 0.0.1
 */

~ function($) {
    /**
     * 图片弹出式缩放插件
     * @param  {[type]}   image  [description]
     * @param  {[type]}   option [description]
     */
    function PopZoom(image, option) {
        var image_src = image.src;
        if (!image_src) return;
        var container = $(option.container);

        function init() {
            this.destroy();
            var coverElement = $('<div class="R popzoom-cover"></div>')
                .on('click', destroy)
                .appendTo(container);

            var innerElement = $('<div class="R popzoom-inner"></div>')
                .append('<img src="' + image_src + '">')
                .on('scroll', 'img', function(event) {
                	event.preventDefault();
                	event.stopPropagation();

                })
                .appendTo(container);


        }

        function destroy() {
            $('.R.popzoom-cover').remove();
            $('.R.popzoom-inner').remove();
        }

        this.init = init;
        this.destroy = destroy;

        init();
    }

    $.fn.rpopzoom = function(arg) {
        var instance = this.data('rpopzoom');
        if (typeof arg === 'string' && instance) {
            var fn = instance[arg];
            if (fn) {
                var args = $.makeArray(arguments).slice(1);
                return fn.apply(instance, args);
            }
        } else {
            var option = $.extend(true, {}, $.fn.rpopzoom.defaults, arg);
            instance = new RMenu(this, option);
            this.data('rpopzoom', instance);
            return $.extend(true, this, instance);
        }
    };

    $.fn.rpopzoom.defaults = {

    };

}(jQuery);
