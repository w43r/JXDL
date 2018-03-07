/**
 * 样式编辑器
 * @author rexer
 * @date   2016-10-18
 * @requires StyleManager
 * @class
 */
function StyleEditor(style, styleEditedHandler, option) {
	var layerIndex, //弹出层索引
		currentStyle, //当前样式
		container, //页面page
		hasChange = false,
		dataRange = option.dataRange;

	// 初始化
	this.init = function(extraStyles) {
		this.styles = [style].concat(extraStyles || []);
		// 根据当前样式生成多种配色方案
		var colorTypes = [
			['w', '暖色'],
			['w', '暖色(逆序)', true],
			['c', '冷色'],
			['c', '冷色(逆序)', true]
		];
		if (Math.max.apply(Math, dataRange) >= 0 &&
			Math.min.apply(Math, dataRange) <= 0) {
			colorTypes.push(['wc', '暖色至冷色']);
			colorTypes.push(['wc', '暖色至冷色(逆序)', true]);
			colorTypes.push(['cw', '冷色至暖色']);
			colorTypes.push(['cw', '冷色至暖色(逆序)', true]);
		}
		for (var i = 0; i < colorTypes.length; i++) {
			var colorType = colorTypes[i][0],
				colorName = colorTypes[i][1],
				isReverse = !!colorTypes[i][2];
			var styles = StyleManager.getStyleByValue({ colorType: colorType, isReverse: isReverse }, dataRange);
			if (styles.length > 0) this.styles.push({
				type: 'auto',
				name: colorName,
				styles: styles
			});
		}
	};

	// 初始化body
	this._init = function($container) {
		container = $container;

		var self = this;
		var $select = container.find('.style-editor.select');
		// 添加option
		function addOption(style, title, selected) {
			var colors = [];
			style.styles.forEach(function(item) {
				var color = item[2].fillColor || StyleManager.plainStyle.fillColor;
				colors.push(color);
			});
			var gradient = 'linear-gradient(to right, ' + colors + ')';

			return $('<option>' + title + '</option>')
				.css('background', gradient)
				.data('style', style)
				.prop('selected', !!selected)
				.appendTo($select);
		}

		// 添加当前样式方案
		if (currentStyle) addOption(currentStyle, '当前', true);
		//添加其他配色方案
		this.styles.forEach(function(s, i) {
			var colors = [],
				colorName = s.name || '默认';
			s.styles.forEach(function(item) {
				var color = item[2].fillColor || StyleManager.plainStyle.fillColor;
				colors.push(color);
			});
			var gradient = 'linear-gradient(to right, ' + colors + ')';
			$('<option>' + colorName + '</option>')
				.css('background', gradient)
				.data('style', s)
				.appendTo($select);
		});

		//change
		container.on('change', 'input,select', function() {
			hasChange = true;
		});

		// change event
		$select.css('background', $select.find('option:selected').css('background')).change(function(event) {
			var $opt = $(this).find('option:selected');
			var background = $opt.css('background');
			var newStyle = $opt.data('style');
			$(this).css('background', background);
			if (isGradientType(newStyle))
				self.initColorPanel(newStyle.styles);
			else self.initColorPanel2(newStyle.styles);

		}).trigger('change');

	};

	/**
	 * 更新配色列表 渐变色
	 * @param  {[type]}   newStyles [description]
	 * @return {[type]}             [description]
	 * @Deprecated
	 */
	this.initColorPanel = function(newStyles) {
		var $content = $('#style-editor-body').empty();
		var size = newStyles.length;
		newStyles.forEach(function(item, index) {
			var cell = $('<div class="style-editor cell gradient"></div>').appendTo($content);
			$('<input class="color-title form-control" placeholder="标题">').val(item.title || '').appendTo(cell);
			$('<input class="color-picker start form-control no-right-radius">').val(StyleManager.getColorFromRGBJson(item.startColor)).appendTo(cell);
			$('<input class="color-value start form-control">').val(item.start.toFixed(2)).appendTo(cell);
			$('<input class="color-picker end form-control no-right-radius">').val(StyleManager.getColorFromRGBJson(item.endColor)).appendTo(cell);
			$('<input class="color-value end form-control">').val(item.end.toFixed(2)).appendTo(cell);
		});
		// minicolors
		$content.find('.color-picker').each(function(i, ele) {
			var position = i * 2 > size ? 'top left' : 'bottom left';
			$(ele).minicolors({
				control: 'wheel',
				letterCase: 'lowercase',
				theme: 'bootstrap',
				format: 'hex',
				position: position,
				change: function(color, opacity) {
					if (!color) return;
					this.setAttribute('value', color);
				}
			});
		})
	};
	this.initColorPanel2 = function(newStyles) {
		var $content = $('#style-editor-body').empty();
		var size = newStyles.length;
		newStyles.forEach(function(item) {
			var color = item[2].fillColor,
				startValue = item[0],
				endValue = item[1];

			var cell = $('<div class="style-editor cell fill"></div>').appendTo($content);
			// 颜色
			$('<input class="form-control color-picker">').val(color).appendTo(cell);
			// 开始值
			$('<div class="input-group" style="margin-left:1px;"></div>').appendTo(cell)
				.append('<span class="input-group-addon">区间</span>')
				.append('<input placeholder="" class="color-value start form-control no-border-radius" type="number" value="' + startValue + '">');

			// 结束值
			$('<div class="input-group" style="margin-right:1px;"></div>').appendTo(cell)
				.append('<span class="input-group-addon no-border-radius">~</span>')
				.append('<input placeholder="" class="color-value end form-control" type="number" value="' + endValue + '">');
			// 标题
			$('<div class="input-group"></div>').appendTo(cell)
				.append('<span class="input-group-addon">标题</span>')
				.append('<input class="color-title form-control" value="' + (item[2].title || '') + '">');
		});

		// minicolors
		$content.find('.color-picker').each(function(i, ele) {
			var position = i * 2 > size ? 'top left' : 'bottom left';
			$(ele).minicolors({
				control: 'wheel',
				letterCase: 'lowercase',
				theme: 'bootstrap',
				format: 'hex',
				position: position,
				change: function(color, opacity) {
					if (!color) return;
					this.setAttribute('value', color);
				}
			});
		})
	};

	// 打开
	this.open = function(onReady) {
		var self = this;
		layerIndex = layer.confirm($('#tpl_map_style_editor').html(), {
			title: '样式编辑器',
			shift: 4,
			shade: 0,
			area: '630px',
			offset: '150px',
			success: function(layero, index) {
				self._init($(layero));
				if (typeof onReady === 'function') onReady(layero, index);
			}
		}, function() {
			self.close();
		});
	};
	// 关闭
	this.close = function() {
		// 更新样式
		var selectedStyle = getSelecedOption().data('style');
		if (hasChange) {
			currentStyle = $.extend(true, {}, selectedStyle, { styles: this.getStyle() });
		} else {
			currentStyle = selectedStyle;
		}
		// 回调
		styleEditedHandler(currentStyle);
		layer.close(layerIndex);
	};
	// 获取编辑后样式
	this.getStyle = function() {
		var styles = [];
		var cells = container.find('.style-editor.cell');
		$.each(cells, function() {
			var $this = $(this);
			var color = $this.find('.color-picker').val();
			var title = $this.find('.color-title').val();
			var startValue = Number($this.find('.start.color-value').val() || -Infinity);
			var endValue = Number($this.find('.end.color-value').val() || Infinity);
			styles.push([
				startValue,
				endValue, {
					title: title,
					fillColor: color
				}
			]);
		});
		return styles;
	};
	// 渐变色样式
	this.getStyle2 = function() {
		var styles = [];
		var cells = container.find('.style-editor.cell');
		$.each(cells, function() {
			var $this = $(this);
			var $color = $this.find('.color-picker');
			var startColor = $color[0].value;
			var rgbJsonStart = StyleManager.getRGBJsonFromColor(startColor);
			var rgbJsonEnd = $color[1] ? StyleManager.getRGBJsonFromColor($color[1].value) : rgbJsonStart;
			var startValue = Number($this.find('.start.color-value').val()) || -Infinity;
			var endValue = Number($this.find('.end.color-value').val()) || Infinity;
			var title = $this.find('.color-title').val();
			styles.push({
				start: startValue,
				startColor: rgbJsonStart,
				end: endValue,
				endColor: rgbJsonEnd,
				title: title
			});
		});
		return styles;
	};

	// @private

	function getSelecedOption() {
		return container.find('.style-editor.select').find('option:selected');
	}

	function isGradientType(style) {
		return style.type === 'gradient';
	}

	this.init(option.extraStyles);

}
