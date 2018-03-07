/**
 * customDatePicker
 * 自定义时间段选择插件
 * @requires Jquery, Moment, daterangepicker
 * @author rexer
 * @usage
 *    ##INTIAL
 *    ```js
 *    $(selector).customDatePicker();  //默认参数
 *    $(selector).customDatePicker(OPTION); //自定义
 *    ```
 *    >OPTION: just the options of **daterangepicker**, except:
 *    >`startDate` is start_picker初始时间
 *    >`endDate` is end_picker初始时间
 *
 *    ##METHOD
 *    ```js
 *    $(selector).customDatePicker(method_name,arg1,arg2,...)
 *    $(selector).method_name(arg1,arg2,...)
 *    ```
 *    method_name|method_desc
 *    -----------|-----------
 *    getStartTime|获取开始时间
 *    getEndTime|获取结束时间
 *    getQuarter|季度
 *    getXun|旬
 *    getHou|候
 *    add|操作:加
 *    subtract|操作:减
 *    all|操作:整单位时间段
 *    season|操作:季节
 *
 *    ##HTML
 *    $(selector) is:
 *    ```html
 *    <div id="my-customDatePicker">
 *        <input class="custom-datepicker start"></input>
 *        <input class="custom-datepicker end"></input>
 *        <div class="custom-datepicker-ctrl">
 *            <select class="custom-datepicker ext [quarter/xun/hou]"></select>
 *            <button class="custom-datepicker ctrl" data="method_name,arg1,arg2,..."></button>
 *        </div>
 *    </div>
 *    ```
 */
+ function($) {
    $.fn.customDatePicker = function() {
        var that = this,
            para = arguments[0],
            callback = function() {},
            selector = {
                ctrl: '.ctrl.custom-datepicker',
                start: 'input.start',
                end: 'input.end',
                year: 'input.year',
                month: 'select.month',
                xun: 'select.xun',
                hou: 'select.hou',
                quarter: 'select.quarter',
                season: 'select.season'
            },
            config = { //defaults
                showDropdowns: true,
                singleDatePicker: true,
                locale: {
                    format: 'YYYY-MM-DD',
                    separator: ' 至 ',
                    applyLabel: '选择',
                    cancelLabel: '取消',
                    fromLabel: '从',
                    toLabel: '自',
                    customRangeLabel: '自定义',
                    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    firstDay: 1
                }
            };
        //======declare methods=======
        /**
         * [getStartTime description]
         * @return {Moment} [description]
         */
        this.getStartTime = function() {
            return this._getTime(selector.start);
        };
        /**
         * [getEndTime description]
         * @return {Moment} [description]
         */
        this.getEndTime = function() {
            return this._getTime(selector.end);
        };
        /**
         * [getQuarter description]
         * @return {Number} [description]
         */
        this.getQuarter = function() {
            return this.getStartTime().quarter();
        };
        /**
         * [getXun description]
         * @param  {String} key month
         * @return {Number}     [description]
         */
        this.getXun = function(key) {
            var starttime = this.getStartTime(),
                xun = Math.ceil(starttime.date() / 10);
            xun = xun > 3 ? 3 : xun;
            if (key === 'month') return xun;
            return starttime.month() * 3 + xun;
        };
        /**
         * [getHou description]
         * @param  {String} key month
         * @return {Number}     [description]
         */
        this.getHou = function(key) {
            var starttime = this.getStartTime(),
                hou = Math.ceil(starttime.date() / 5);
            hou = hou > 6 ? 6 : hou;
            if (key === 'month') return hou;
            return starttime.month() * 6 + hou;
        };
        this._getTime = function(select) {
            var _date = $(this).find(select).data('daterangepicker');
            if (!_date) return moment.invalid();
            return _date.startDate.clone();
        };
        this._setTime = function(time, select) {
            var $this = $(this);
            if (select === selector.start || select === selector.end) {
                var _date = $this.find(select).data('daterangepicker');
                if (_date) {
                    _date.setStartDate(time);
                    _date.setEndDate(time);
                }
                return;
            }
            if (isNaN(time)) return;
            var starttime = this.getStartTime(),
                endtime = starttime.clone();
            switch (select) {
                case selector.quarter:
                    starttime.startOf('year').quarter(time);
                    endtime.startOf('year').quarter(time + 1).subtract(1, 'd');
                    break;
                case selector.xun:
                    starttime.date(10 * time + 1);
                    if (time < 2) endtime.date(10 * (time + 1));
                    else endtime.endOf('month');
                    break;
                case selector.hou:
                    starttime.date(5 * time + 1);
                    if (time < 5) endtime.date(5 * (time + 1));
                    else endtime.endOf('month');
                    break;
                case selector.year:
                    starttime.year(time);
                    endtime.year(time);
                    break;
                case selector.month:
                    starttime.month(time);
                    endtime.month(time);
                    break;
                default:
                    return;
            }
            this.setTimes(starttime, endtime, select);
        };
        this.setTimes = function(starttime, endtime, select) {
            this._setTime(starttime, selector.start);
            this._setTime(endtime, selector.end);
            this._updateExtPicker(select);
        };
        this._updateExtPicker = function(select) {
            if (select != selector.year) $(this).find(selector.year).val(this.getStartTime().year());
            if (select != selector.month) $(this).find(selector.month).val(this.getStartTime().month());
            if (select != selector.quarter) $(this).find(selector.quarter).val(this.getQuarter());
            if (select != selector.xun) $(this).find(selector.xun).val(this.getXun('month') - 1);
            if (select != selector.hou) $(this).find(selector.hou).val(this.getHou('month') - 1);
        };
        /**
         * 加
         * @param {[type]} key   [description]
         * @param {[type]} value [description]
         */
        this.add = function(key, value) {
            this.setTimes(this.getStartTime().add(Number(value), key), this.getEndTime().add(Number(value), key));
        };
        /**
         * 减
         * @param  {[type]} key   [description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        this.subtract = function(key, value) {
            this.setTimes(this.getStartTime().subtract(Number(value), key), this.getEndTime().subtract(Number(value), key));
        };
        /**
         * 整单位时间段
         * @param  {String} key year/month/day/hour ...
         * @return {[type]}      [description]
         */
        this.all = function(key) {
            var time = this.getEndTime().startOf(key);
            this.setTimes(time, time.clone().endOf(key));
        };
        /**
         * 季节
         * @param  {[type]} key   spring/summer/autumn/winter
         * @return {[type]}       [description]
         */
        this.season = function(key) {
            var time = this.getEndTime(),
                starttime = time,
                endtime = time.clone();
            switch (key) {
                case 'winter':
                    starttime.month(11).date(1).subtract(1, 'y');
                    endtime.month(0).date(31).add(1, 'M');
                    break;
                case 'spring':
                    starttime.month(2).date(1);
                    endtime.month(4).date(31);
                    break;
                case 'summer':
                    starttime.month(5).date(1);
                    endtime.month(7).date(31);
                    break;
                case 'autumn':
                    starttime.month(8).date(1);
                    endtime.month(10).date(30);
                    break;
                default:
                    throw ('Error Season: ' + key);
            }
            this.setTimes(starttime, endtime);
        };
        /**
         * 获取对象成员方法
         * @param  {[type]} obj  [description]
         * @param  {[type]} expr [description]
         * @return {[type]}      [description]
         */
        this.getAccessor = function(obj, expr) {
            var ret, p, prm = [],
                i;
            if (typeof expr === 'function') {
                return expr(obj);
            }
            ret = obj[expr];
            if (ret === undefined) {
                try {
                    if (typeof expr === 'string') {
                        prm = expr.split('.');
                    }
                    i = prm.length;
                    if (i) {
                        ret = obj;
                        while (ret && i--) {
                            p = prm.shift();
                            ret = ret[p];
                        }
                    }
                } catch (e) {}
            }
            return ret;
        };
        this._isJSON = function(obj) {
            return typeof(obj) === 'object' && Object.prototype.toString.call(obj).toLowerCase() === '[object object]' && !obj.length;
        };
        //======reflect=======
        if (typeof para === 'string') {
            var fn = this.getAccessor(this, para);
            if (!fn) throw ('customDatePicker - No such method: ' + para);
            var args = $.makeArray(arguments).slice(1);
            return fn.apply(this, args);
        }
        //======extend para=======
        else if (this._isJSON(para)) {
            $.extend(true, config, para);
            if (typeof(config.callback) === 'function') {
                callback = config.callback;
                delete config.callback;
            }
        }
        // init startDate & endDate
        if (!config.startDate) {
            var now = moment(),
                key = now.date() < 3 ? 'M' : 'd';
            config.endDate = now.subtract(1, key).endOf(key).startOf('hour');
            config.startDate = config.endDate.clone().startOf('month');
        }
        //======return=======
        return this.each(function() {
            if ($(this).find(selector.start).length == 0) throw ('necessary childNodes not found.');
            var $this = $(this),
                startOption = $.extend(true, {}, config, { endDate: config.startDate }),
                endOption = $.extend(true, {}, config, { startDate: config.endDate }),
                hasExtPicker = $this.find('select.ext').length > 0;

            //start-datepicker
            $this.find(selector.start).daterangepicker(startOption, function(starttime) {
                var me = $this.find(selector.start);
                var endtime;
                try {
                    endtime = $.fn.customDatePicker.call($this, 'getEndTime');
                } catch (e) {
                    console.log(e);
                }
                callback.call(me, starttime, endtime);
                $.fn.customDatePicker.call($this, '_updateExtPicker');
            });
            //end-datepicker
            $this.find(selector.end).daterangepicker(endOption, function(endtime) {
                var me = $this.find(selector.end);
                var starttime;
                try {
                    starttime = $.fn.customDatePicker.call($this, 'getStartTime');
                } catch (e) {
                    console.log(e);
                }
                callback.call(me, starttime, endtime);
            });
            //year-datepicker
            $this.find(selector.year).on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.year);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //month-datepicker
            $this.find(selector.month).html('<option value="0">1月</option><option value="1">2月</option><option value="2">3月</option><option value="3">4月</option><option value="4">5月</option><option value="5">6月</option><option value="6">7月</option><option value="7">8月</option><option value="8">9月</option><option value="9">10月</option><option value="10">11月</option><option value="11">12月</option>').on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.month);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //quarter-datepicker
            $this.find(selector.quarter).html('<option value="1">第一季度</option><option value="2">第二季度</option><option value="3">第三季度</option><option value="4">第四季度</option>').on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.quarter);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //season-datepicker
            $this.find(selector.season).html('<option value="spring">春季</option><option value="summer">夏季</option><option value="autumn">秋季</option><option value="winter">冬季</option><option value="4">第五候</option><option value="5">第六候</option>').on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.season);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //xun-datepicker
            $this.find(selector.xun).html('<option value="0">上旬</option><option value="1">中旬</option><option value="2">下旬</option>').on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.xun);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //hou-datepicker
            $this.find(selector.hou).html('<option value="0">第一候</option><option value="1">第二候</option><option value="2">第三候</option><option value="3">第四候</option><option value="4">第五候</option><option value="5">第六候</option>').on('change', function(event) {
                that._setTime.call($this, Number($(this).val()), selector.hou);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //ctrl-datepicker
            $this.find(selector.ctrl).off('click').on('click', function() {
                var args = $(this).attr('data').split(',');
                $.fn.customDatePicker.apply($this, args);
                callback.call($(this), that.getStartTime(), that.getEndTime());
            });
            //init
            if (hasExtPicker) $.fn.customDatePicker.call($this, '_updateExtPicker');

            return that;
        });
    };
}(jQuery);
