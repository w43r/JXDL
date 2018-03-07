/**
 * ajax request
 * @exports request
 *
 * @requires jQuery
 *
 * @author rexer
 */
~function (jQuery) {

  /**
   * 复制|继承
   */
  function extend() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return Object.assign ? Object.assign.apply(Object, args) : jQuery.extend.apply(jQuery, [true].concat(args));
  }

  /**
   * 发起ajax请求
   * wrapper of jQuery.ajax
   *
   * @param {String} type 请求类型
   * @param {String} url 请求地址
   * @param {*} [data] 请求参数
   * @param {*} [option] jQuery.ajax设置参数
   * @returns {Promise}
   */
  function request(type, url) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var option = arguments[3];

    var options = extend({
      paramize: true // 默认处理参数
    }, option, {
      url: url,
      method: type,
      success: null,
      error: null
    });

    // 参数处理
    options.data = options.paramize ? request.paramize(data) : data;

    // 移除多余字段
    delete options.paramize;

    return new Promise(function (resolve, reject) {
      jQuery.ajax(options).then(resolve, function (xhr, textStatus, errorThrown) {
        return reject(new Error(errorThrown), textStatus, xhr);
      });
    });
  }

  /**
   * 同步请求
   *
   * @param {String} type 请求类型
   * @param {String} url 请求地址
   * @param {*} [data] 请求参数
   * @param {*} [option] jQuery.ajax设置参数
   * @returns {*|null}
   */
  request.sync = function (type, url) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var option = arguments[3];

    var result = null;

    var options = extend({
      paramize: true // 默认处理参数
    }, option, {
      url: url,
      async: false,
      method: type,
      success: function success(res) {
        return result = res;
      },
      error: function error(_ref) {
        var status = _ref.status,
            statusText = _ref.statusText,
            responseText = _ref.responseText;
        return console.error('request on %o: status=%d,statusText=%o,response=%o', url, status, statusText, responseText);
      }
    });

    // 参数处理
    options.data = options.paramize ? request.paramize(data) : data;

    // 移除多余字段
    delete options.paramize;

    jQuery.ajax(options);

    return result;
  };

  /**
   * Ping
   *
   * @param {String} url
   * @param {Number} [timeout]
   * @returns {Boolean}
   */
  request.ping = function (url) {
    var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;

    var result = false;

    // 绝对地址
    if (!/^(https?:)?\/\//.test(url)) {
      throw new Error('protocol: //, http:// or https://');
    }

    jQuery.ajax({
      url: url,
      async: false,
      method: 'HEAD',
      timeout: timeout,
      success: function success() {
        return result = true;
      },
      error: function error(_ref2) {
        var status = _ref2.status;
        return result = status === 0 || status === 200;
      }
    });

    return result;
  };

  /**
   * post请求
   *
   * @returns {Promise}
   */
  request.post = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return request.apply(undefined, ['POST'].concat(args));
  };

  /**
   * get请求
   *
   * @returns {Promise}
   */
  request.get = function () {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return request.apply(undefined, ['GET'].concat(args));
  };

  /**
   * 参数化
   * 添加`para`包裹参数字符串
   *
   * @param {*} [para]
   * @returns
   */
  request.paramize = function () {
    var para = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (para != null) return {
      para: JSON.stringify(para)
    };
  };

  /**
   * 验证非空数组
   *
   * @param {*} any
   * @returns {Boolean}
   */
  request.isPretty = function (any) {
    return Array.isArray(any) && any.length > 0;
  };

  // exports
  window.request = request;
}(jQuery);