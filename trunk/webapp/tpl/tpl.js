/**
 * 模版
 * @author rexer
 * @date   2016-06-01
 * @param  {String} name 页面名
 * @constructor
 * @usage   Events:
 *          ready.tpl 模板始化完成 --> body
 *          switch.tpl.menu 菜单项切换 --> this.$menu
 *          ready.tpl.page  页面初始化完成 --> this.$page
 */
function tpl(name) {
  this.NAME = name;
  this.Plugin = Object.create(null);
  this.init();
}

// tpl.prototype =============

tpl.prototype.init = function () {
  // 加载默认模版
  return this.load('tpl/tpl.html', function (template) {
    $('head').append(template);
    $('body').html($('#tpl_product').html());
    this.$menu = $('#menu');
    this.$page = $('#mainContent');
    if (G.isFullScreen()) this.$page.addClass('fullScreen'); //Fix: 同步全屏状态
    this.onCacheDatepicker();
    this.ready();
  });
};

tpl.prototype.load = function (url, success, error) {
  $.get(url, $.proxy(success, this)).fail(error || function () {
    throw new Error('Fail to load the template:' + url);
  });
  return this;
};

/**
 * Event: ready.tpl
 */
tpl.prototype.ready = function (handler) {
  if (typeof handler === 'function') {
    $('body').on('ready.tpl', $.proxy(handler, this));
  } else {
    $('body').triggerHandler('ready.tpl');
  }
  return this;
};

tpl.prototype.resize = function (para) {
  if (typeof para === 'function') {
    this.$page.on('resize.tpl', $.proxy(para, this));
  } else {
    this.$page.triggerHandler('resize.tpl', para);
  }
  return this;
};

tpl.prototype.offResize = function () {
  // 移除事件
  this.$page.off('resize.tpl');
  return this;
};

tpl.prototype.removeTemplate = function (para) {
  $('head').find(para || '.tpl_html').remove();
};

/**
 * 初始化页面
 */
tpl.prototype.page = function (html) {
  this.clear().animated();
  this.$page.html(html || $('#tpl_page').html());
  this.$condition = $('#condition');
  this.$toolbar = $('.toolbar');
  this.$panel = $('.resultPanel');
  this.qCondition = new tpl.ext.Condition();

  return this;
};

tpl.prototype.animated = function () {
  var $page = this.$page;
  $page.addClass('animated slideInLeft').remove().appendTo('.body');
  setTimeout(function () { //移除动画className, 避免样式污染
    $page.removeClass('animated slideInLeft');
  }, 1500);
  return this;
};

/**
 * 清理页面
 */
tpl.prototype.clear = function () {
  // 移除页面元素，表格复制粘贴除外
  $('.body').siblings('*:not(#CopyPasteDiv)').remove();
  // 移除加载层
  $('.tpl-plugin-loader').remove();
  // 移除提示层
  $('.tpl-plugin-alert').remove();
  // 移除状态className
  this.$page.removeClass('has-condition has-toolbar');
  // 移除事件
  this.offResize();

  return this;
};

tpl.prototype.open = function (index) {
  this.$menu.eq(index).click();
};

tpl.prototype.menu = function (opts, index) {
  this.$menu.empty();
  var that = this;
  opts.forEach(function (item) {
    var $item = $('<button class="tpl-menu-item menu-item"></button>')
      .val(item.value)
      .html(item.text)
      .css(item.style || {})
      .attr(item.attr || {})
      .click(function (event) {
        var prev = $(this).siblings('.active');
        if ($(this).hasClass('active')) event.stopImmediatePropagation();
        else {
          $(this).addClass('active').siblings('.tpl-menu-item').removeClass('active');
          that.$menu.triggerHandler('switch.tpl.menu', prev, this);
        }
      })
      .click($.proxy(item.handler, that))
      .appendTo(that.$menu);
    // 绑定数据
    var itemData = item.data || {};
    for (var key in itemData) {
      $item.data(key, itemData[key]);
    }
  });
  this.$menu.find('.menu-item').eq(index || 0).click();
};

/**
 * 条件添加完成
 * Event: ready.tpl.page
 */
tpl.prototype.condition = function () {
  //条件更改状态同步
  this.qCondition.change(false);
  this.$condition.on('change', 'input', this.qCondition.change);
  this.$condition.parent().perfectScrollbar();
  //触发
  this.$page.triggerHandler('ready.tpl.page');
};

/**
 * 统计按钮Click事件
 */
tpl.prototype.onStatistics = function (handler) {
  if (typeof handler === 'function')
    return $('#statistics').off('click').click(handler);
  this.qCondition.change(false);
  return $('#statistics').click();
};

/**
 * 统计按钮
 */
tpl.prototype.statistics = function (toggled) {
  return $('#statistics')
    .css('display', toggled ? 'inherit' : 'none');
};

/**
 * panel开关
 * @param  {String}   panel   conditon | toolbar
 * @param  {Boolean}   toggled 开|关
 */
tpl.prototype.toggle = function (panel, toggled) {
  var targetClassName = null;
  if (panel === 'condition') targetClassName = 'has-condition';
  if (panel === 'toolbar') targetClassName = 'has-toolbar';
  targetClassName && this.$page.toggleClass(targetClassName, toggled);
};

/**
 * 添加工具栏项
 * @param {Object} opt 参数
 * @param {[Boolean]} appended 是否apped到toolbar, 默认为true
 */
tpl.prototype.toolbarItem = function (opt, appended) {
  var className = 'tpl-toolbar-item';
  var items = opt.items;
  var $group = $('<div class="tpl-toolbar-group"></div>');
  if (appended !== false) {
    this.$toolbar.append($group);
  }
  if (opt.title) $group.append('<span class="tpl-toolbar-title">' + opt.title + '</span>');
  if (opt.className) $group.addClass(className);
  if (opt.style) $group.css(opt.style);
  items.forEach(function (item) {
    var $item = $(item.html || '<button class="tpl-btn btn-' + (item.color || 'primary') + '"></button>')
      .appendTo($group);
    // 添加属性
    if (item.attr) $item.attr(item.attr);
    if (item.text) $item.html(item.text);
    if (item.className) $item.addClass(item.className);
    if (item.handler) $item.click(item.handler);
    if (!$item.hasClass(className)) $item.addClass(className);
  });
  if (opt.hasOwnProperty('handler')) {
    $('.' + className).click(opt.handler);
  }
  return $group;
}

/**
 * 生成工具栏
 */
tpl.prototype.toolbar = function (opts) {
  var me = this;
  this.$toolbar.empty();
  this.$toolbar[0].className = 'toolbar'; //重置className
  opts.forEach(function (opt) {
    me.toolbarItem(opt);
  });
  this.$toolbar.parent().perfectScrollbar();
};

/**
 * 分页
 * @param option 参数
 * @param cb 回调
 * @returns {jQuery}
 */
tpl.prototype.paginate = function (option, cb) {
  var self = this;
  $('#ht-pagination-ctrl').remove();
  if (option === 'destroy') return

  var $container = $('<div id="ht-pagination-ctrl" class="tpl-toolbar-group"></div>')
    .appendTo(self.$toolbar)
    .append('<span class="tpl-toolbar-title">分页</span>')
    .append('<div id="ht-pagination" class="tpl-toolbar-item"></div>')

  var $pagination = $('#ht-pagination').css({
    margin: '0 -10px',
    width: '122%'
  })
    .rpagination($.extend({
      first: false,
      callback: cb
    }, option));

  // 弹出层提示
  if (!window.sessionStorage.getItem('_TIP_PAGINATE_')) {
    window.sessionStorage.setItem('_TIP_PAGINATE_', true)
    $container.append('<div class="tip-paginate mask" style="display: none;"></div>')
    var src = G.CTX + 'imgs/tips-page.png';
    $('<div class="tip-paginate" style="display:none;cursor: pointer; position: absolute; right: 126px;"><img src="' + src + '" style="z-index: 9999;"></div>')
      .click(function () {
        $('.tip-paginate').fadeOut()
      })
      .appendTo($container)

    setTimeout(function () {
      $('.tip-paginate').fadeIn()
    }, 3000)
  }

  return $pagination
}

/**
 * 生成表格
 * @param  {Array}      cols     [description]
 * @param  {Array}      data     [description]
 * @param  {Object}     opts     Handsontable参数 optional
 * @return {[type]}              [description]
 */
tpl.prototype.grid = function (cols, data, opts) {
  this.$panel.empty();
  var self = this;
  /*handsontable 参数*/
  var option = Handsontable.addon.paramize(cols, data, opts);
  /*自动保存Handler*/
  var autoSaveHandler = option.autoSave;
  /*是否分页*/
  var hasPagination = data.length > 0 && option.pagination !== false;
  /*表格dom*/
  var $table = $('<div class="tpl-result-grid"></div>').appendTo(this.$panel);
  /**
   * 初始化表格
   * @param  {Object}         opt [description]
   * @return {Handsontable}       [description]
   */
  var initGrid = function (opt) {
    var instance = $table.handsontable($.extend({}, option, opt)).handsontable('getInstance');
    // 编辑保存hook
    if (typeof autoSaveHandler === 'function') {
      instance.addHook('afterChange', function (changes, source) {
        if (/alter|edit|paste/.test(source)) {
          autoSaveHandler.apply(this, changes);
        }
      });
    }
    // resize event
    self.offResize().resize(function (event) {
      var width = self.$panel.width();
      if (width)
        instance.updateSettings({width: width});
    });
    return instance;
  };
  //////////////////////////////////
  //          分页器              //
  /////////////////////////////////
  if (hasPagination) {
    var _self = this;
    /**
     * 按当前页面高度计算分页器: 每页条目, 总页数
     * @return {Object}
     */
    var getPaginationSetting = function () {
      var rowLimit = option.pagination || parseInt((_self.$panel.innerHeight() - 25) / 30),
        pages = Math.ceil(data.length / rowLimit);
      return {
        limit: rowLimit,
        pages: pages
      };
    };

    /**
     * 分页器dom
     */

    $('#ht-pagination-ctrl').remove();
    $('#ht-pagination').remove();
    /**
     * 控制分页器显隐
     * 默认状态 不显示
     */
    $('<div id="ht-pagination-ctrl" class="tpl-toolbar-group"></div>')
      .appendTo(_self.$toolbar)
      .append('<span class="tpl-toolbar-title">分页</span>')
      .append('<button class="tpl-toolbar-item tpl-btn btn-primary">否</button>')
      .on('click', 'button', function () {
        var $this = $(this);
        var instance;
        if ($this.html() === '是') {
          $pagination.hide();
          instance = initGrid();
          $this.html('否');
        } else {
          instance = $pagination.show().rpagination('updateSetting', getPaginationSetting()).first();
          $this.html('是');
        }
        // 缓存instance
        // FIXME corePage外部变量引入
        corePage.Grid = instance;
      });
    /**
     * 初始化分页器
     * 默认状态 不显示
     */
    var $pagination = $('<div id="ht-pagination"></div>').appendTo(_self.$toolbar).rpagination($.extend({
      first: false,
      callback: function (rowIndexs, pageIndexs) {
        //加载新页面表格
        var pageData = data.slice(rowIndexs[0], rowIndexs[1]);
        return initGrid({data: pageData});
      }
    }, getPaginationSetting())).hide();
  }

  //返回表格实例
  return initGrid();
};

/**
 * 地图
 * @param  {Object}   opts   MapControl参数
 * @param  {Array}    data   数据
 * @param  {Boolean}  loaded 是否插值分析
 * @return {MapControl}
 */
tpl.prototype.map2 = function (opts, data, loaded) {
  this.$panel.empty();

  var MC = new MapControl(this.$panel, opts); // 初始化

  if (!$.isArray(data) || data.length === 0) return MC; // 数据错误

  MC.init();
  MC.loadTextFeatures(data, G.User.isCity()); //标注图层

  if (loaded === false) return MC; // 不插值分析

  var loader = new tpl.Plugin.loader('.resultPanel').show('插值分析中...');

  // 数值范围
  var dataRange = [];
  var key = MC.option.dataSchema.value,
    minValue = maxValue = data[0][key];
  data.forEach(function (item) {
    var value = item[key];
    dataRange.push(value);
    if (minValue > value) minValue = value;
    if (maxValue < value) maxValue = value;
  });

  // 计算等值线分段值
  // var dZValues = [];
  // var dZValues_length = 5; //分段数
  // var avgValue = (maxValue - minValue) / dZValues_length;
  // for (var i = 0; i < dZValues_length; i++) {
  //     dZValues[i] = minValue + avgValue * i;
  // }
  // dZValues[0] = Math.ceil(dZValues[0]); //向下取整
  // dZValues[dZValues_length] = Math.floor(maxValue); //向上取整

  // 获取样式
  var style = MC.option.style;
  // 按值生成渐变色样式
  if (style.type === 'gradient' && style.styles.hasOwnProperty('type')) {
    var styleObj = style.styles;
    var fillColors = StyleManager.Gradient.getColor(styleObj.type, styleObj.isDesc);
    style = {
      type: 'gradient',
      styles: StyleManager.getGradientStyleByValue(fillColors, dataRange)
    };
  } else if (style.type === 'fill' && style.convert) {
    style.styles = StyleManager.convertStyleFromFill(style.convert);
    style.convert = false;
  }

  // 延迟执行,非阻塞
  setTimeout(function () {
    // 加载数据
    MC.getGeoFromJson(data, function (features) {
      // 插值分析
      console.time('interpolate');
      var results = MC.interpolate(features, false); //不加载等值线
      console.timeEnd('interpolate');

      // 样式编辑器
      var styleEditor = new StyleEditor(style, function (style) {
        MC.fillRangeColor(results, style);
        MC.LegendManager.update(style);
      });
      // 加载图层
      MC.fillRangeColor(results, style);
      // 加载图例
      MC.LegendManager.load(style, styleEditor.open.bind(styleEditor));

      MC.StyleEditor = styleEditor;

      loader.destroy();
    });
  }, 0);

  return MC;
};
/**
 * 地图
 * @param  {Object}   opts   MapControl参数
 * @param  {Array}    data   数据
 * @param  {Boolean}  loaded 是否插值分析
 * @return {MapControl}
 */
tpl.prototype.map = function (opts, data, loaded) {
  this.$panel.empty();

  var MC = new MapControl(this.$panel, opts); // 初始化

  if (!$.isArray(data) || data.length === 0) return MC; // 数据错误

  MC.init();
  MC.loadTextFeatures(data, G.User.isCity()); //标注图层

  if (loaded === false) return MC; // 不插值分析

  // 数值范围
  var dataRange = [];
  var key = MC.option.dataSchema.value;
  data.forEach(function (item) {
    var value = item[key];
    dataRange.push(value);
  });

  // 获取样式
  var style = MC.option.style;
  if (style.type === 'auto') { // 按值生成样式
    style.styles = StyleManager.getStyleByValue(style.option, dataRange);
  } else if (style.type === 'fill' && typeof(style.styles) === 'string') { // 获取标准样式
    style.styles = StyleManager.getStyleByName[style.styles];
  }

  if (!$.isArray(style.styles)) {
    layer.msg('地图样式加载失败！');
    return MC;
  }

  // 参数
  var FEATURES = null;

  // 插值
  function interp(styles) {
    var loader = new tpl.Plugin.loader2('.resultPanel').show('插值分析中...');
    //等值线不合法,按区域填充颜色，不进行插值
    if (styles.length <= 1) {
      var style2 = StyleManager.plainStyle;
      if (styles[0] && styles[0][2]) {
        style2 = styles[0][2]
      }
      MC.fillRegionColor(data, null, null, style2);
      loader.destroy();
      return;
    }

    MC.interpolateByServer(FEATURES, styles).done(function (features) {
      loader && loader.destroy && loader.destroy();
      // 加载图层
      MC.fillISOLayer(features);
    }).fail(function (err) {
      loader.destroy();
      if (err) layer.msg('出图失败！ ' + (err || {}).message);
    });
  }

  // 加载数据
  MC.getGeoFromJson(data, function (features) {
    FEATURES = features;
    interp(style.styles);
  });

  // 样式编辑器
  var styleEditor = new StyleEditor(style, function (style) {
    interp(style.styles);
    MC.LegendManager.update(style);
  }, {
    dataRange: dataRange,
    extraStyles: MC.option.extraStyles
  });
  // 加载图例
  MC.LegendManager.load(style, styleEditor.open.bind(styleEditor));
  MC.StyleEditor = styleEditor;

  return MC;
};
/**
 * Surfer出图
 * @author rexer
 * @date   2016-12-09
 * @param  {Object}  opts {
 *                          dataSchema: 数据键值,
 *                          surfer: surfer参数,
 *                          toolbar: 工具栏控制项
 *                        }
 * @param  {Array}   data 数据
 */
tpl.prototype.surfer = function (opts, data) {
  opts = opts || {};
  this.$panel.empty();
  // 数据键值
  var dataSchema = opts.dataSchema || {};
  // Surfer参数
  var option = opts.surfer || {};
  // toolbar参数
  var toolbarOpt = opts.toolbar || {};

  var loader = null;
  var Alert = new tpl.Plugin.alert('.resultPanel');

  // 实例
  var SC = new SurferControl(this.$panel, option);

  // 注册事件
  SC.prepare(function () {
    loader = new tpl.Plugin.loader2('.resultPanel')
      .show('Surfer出图中...');
  }).done(function (image) {
    if (loader) loader.destroy();
    SC.display(image);
  }).fail(function (err) {
    if (loader) loader.destroy();
    Alert.show('Surfer出图失败， ' + err);
  });

  // 创建工具栏
  SC.toolbar(this.$toolbar, toolbarOpt);
  // 出图
  SC.dealWiz(data, dataSchema).then(
    SC.surfer2.bind(SC),
    SC.fail.bind(SC)
  );

  return SC;
};

/**
 * 生成Chart
 * @param  {Object}   xAxis  x轴
 * @param  {Object}   yAxis  y轴
 * @param  {Array}    series 数据
 * @param  {Object}   opts   highchart配置
 */
tpl.prototype.chart = function (xAxis, yAxis, series, opts) {
  this.$panel.empty();
  var CC = new ChartControl(this.$panel);
  CC.render(xAxis, yAxis, series, opts);
  // resize event
  this.offResize().resize(function (event) {
    CC.updateSetting({});
  });
  return CC;
};

tpl.prototype.plugins = function (opts) {
  var that = this;
  opts.forEach(function (plugin) {
    var pluginName = plugin.constructor.name;
    if (!pluginName) throw new Error('Fail to add the plugin: ' + plugin);
    that.Plugin[pluginName] = plugin;
  });
};
/**
 * 记录用户操作datepicker
 */
tpl.prototype.onCacheDatepicker = function () {
  var that = this;
  this._cacheDateRange = new tpl.ext.CacheMap();
  this.$menu.on('switch.tpl.menu', function (event, prevNode, currNode) {
    var $datepicker = $('.query-time'),
      key = $(prevNode).val();
    if ($datepicker.length === 0) return;
    var value = [$datepicker.customDatePicker('getStartTime'), $datepicker.customDatePicker('getEndTime')];
    that._cacheDateRange.set(key, value);
  });
  this.$page.on('ready.tpl.page', function (event) {
    var $datepicker = $('.query-time'),
      key = that.$menu.find('.tpl-menu-item.active').val(),
      value = that._cacheDateRange.get(key);
    if (!value || $datepicker.length === 0) return;
    $datepicker.customDatePicker('setTimes', value[0], value[1]);
  });
};

// tpl.fn =============

/**
 * 插件
 * @type {Object}
 */
tpl.Plugin = {
  /**
   * 进度条2
   * 百分比
   */
  loader2: function (container) {
    $('.custom_progress.tpl-plugin-loader').remove();
    var $container = $(container || 'body');
    var $loader = $('<div class="custom_progress tpl-plugin-loader"><div class="load-container2"><span class="tpl-load-title">正在查询数据，请稍后...</span><div id="loader-circle" class="loader-circle"></div></div></div>')
      .css({
        height: $container.innerHeight(),
        width: $container.innerWidth(),
        paddingTop: $container.innerHeight() / 2 - 140,
        paddingLeft: $container.innerWidth() / 2 - 90
      }).appendTo($container);

    var circle = Circles.create({
      id: 'loader-circle',
      value: 0,
      maxValue: 100,
      text: function (value) {
        return value + '<span style="font-size: 30px;">%</span>';
      },
      radius: 60,
      width: 60,
      colors: ['#BEE3F7', '#45AEEA']
    });
    // 倒计时
    var intervalID = null;

    function startTick(tick, ins, limit) {
      intervalID = setInterval(function () {
        var t = circle.getValue() + ins;
        if (t < limit) {
          circle.update(t);
        } else if (t < 100) { //
          endTick();
          startTick(550, 1, 100);
        } else {
          endTick();
        }
      }, tick);
    }

    function endTick() {
      clearInterval(intervalID);
    }

    this.destroy = function () {
      endTick();
      setTimeout(function () {
        $loader.remove();
      }, 550);
      circle.update && circle.update(100);
    };
    this.show = function (title) {
      if (title != null) $loader.find('.tpl-load-title').html(title);
      $loader.show();
      startTick(100, 5, 95);
      return this;
    };
  },
  /**
   * 进度条
   */
  loader: function (container) {
    $('.custom_progress.tpl-plugin-loader').remove();
    var $container = $(container || 'body');
    var $loader = $('<div class="custom_progress tpl-plugin-loader"><div class="load-container load6"><span class="tpl-load-title">正在查询数据，请稍后...</span><div class="loader"></div></div></div>')
      .css({
        'paddingTop': $container.innerHeight() / 2 - 140,
        'paddingLeft': $container.innerWidth() / 2 - 90
      }).appendTo($container);

    this.destroy = function () {
      var loaderNode = $loader[0];
      if (loaderNode && loaderNode.parentNode) {
        loaderNode.parentNode.removeChild(loaderNode);
      }
    };
    this.show = function (title) {
      if (title != null) $loader.find('.tpl-load-title').html(title);
      $loader.show();
      return this;
    };
    this.hide = function () {
      $loader.hide();
      return this;
    };
    this.auto = function (title, delay) {
      var that = this;
      that.show(title);
      setTimeout(function () {
        that.destroy();
      }, delay || 5000);
    };
  },
  alert: function (container) {
    var $alert = $('<div></div>').css({display: 'none', fontSize: '1.1em'});

    this.show = function (msg, type) {
      $alert.html('<a class="close" data-dismiss="alert">&times;</a>' + msg).css('display', 'block');
      $alert[0].className = 'tpl-plugin-alert alert alert-' + (type || 'warning');
      this.remove().append();
    };
    this.append = function () {
      var $container = this.container();
      if ($container.length === 0) return this;
      $container.prepend($alert);
      return this;
    };
    this.remove = function (isAll) {
      if (isAll) $('.tpl-plugin-alert').remove();
      else $alert.remove();
      return this;
    };
    this.container = function (selector) {
      return $(selector || container);
    };
  },

  /**
   * 自定义条件项
   */
  customize: function (container, html, opts) {
    opts = opts || {};
    var $item = $($('#tpl_condition').html()).addClass(opts.className).appendTo(container);
    $item.find('.condition-content').append(html);
    var $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else $title.html(opts.title || '');
    return $item;
  },
  /**
   * 单选框
   */
  radiobtn: function (container, opts, index) {
    var html = $('#tpl_condition').html(),
      $item = $(html).addClass(opts.className).appendTo(container),
      $content = $item.find('.condition-content'),
      $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else $title.html(opts.title || '');
    opts.items.forEach(function (item) {
      var $btn = $('<button class="radiobutton tpl-radiobtn-item"></button>')
        .html(item.text).attr(item.attr || {}).css(item.css || {})
        .click(function (event) {
          if ($(this).hasClass('active') && !opts.bubbled) event.stopImmediatePropagation();
          else $(this).addClass('active').siblings('.tpl-radiobtn-item').removeClass('active');
          $(this).blur();
        }).click(item.handler).appendTo($content);
      if (item.className) $btn.addClass(item.className);
      // 绑定数据
      var itemData = item.data || {};
      for (var key in itemData) {
        $btn.data(key, itemData[key]);
      }
    });
    var $radios = $content.find('.tpl-radiobtn-item');
    $radios.click(opts.handler).eq(index || 0).addClass('active');
    return $radios;
  },
  /**
   * 多选框
   */
  checkbtn: function (container, opts) {
    var html = $('#tpl_condition').html(),
      $item = $(html).addClass(opts.className).appendTo(container),
      $content = $item.find('.condition-content'),
      $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else $title.html(opts.title || '');
    opts.items.forEach(function (item) {
      var $btn = $('<button class="radiobutton tpl-checkbtn-item"></button>')
        .html(item.text).attr(item.attr || {}).css(item.css || {})
        .click(function (event) {
          $(this).toggleClass('active').blur();
        }).click(item.handler).appendTo($content);
      // 初始选中
      if (item.checked === true) {
        $btn.addClass('active')
      }
      // 绑定数据
      var itemData = item.data || {};
      for (var key in itemData) {
        $btn.data(key, itemData[key]);
      }
    });
    var $checks = $content.find('.tpl-checkbtn-item').click(opts.handler);
    return $checks;
  },
  display: function (container, opts, className, handler, index) {
    var items = [];
    opts.forEach(function (item) {
      var type = (item.type || item),
        i = {
          handler: item.handler,
          className: item.className
        };
      switch (type) {
        case 'grid':
          i.text = '表格';
          i.attr = {value: 'grid'};
          break;
        case 'map':
          i.text = '分布图';
          i.attr = {value: 'map'};
          break;
        case 'surfer':
          i.text = 'Surfer';
          i.attr = {value: 'surfer'};
          break;
        case 'chart':
          i.text = '图形';
          i.attr = {value: 'chart'};
          break;
        default:
          return;
      }
      items.push(i);
    });
    return tpl.Plugin.radiobtn(container, {
      title: '显示',
      items: items,
      className: className,
      handler: handler
    }, index);
  },
  stationpanel: function (container, config, className) {
    return $($('#tpl_condition_station').html()).addClass(className).appendTo(container)
      .find('.tpl-station').customStationPanel(config || {});
  },
  areapanel: function (container, opts) {
    opts = opts || {};
    var $item = $($('#tpl_condition_station').html()).addClass(opts.className).appendTo(container),
      $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else $title.html(opts.title || '区域');
    return $item.find('.tpl-station').customStationPanel($.extend({single: true, title: '区域选择'}, opts.config));
  },
  /**
   * 站点类型radiobtn
   * @requires tpl.PLUGIN_STATION_KEY
   * @param  {Array}   opts   参数数组成员包含以下三种情况,可以组合使用
   *                          1. String key值 指定类型
   *                          2. Object{type: key值, handler: Function} 指定类型和handler
   *                          3. Object{text,attr,...} tpl.Plugin.radiobtn参数
   */
  station: function (container, opts, className, handler, index) {
    var items = [];
    opts.forEach(function (opt) {
      var item = tpl.PLUGIN_STATION_KEY[opt.type || opt] || opt;
      item.handler = opt.handler;
      items.push(item);
    });
    return tpl.Plugin.radiobtn(container, {
      title: '站点',
      items: items,
      className: className,
      handler: handler
    }, index);
  },
  datepicker: function (container, opts) {
    if (!opts) opts = {};
    if (opts.customize) return tpl.Plugin.customize(container, opts.customize, {title: opts.title})
      .find('.query-time').customDatePicker(opts.config);
    var suffix = opts.single ? '_single' : '',
      html = $('#tpl_condition_datepicker' + suffix).html(),
      ctrl_html;
    var $item = $(html).addClass(opts.className).appendTo(container),
      $ctrl = $item.find('.custom-datepicker-ctrl'),
      $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else if (opts.title != undefined) $title.html(opts.title);
    if (opts.style) $ctrl.css(opts.style);
    if (opts.type === 'date') ctrl_html = $('#tpl_condition_datepicker_date' + suffix).html();
    else if (opts.type === 'time') {
      ctrl_html = $('#tpl_condition_datepicker_time' + suffix).html();
      opts.config = $.extend(true, {
        timePicker: true,
        timePicker24Hour: true,
        locale: {format: 'YYYY-MM-DD HH:mm'},
        startDate: moment().startOf('h').subtract(1, 'd'),
        endDate: moment().startOf('h'),
      }, opts.config);
    }
    // 包含ctrl参数时，重置默认Ctrl按钮
    if (!opts.clearCtrl) $ctrl.append(ctrl_html);
    else if ($.isArray(opts.ctrl)) {
      opts.ctrl.forEach(function (item) {
        if (typeof item === 'string') $ctrl.append(item);
        else $('<button class="custom-datepicker ctrl normalBtn"></button>')
          .addClass(item.className)
          .html(item.text)
          .attr('data', item.data)
          .appendTo($ctrl);
      });
    } else if (typeof(opts.ctrl) === 'string') {
      $ctrl.append(opts.ctrl);
    }
    return $item.find('.query-time').customDatePicker(opts.config);
  },
  hou: function (container, opts) {
    if (!opts) opts = {};
    var suffix = opts.single ? '_single' : '';
    var $item = $($('#tpl_condition_hou' + suffix).html()).addClass(opts.className).appendTo(container);
    var $title = $item.find('.condition-title');
    if (opts.title === false) $title.remove();
    else if (opts.title != undefined) $title.html(opts.title);
    return $item.find('.query-time').customDatePicker(opts.config);
  },
  yearmonth: function (container, opts) {
    return tpl.Plugin.datepicker(container, $.extend({title: '时段',}, opts, {
      customize: '<div class="query-time" style="display: inline-flex;"><input type="text" class="start custom-datepicker hidden"><input type="number" class="custom-datepicker ext year" style="margin-right: 3px;"></input><select class="custom-datepicker ext month"></select></div>',
    }));
  },
  year: function (container, opts) {
    var html = $('#tpl_condition_year').html(),
      opt;
    var $item = $(html).addClass(opts.className).appendTo(container);
    switch (opts.type) {
      case 'history':
        opt = $.extend({start: 1951, end: moment().year(), title: '历年'}, opts);
        break;
      case 'perennial':
        opt = $.extend({start: 1981, end: 2010, title: '常年'}, opts);
        break;
      default:
        opt = $.extend({}, opts);
    }
    var $title = $item.find('.condition-title');
    if (opt.title === false) $title.remove();
    else $title.html(opt.title || '');
    $item.find('.start').val(opt.start);
    $item.find('.end').val(opt.end);
    return $item;
  },
  index: function (container, opts) {
    var html = $('#tpl_condition_index').html();
    var $index = $(html).addClass(opts.className).appendTo(container);
    var $content = $index.find('.condition-content');
    $index.find('.tpl-index-title').html(opts.title || '指标');
    if ($.isArray(opts.items)) {
      opts.items.forEach(function (item) {
        var $item = $('<div class="tpl-index-item"></div>').appendTo($content);
        if (item.title) $item.append('<i class="index-item-title colon">' + item.title + '</i>');
        $item.append('<div class="index-item-content">' + item.content + '</div>')
      });
    } else {
      $content.html(opts.items);
    }
    $index.find('.tpl-index-btn').tooltip().on('click', function (event) {
      event.preventDefault();
      var $this = $(this),
        show = 'fa-minus-circle',
        hide = 'fa-plus-circle';
      if ($this.hasClass(show)) {
        $content.hide();
        $this.removeClass(show).addClass(hide);
      } else {
        $content.show();
        $this.removeClass(hide).addClass(show);
      }
    }).click();
  },
};

tpl.ext = {
  Condition: function () {
    var value = {};
    var status = false;
    this.get = function () {
      return value;
    };
    this.set = function (condition, changed) {
      value = condition;
      status = !!changed;
    };
    this.change = function (changed) {
      if (changed !== undefined) status = !!changed;
      return status;
    };
    return this;
  },
  /**
   * 缓存Map
   */
  CacheMap: function () {
    var caches = {};
    this.get = function (key) {
      return caches[key];
    };
    this.set = function (key, value) {
      caches[key] = value;
    };
  },
  query: function (service, para, handler, loader_text, error) {
    var loader = new tpl.Plugin.loader2('.resultContent').show(loader_text);
    $.post(G.URL.getDataService() + service, G.paramize(para), handler).fail(error || function (a, b, c) {
      handler();
      new tpl.Plugin.alert('.resultPanel').remove(true).show('请求数据失败...  ' + new Date().toLocaleString('en-GB'), 'danger');
    }).always(function () {
      loader.destroy();
    });
  },
  /**
   * 类型判断**JSON或数组**
   * @author rexer
   * @date   2016-05-23
   * @param  {[type]}   obj [description]
   * @return {Boolean}      [description]
   */
  isExpectedType: function (obj) {
    return typeof(obj) === 'object' && ((Object.prototype.toString.call(obj) === '[object Object]' && !obj.length) || Object.prototype.toString.call(obj) === '[object Array]');
  },
  loadStation: function (callback) {
    var data = sessionStorage.getItem('station_data');
    if (data) callback(JSON.parse(data));
    else {
      var loader = new tpl.Plugin.loader('body').show('页面准备中...');
      $.post(G.URL.getDataService() + 'CommonService/getAllStations', null, function (data) {
        if (!$.isArray(data) || data.length === 0) {
          new tpl.Plugin.alert('#mainContent').remove(true).show('页面数据加载失败...', 'danger');
          throw new Error('Wrong data of response: CommonService/getAllStations');
        }
        sessionStorage.setItem('station_data', JSON.stringify(data));
        callback(data);
      }).fail(function (err) {
        new tpl.Plugin.alert('#mainContent').remove(true).show('页面数据加载失败...', 'danger');
      }).always(function () {
        loader.destroy();
      });
    }
  },
  // 获取用户区域信息
  getUserArea: function () {
    var areaCode = G.User.getArea();
    var xml = MapControl.getRegionXML();
    var area = xml.querySelector('province[areacode="' + areaCode + '"]');
    if (!area) return;
    var bound = area.querySelector('bound');
    if (!bound) return;
    var bounds = area.querySelector('bound').innerHTML;
    return JSON.parse('[' + bounds + ']');
  },
  /**
   * 条件切换
   * @param  {Element}   ele    显示条件的控制元素
   * @param  {String}   attrKey 存放selector属性Key
   */
  toggleCondition: function (ele, attrKey) {
    var $ele = $(ele);
    attrKey = attrKey || 'data';
    $ele.siblings().each(function (index, el) {
      var hide_selector = $(this).attr(attrKey);
      var $hide = $(hide_selector);
      if ($hide.length > 0) $hide.hide();
    });
    var show_selector = $ele.attr(attrKey);
    var $show = $(show_selector);
    if ($show.length > 0) $show.show();
  },
  /**
   * 数据处理
   * @type {Object}
   */
  Analyze: {
    /**
     * 按站点类型过滤
     * @param  {String}   type [description]
     * @param  {Array}   data [description]
     * @param  {String}   key  [description]
     * @return {Array}        [description]
     */
    filterByStationType: function (type, data, key) {
      var result = [],
        i;
      switch (type) {
        case 'nation':
          for (i = 0; i < data.length; i++)
            if (!isNaN(new String(data[i][key])[0])) result.push(data[i]);
          break;
        case 'area':
          for (i = 0; i < data.length; i++)
            if (isNaN(new String(data[i][key])[0])) result.push(data[i]);
          break;
        default:
          return data;
      }
      return result;
    }
  }
};

//================Hack in IE================
/**
 * Hack in support for Function.name for browsers that don't support it.
 */
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
  Object.defineProperty(Function.prototype, 'name', {
    get: function () {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = (funcNameRegex).exec((this).toString());
      return (results && results.length > 1) ? results[1].trim() : '';
    },
    set: function (value) {
    }
  });
}
