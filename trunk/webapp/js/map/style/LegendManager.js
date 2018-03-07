/**
 * 图例管理
 * @author rexer
 * @date   2016-10-18
 * @requires StyleManager
 * @class
 */
function LegendManager(element) {
  var rootElement = element;
  var rootHeight = 250;
  var hasTitle = false;

  // 将地图样式转换为数组
  function convertStyle(styles) {
    var colors = [],
      values = [],
      _hasTitle = false;

    // 倒序
    for (var i = styles.length; i--;) {
      var item = styles[i];
      var style = item[2];
      var start = item[0];
      // var end = item[1];
      var color = style.fillColor;
      colors.push(color);
      if (style.title) {
        values.push(style.title);
        _hasTitle = true;
      } else if (start == -Infinity) {
        values.push('');
      } else {
        values.push(start);
      }
    }

    // 包含标题
    hasTitle = _hasTitle;

    return [colors, values];
  }

  /**
   * 加载图例
   * @param  {Array}    style      样式数据
   * @param  {Function}   handler   clickHandler
   */
  this.load = function(style, handler) {
    rootElement.innerHTML = '<div class="legend-color" title="点击修改图例"></div><div class="legend-text" title="点击色块修改图例"></div>';
    rootElement.style.height = rootHeight;
    rootElement.setAttribute('title', '点击色块修改图例');

    this.update(style);
    // toggle editor
    var colorElement = rootElement.querySelector('.legend-color');
    colorElement.style.border = '1px solid #9E9E9E';
    colorElement.addEventListener('click', handler);
  };

  // 更新样式
  this.update = function(style) {
    var styles = style.styles;
    var size = styles.length; //色标个数
    var styleType = style.type;
    var colorElement = rootElement.querySelector('.legend-color');
    var textElement = rootElement.querySelector('.legend-text');
    colorElement.innerHTML = ''; //清空
    textElement.innerHTML = ''; //清空
    var results = convertStyle(styles);
    var colors = results[0];
    var values = results[1];

    function addLabel(value) {
      // 数字保留一位小数
      var label = typeof value === 'number' ? value.toFixed(1) : value;
      var element = document.createElement('i');
      element.innerHTML = label;
      textElement.appendChild(element);
      return element;
    }

    if (styleType === 'fill' || styleType === 'auto') { //填充样式
      colorElement.style.background = 'transparent';
      textElement.className = 'legend-text fill';

      var innerHeight = rootHeight - 2,
        cellHeight = innerHeight / size,
        labelHeight = 20;

      for (var i = 0; i < size; i++) {
        var cell = document.createElement('div');
        cell.style.position = 'relative';
        cell.style.display = 'block';
        cell.style.background = colors[i];
        cell.style.width = '100%';
        if (i > 0) {
          cell.style.borderTop = '1px solid #9E9E9E';
        }
        cell.style.height = 'calc(100% / ' + size + ')';
        colorElement.appendChild(cell);
        var label = addLabel(values[i]);

        if (i === 0) {
          var marginTop = cellHeight - labelHeight / 2 + 'px';
          if (hasTitle) marginTop = 2.6 + cellHeight / 2 - labelHeight / 2 + 'px';
          label.style.marginTop = marginTop;
        } else if (i + 1 === size) {
          label.style.marginTop = cellHeight - labelHeight * (3 / 2 - 1 / 4) + 'px';
        } else {
          label.style.marginTop = cellHeight - labelHeight + 'px';
        }
      }

    } else if (styleType === 'gradient') {
      // 渐变色带
      var gradient = 'linear-gradient(' + colors + ')';
      colorElement.style.background = gradient;
      textElement.className = 'legend-text gradient';
      if (size <= 5) {
        values.forEach(function(value) {
          addLabel(value);
        });
      } else {
        for (var index = 0; index < size; index = index + 2) {
          addLabel(values[index]);
        }
      }
    }
  };
}
