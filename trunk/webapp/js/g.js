/**
 * Global
 * @author rexer
 * @type {Object}
 */
var G = {};

+function ($) {

  ////////////////////
  // ===== fn ===== //
  ////////////////////

  var ServiceAddress = function (host) {

    this.getDataService = function () {
      return host + 'server/services/';
    };
    this.getCommonService = function () {
      return host + 'SPDCommon/UserService/';
    };
    this.getISOService = function () {
      return host + 'WMDataService/services/';
      // return 'http://172.24.176.84:7080/WMDataService/services/';
      // return 'http://101.200.12.178:8090/WMDataService/services/'
    };
    this.getUserService = function () {
      return host + 'SPDUser/services/UserService/';
    };

    // 产品制作
    this.getProductHost = function () {
      return 'http://172.24.176.194:8080/';
      // return 'http://101.200.12.178:8080/';
      // return 'http://192.168.0.116:8080/';
      // return host;
    };
    this.getProductManager = function () {
      return this.getProductHost() + 'SPDProductManager/services/';
    };
    this.getProductService = function () {
      return this.getProductManager() + 'ProductService/';
    };
    this.getProductTemplateService = function () {
      return this.getProductManager() + 'ProductTemplateService/';
    };
    this.getFileService = function () {
      return this.getProductHost() + 'ProductFile/';
    };
    // Surfer地址
    this.getSurferHost = function () {
      return 'http://172.24.176.194:8080/';
      // return 'http://101.200.12.178:8080/';
      // return 'http://192.168.0.116:8080/';
      // return host;
    };
    this.getSurferService = function () {
      return this.getSurferHost() + 'SurferService/services/SurferService/';
    };

  };

  /**
   * 用户Util
   * @constructor
   */
  var UserUtil = function () {
    var service = G.URL.getUserService();

    this.getName = function () {
      return this._get('user');
    };
    this.getArea = function () { //所在区域代码
      return this._get('areaCode');
    };
    this.getAreaName = function () { // 所在区域名
      return this._get('Country');
    };
    this.isCity = function () { //是否为市局
      return this.getArea() === '500000';
    };
    this.getAuthority = function () {
      var auth = this._get('AuthorityCode');
      return {
        A: /ADMIN/i.test(auth),
        B: /BROWSEALL/i.test(auth),
        D: /DOWNLOADALL/i.test(auth),
        C: /CREATEPRODUCT/i.test(auth),
        E: /AUDIT/i.test(auth)
      };
    };

    this._get = function (key) {
      var value = $.cookie(key);
      if (value === undefined) this.logout();
      return value;
    };
    /**
     * 登录状态
     */
    this.logged = function () {
      var defer = new $.Deferred();
      // 验证cookie
      var value = $.cookie('user');
      if (value === undefined) {
        G.timeout();
        defer.reject(false);
      } else {
        defer.resolve(true);
      }
      return defer.promise();
    };

    this.logout = function () {
      console.log('假装已经退出了。')
      // $.removeCookie('user');
      // $.removeCookie('areaCode');
      // $.removeCookie('AuthorityCode');
      // G.redirect('login');
      // G.postSync(service + 'logout');
    };

    this.getUser = function (success, fail) {
      $.post(service + 'getUserInfo', success).fail(fail || function (a, b, c) {
        throw new Error(c);
      });
    };
    this.update = function (para) {
      return G.postSync(service + 'updateUser', para);
    };
    this.pwd = function (pwd, prepwd) {
      return G.postSync(service + 'updatePassWord', {
        UserName: this.getName(),
        PassWord: pwd,
        PrePassWord: prepwd
      });
    };

    this.changePwd = function (para) {
      var that = this;
      var html = G.frameWindow().document.querySelector('#tpl_user_changepwd').innerHTML;
      G.confirm(html, function (ret) {
        if (!ret) return true;
        var $pwd_old = this.$content.find('input[name="pwd_old"]'),
          $pwd = this.$content.find('input[name="password"]'),
          $confirm = this.$content.find('input[name="pwd_confirm"]');
        if (!$pwd_old.val() || !$pwd.val() || !$confirm.val()) {
          G.tip('请输入完整,不能为空', false);
          return false;
        }
        if ($pwd.val() != $confirm.val()) {
          G.tip('两次密码输入不一致', false);
          return false;
        }
        var result = that.pwd($pwd.val(), $pwd_old.val());
        var message = result.message;
        var opt = {};
        if (result.code) {
          message += '&nbsp;需要重新登陆...';
          opt.confirm = G.User.logout;
          opt.cancel = G.User.logout;
          opt.backgroundDismiss = false;
        }
        G.tip(message, result.code, opt);
        return result.code;
      }, {
        title: '修改密码'
      });
    };
  };

  /**
   * User of Administrator Control
   * @constructor
   */
  var UAC = function (U) {
    if (!U.getAuthority().A) return;

    var service = G.URL.getUserService();

    var error = function (a, b, c) {
      throw new Error(c);
    };

    this.insert = function (para) {
      if (!para.UserName) return {
        code: false,
        message: '用户名不能为空'
      };
      if (!para.Country || !para.AreaCode) return {
        code: false,
        message: '区域信息不能为空'
      };
      var result = G.postSync(service + 'register', $.extend({
        PassWord: 123456789
      }, para));
      if (result.code) {
        var ret = G.UAC.authority({
          UserName: para.UserName,
          AuthorityCodes: [{
            AuthorityCode: 'BROWSEAREA'
          }, {
            AuthorityCode: 'DOWNLOADAREA'
          }]
        });
        if (!ret) G.tip('<b>' + para.UserName + '</b>初始化权限失败！', false);
      }
      return result;
    };

    this.update = function (para) {
      return G.postSync(service + 'updateUser', $.extend({
        Tel: '',
        EMail: ''
      }, para));
    };

    this.pwd = function (username, pwd) {
      return G.postSync(service + 'updatePassWord', {
        UserName: username,
        PassWord: pwd
      });
    };

    this.changePwd = function (username, callback) {
      var html = G.frameWindow().document.querySelector('#tpl_user_changepwd').innerHTML;
      var $temp = $('<div></div>');
      $temp.append(html).find('.pwd_old').remove();
      G.confirm($temp.html(), function (ret) {
        if (!ret) {
          callback(ret);
          return true;
        }
        var $pwd = this.$content.find('input[name="password"]'),
          $confirm = this.$content.find('input[name="pwd_confirm"]');
        if (!$pwd.val() || !$confirm.val()) {
          G.tip('请输入完整,不能为空', false);
          return false;
        }
        if ($pwd.val() != $confirm.val()) {
          G.tip('两次密码输入不一致', false);
          return false;
        }
        var result = G.UAC.pwd(username, $pwd.val());
        G.tip(result.message, result.code);
        callback(ret);
        return result.code;
      }, {
        title: '修改密码 - ' + username
      });
    };

    this.delete = function (para) {
      return G.postSync(service + 'deleteUser', para);
    };

    this.addAuthority = function (para) {
      return G.postSync(service + 'addAuthority', para);
    };

    this.getAuthority = function (success, fail) {
      $.post(service + 'getAuthority', success).fail(fail || error);
    };

    this.getAuthorityByUserName = function (para, success, fail) {
      $.post(service + 'getAuthorityByUserName', G.paramize(para), success).fail(fail || error);
    };

    this.authority = function (para) {
      return G.postSync(service + 'updateAuthorityByUserName', para);
    };

    this.getUsers = function (success, fail) {
      $.post(service + 'getAllUsers', success).fail(fail || error);
    };

    this.getAllArea = function (success, fail) {
      $.post(service + 'getAllArea', success).fail(fail || error);
    };

    this.verifyName = function (username) {
      var result = G.postSync(service + 'isUserNameExisted', {
        UserName: username
      });
      return !result.code;
    };

    return this;
  };

  /**
   * 简易路由
   * @author rexer
   * @constructor
   */
  var Router = function () {
    // TODO 添加二级路由

    /**
     * 获取URL hash值
     * @param  {String}   url
     * @return {String}
     * @private
     */
    var getHash = function (url) {
      var hash = null;
      if (url) {
        var index = url.indexOf('#');
        if (index === -1) return hash;
        hash = url.substr(index);
      } else {
        hash = window.location.hash;
      }
      // 浏览器自动转义的情况
      return window.decodeURIComponent(hash)
    };

    /**
     * initial
     * @param  {Function} callback [description]
     */
    this.init = function (callback) {
      var self = this;
      window.addEventListener('hashchange', function (event) {
        callback(self.getRoute(event.newURL));
      });
    };

    /**
     * 获取路由
     * @param  {String}   url
     * @return {Array}    routes
     */
    this.getRoute = function (url) {
      var hash = getHash(url).substr(1);
      return isNaN(Number(hash)) ? hash : Number(hash);
    };

    /**
     * 设置路由
     * @param  {String}   route
     */
    this.setRoute = function (route) {
      window.history.pushState(null, null, '#' + route);
    };
  };

  /**
   * BModule
   * 模块分发
   * @author rexer
   * @date   2016-07-05
   * @constructor
   */
  var BModule = function () {
    this.Router = new Router();
    this.modules = [];
    this.activeModule;
    this.prevModule;
    return this;
  };

  BModule.prototype.init = function () {
    //获取配置
    $.get(BModule.defaults.url, function (data) {
      if (typeof data === 'string') data = JSON.parse(data)
      if (!G.isPretty(data)) throw new Error('module.json not correct!');
      // 获取当前用户权限
      var authority = G.User.getAuthority(),
        A = authority.A,
        B = authority.B,
        C = authority.C,
        D = authority.D,
        E = authority.E,
        Y = !G.User.isCity();
      this.modules = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        try { //权限验证
          if (!eval(item.hide)) throw true;
        } catch (e) {
          delete item.hide;
          this.modules.push(item);
        }
      }
      data = null;
      this.ready();
    }.bind(this)).fail(function () {
      throw new Error('Fail to load the module.json!');
    });
    //初始化路由
    this.Router.init(this.active.bind(this));
    return this;
  };
  // 模块准备事件
  BModule.prototype.ready = function (handler) {
    if (typeof handler === 'function') {
      $(BModule.defaults.container).on('ready.bm', $.proxy(handler, this));
    } else {
      $(BModule.defaults.container).triggerHandler('ready.bm');
    }
    return this;
  };
  // 页面加载完成事件
  BModule.prototype.loaded = function (handler) {
    if (typeof handler === 'function') {
      $(BModule.defaults.container).on('loaed.bm', $.proxy(handler, this));
    } else {
      $(BModule.defaults.container).triggerHandler('loaed.bm');
    }
    return this;
  };

  BModule.prototype.render = function () {
    var me = this;
    var $parent = $(BModule.defaults.container);
    this.modules.forEach(function (m, i) {
      // 图标
      var icon_className = 'iconfont ' + m.icon;
      var $icon = $('<a class="icon"></a>').attr('title', m.title)
        .append('<i class="' + icon_className + '"></i>')
        .append('<span>' + m.name + '</span>');
      // 模块项
      $('<li class="b-module-item"></li>')
        .attr({name: m.name, id: m.id})
        .data('module', m)
        .append($icon)
        .appendTo($parent) //append
        .click(function (event) {
          event.preventDefault();
          me.active(this);
        });
    });
    // // 计算页面最小高度
    // var moduleHeight = 88;
    // var minHeight = (this.modules.length + 0.5) * moduleHeight;
    // $('.content').css('min-height', minHeight).data('minHeight', minHeight);
    return this;
  };

  BModule.prototype.active = function (module) {
    var me = this;
    var $module;
    if (typeof module === 'number') {
      $module = $('#' + me.modules[module].id);
    } else if (typeof module === 'string') {
      $module = $('.b-module-item[name="' + module + '"]');
    } else {
      $module = $(module);
    }
    if ($module instanceof $ && $module.length === 1 && !$module.hasClass('active')) {
      // 验证登录状态
      // G.User.logged().done(function() {
      // 	me._active($module);
      // });
      me._active($module);
      return true;
    }
    return false;
  };

  BModule.prototype._active = function ($module) {
    var m = $module.data('module');
    // 更新frame
    $(BModule.defaults.frame).html('<iframe class="full" src="' + m.url + '" allowFullScreen="true"></iframe>');
    // 切换状态
    $module.addClass('active')
      .find('.spdicon').addClass('active');
    $module.siblings('.active').removeClass('active')
      .find('.spdicon').removeClass('active');

    this.activeModule = $module;
    this.Router.setRoute(m.name);
    this.loaded();
  };

  /**
   * 消息小红点
   * @param  {Number}   moduleIndex 模块Index
   * @param  {[type]}   msg 消息内容|为false时,移除小红点
   * @return {Element}
   */
  BModule.prototype.notify = function (moduleIndex, msg) {
    var mId = this.data(moduleIndex).id;
    if (!mId) return;
    var moduleNode = document.getElementById(mId);
    //remove badge
    if (/msg-badge/.test(moduleNode.childNodes[0].className)) {
      moduleNode.removeChild(moduleNode.childNodes[0]);
    }
    //append badge
    if (msg) {
      var badgeNode = document.createElement('i');
      badgeNode.className = 'msg-badge';
      badgeNode.innerHTML = msg;
      moduleNode.insertBefore(badgeNode, moduleNode.childNodes[0]);
      return badgeNode;
    }
    return null;
  };

  BModule.prototype.data = function (para) {
    if (!para) return this.activeModule.data('module');
    else if (typeof para === 'number') return this.modules[para];
    else if (arguments.length === 2) {
      var key = arguments[0],
        value = arguments[1];
      for (var i = this.modules.length; i--;) {
        var data = this.modules[i];
        if (value === data[key])
          return data;
      }
    } else return $(para).data('module');
  };

  BModule.defaults = {
    url: 'data/module.json',
    container: '#nav_menu',
    frame: '#frameContent',
    isValid: false
  };

  //////////////////////
  // ===== G.fn ===== //
  //////////////////////

  /**
   * protocol+host+port+/
   * @type {URI}
   */
  G.HOST = window.location.protocol + '//' + window.location.host + '/';

  /**
   * ctx
   * @type {[type]}
   */
  G.CTX = G.HOST + 'MIS/';

  /**
   * 站内跳转
   */
  G.redirect = function (action, service) {
    window.top.location.href = service ? (G.HOST + service) : G.CTX + (action || '');
  };

  /**
   * 是否全屏
   */
  G.isFullScreen = function () {
    var a = document.fullscreen,
      b = document.webkitIsFullScreen,
      c = document.mozFullScreen;
    if (a !== undefined) return a;
    if (b !== undefined) return b;
    if (c !== undefined) return c;
  };
  /**
   * 进入全屏
   */
  G.fullScreen = function (el) {
    el = el || document.documentElement;
    var rfs = el.requestFullScreen || el.webkitRequestFullScreen ||
      el.mozRequestFullScreen || el.msRequestFullScreen;
    if (rfs) rfs.call(el);
  };
  /**
   * 退出全屏
   */
  G.cancelFullScreen = function () {
    var cfs = document.cancelFullScreen || document.webkitCancelFullScreen ||
      document.mozCancelFullScreen || document.exitFullScreen;
    if (cfs) cfs.call(document);
  };

  /**
   * 参数化
   */
  G.paramize = function (para) {
    return para ? {
      para: JSON.stringify(para)
    } : '';
  };

  /**
   * 同步post请求
   */
  G.postSync = function (url, para, opt) {
    return G.ajaxSync(url, para, $.extend(opt, {
      type: 'POST'
    }));
  };

  /**
   * 同步get请求
   */
  G.getSync = function (url, para, opt) {
    return G.ajaxSync(url, para, $.extend(opt, {
      type: 'GET'
    }));
  };

  /**
   * 同步请求
   */
  G.ajaxSync = function (url, para, opt) {
    var result;
    $.ajax($.extend(true, {
      data: G.paramize(para),
      timeout: 30000
    }, opt, {
      url: url,
      async: false,
      success: function (data) {
        result = data;
      },
      error: function () {
        result = null;
      }
    }));
    return result;
  };

  /**
   * 子窗口
   */
  G.frameWindow = function () {
    return document.querySelector('iframe').contentWindow;
  };

  /**
   * 提示框
   * @author rexer
   * @date   2016-07-08
   * @param  {String}   msg   消息
   * @param  {Boolean/undefined}   state 提示状态
   */
  G.tip = function (msg, state, opt) {
    var title = '提示';
    var icon = 'fa fa-exclamation-circle';
    if (state === true) {
      title = '成功';
      icon = 'fa fa-heart';
    } else if (state === false) {
      title = '错误';
      icon = 'fa fa-exclamation-triangle';
    }
    return $.confirm($.extend({
      icon: icon,
      title: title,
      cancelButton: false,
      closeIcon: false,
      autoClose: 'confirm|3000',
      content: msg,
      backgroundDismiss: true
    }, opt));
  };

  /**
   * 确认框
   * @author rexer
   * @date   2016-07-08
   * @param  {String}   msg      消息
   * @param  {Function} callback 回调方法
   */
  G.confirm = function (msg, callback, opt) {
    return $.confirm($.extend({
      title: '请确认',
      closeIcon: true,
      content: msg,
      confirm: function () {
        return callback.call(this, true);
      },
      cancel: function () {
        return callback.call(this, false);
      }
    }, opt));
  };

  /**
   * 登录过期
   */
  G.timeout = function () {
    G.confirm('登录已过期,即将跳转至登录页面', G.User.logout, {
      icon: false,
      title: false,
      cancelButton: false,
      closeIcon: false,
      confirmButton: '跳转',
      keyboardEnabled: false,
      autoClose: 'confirm|3000'
    });
  };

  /**
   * 下载/导出数据
   * @author rexer
   * @date   2016-07-22
   * @param  {Blob}     blob     [description]
   * @param  {String}   filename [description]
   * @return {[type]}            [description]
   */
  G.download = function (blob, filename) {
    if (navigator.msSaveOrOpenBlob) { //IE
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      var URL = (window.URL || window.webkitURL);
      var url = URL.createObjectURL(blob);
      G.downloading(url, filename);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 100);
    }
  };
  // a标签下载文件
  G.downloading = function (url, filename) {
    var a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click'));
    document.body.removeChild(a);
  };

  /**
   * 生成GUID
   * @return {GUID}
   */
  G.GUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  G.URL = new ServiceAddress(G.HOST);
  G.User = new UserUtil();
  G.UAC = new UAC(G.User);
  G.BModule = new BModule();

  // ================== Polyfill ==================

  G.isPretty = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]' && obj.length > 0;
  };

  G.isFunction = function (obj) {
    return typeof obj === 'function';
  };

  /**
   * dataURI转Blob
   * @author rexer
   * @date   2016-12-02
   * @param  {String}   dataURI
   * @return {Blob}
   */
  G.dataURI2Blob = function (dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var dw = new DataView(ab);
    for (var i = 0; i < byteString.length; i++) {
      dw.setUint8(i, byteString.charCodeAt(i));
    }
    // write the ArrayBuffer to a blob
    return new Blob([ab], {type: mimeString});
  };

  /**
   * canvas转blob
   * @tips Proxy调用
   * @author rexer
   * @date   2016-12-02
   * @param  {Function} callback   回调
   * @param  {String}   [type]     mimetype 默认PNG
   * @param  {Number}   [quality]  图片质量 0~1 默认0.92
   */
  G.canvas2Blob = function (callback, type, quality) {
    var dataURI = this.toDataURL(type || 'image/png', quality);
    callback(G.dataURI2Blob(dataURI));
  };

  /**
   * Converts an image to a dataURL
   * @param  {String}  src
   * @param  {Function}  done
   * @param  {Function}   fail
   * @param  {String}    [mimetype]
   */
  G.image2DataURI = function (src, done, fail, mimetype) {
    // Create an Image object
    var image = new Image();

    // Add CORS approval to prevent a tainted canvas
    image.crossOrigin = 'Anonymous';

    image.onload = function () {
      var canvas = document.createElement('CANVAS');
      var ctx = canvas.getContext('2d');
      canvas.height = this.height;
      canvas.width = this.width;
      ctx.drawImage(this, 0, 0);
      var dataURI = canvas.toDataURL(mimetype || 'image/png');
      canvas = null;
      done(dataURI);
    };

    if (fail) image.onerror = fail;

    image.src = src;
  };
  /**
   * 普通对象的相等性判断
   * @return {Boolean}  [description]
   */
  G.is = function (x, y) {
    function isObj(any) {
      return Object.prototype.toString.call(any) === '[object Object]' && !any.hasOwnProperty('length');
    }

    if (!isObj(x) || !isObj(y)) return;
    // 判断相等
    return function is(x, y) {
      var flag = false,
        key = null,
        valX = null,
        valY = null;
      for (key in x) {
        if (y.hasOwnProperty(key)) {
          valX = x[key];
          valY = y[key];
          if (valX === valY) {
            flag = true;
            continue;
          }
          if (isObj(x) && isObj(y)) {
            flag = is(valX, valY);
          }
          return false;
        }
        return false;
      }
      flag = is(y, x);
      return flag;
    }(x, y);
  };

  /**
   * 严格相等判断
   * Polyfill of [Object.is]
   * @return {Boolean}  [description]
   */
  G.equal = function (x, y) {
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    } else {
      return x !== x && y !== y;
    }
  };

  /**
   * 填充数组
   */
  G.fillArray = function (size, value) {
    var arr = new Array(size);
    for (var i = size; i--;) {
      arr[i] = value;
    }
    return arr;
  }

  /**
   * 数组去重
   * @param  {Array}   array [description]
   * @return {Array}         [description]
   */
  G.unique = function (array) {
    var r = [];
    for (var i = 0, l = array.length; i < l; i++) {
      for (var j = i + 1; j < l; j++)
        if (array[i] === array[j]) j = ++i;
      r.push(array[i]);
    }
    return r;
  }

}(jQuery);
