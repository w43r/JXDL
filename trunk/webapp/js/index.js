window.onload = function() {
  // 适配小屏幕
  applySMScreen();
  window.onresize = applySMScreen;

  /**
   * 页面初始化
   */
  G.BModule.ready(function() {
    // 用户事件
    $('#username').html(G.User.getName()).click(function() {
      G.BModule.active('个人中心');
    });
    $('#logout-btn').click(G.User.logout);

    // 切换全屏
    $('#fullBtn').click(function() {
      var $this = $(this).toggleClass('fullScreen');
      var isFullScreen = $this.hasClass('fullScreen');
      $this.text(isFullScreen ? '退出全屏' : '全屏');
      _fullScreen(isFullScreen);
    });

    // 绑定ESC按键
    window.onkeyup = function(event) {
      if (event.which === 27) _fullScreen(false);
    };

    // 模块页面加载完成
    this.loaded(function() {
        G.frameWindow().onkeyup = function(event) {
          if (event.which === 27) _fullScreen(false);
        };
      })
      .render()
      .active(this.Router.getRoute());

  }).init();
};

/**
 * 全屏
 * @param   {Boolean}  isFull [description]
 * @private
 */
function _fullScreen(isFull) {
  var childWindow = G.frameWindow(),
    mainContext = window.document.querySelector('.content'),
    childContext = childWindow.document.querySelector('.content');
  if (isFull) {
    $(mainContext).addClass('fullScreen');
    $(childContext).addClass('fullScreen');
    G.fullScreen(mainContext);
  } else {
    G.cancelFullScreen();
    $(mainContext).removeClass('fullScreen');
    $(childContext).removeClass('fullScreen');
  }
}

/**
 * 小屏幕适配
 */
function applySMScreen() {
  var MIN_SIZE = 715;

  // 重置状态
  var $banner = $('.s.banner')
    .removeAttr('style')
    .off('mouseleave')
    .off('hover');

  $('.banner-trigger').remove();

  if (window.innerHeight > MIN_SIZE) return;
  var $trigger = $('<div class="banner-trigger"></div>')
    .insertBefore($banner);

  // 显隐控制
  function hide() {
    $trigger.slideDown();
    $banner.slideUp();
  }

  function show() {
    $trigger.slideUp();
    $banner.slideDown();
  }
  $trigger.mouseover(show);
  $banner.mouseleave(hide);

  // 显示5秒钟
  show();
  setTimeout(function() {
    hide();
  }, 5000);
}
