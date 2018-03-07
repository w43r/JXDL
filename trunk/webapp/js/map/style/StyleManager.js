/**
 * 样式管理
 * @author rexer
 * @date   2016-10-18
 * @requires clazz
 * @requires jQuery
 */
var StyleManager = function(clazz, $) {
	/**
	 * @class
	 */
	var StyleManagerClass = clazz({
		CLASS_NAME: 'StyleManager',
		init: function() {
			this.textPointStyle = { //文本样式
				type: 'label',
				visible: 'true',
				offsetX: 0,
				offsetY: 0,
				rotationField: null,
				decimal: 1,
				noDataValue: 0.0,
				style: {
					labelAlign: 'rb',
					fontFamily: 'Arial',
					fontColor: '#000',
					fontSize: '12px',
					fontWeight: '400',
					fill: false,
					stroke: false
				},
				symbols: null
			};

			/**
			 * 空白样式|默认
			 * @type {Object}
			 */
			this.plainStyle = {
				stroke: false,
				fill: true,
				fillColor: '#fff',
				fillOpacity: '0.92'
			};
		},
		/**
		 * 获取站点数值样式
		 */
		getStationStyle: function(valueVisible, stationVisible, optStyle, valueKey, stationKey) {
			var valueStyle = $.extend(true, {}, this.textPointStyle, {
				field: valueKey || 'value',
				offsetX: -5,
				offsetY: 0,
				style: { labelAlign: 'ct' },
				visible: valueVisible
			}, optStyle);
			var stationStyle = $.extend(true, {}, this.textPointStyle, {
				field: stationKey || 'stationName',
				decimal: null,
				offsetX: -5,
				offsetY: 0,
				noDataValue: null,
				style: { labelAlign: 'cb' },
				visible: stationVisible
			}, optStyle);
			return [valueStyle, stationStyle];
		},

		/**
		 * 按数值区间生成样式
		 * 分段数默认为8
		 * @param  {Object}  option 	配色参数 {colorType: 色调类型, isReverse: 倒转色带, piece: 分段数, style: 默认地图样式}
		 * @param  {Array}   dataRange  值区间
		 * @return {Array}   样式数组
		 */
		getStyleByValue: function(option, dataRange) {
			var e = 'StyleManager按值生成样式';
			// 结果
			var styles = [];
			// 色带长度
			var limitSize = this.getColors('w').length;
			// 默认地图样式
			var styleOpt = $.extend({
				stroke: false,
				fill: true,
				fillOpacity: '0.92'
			}, option.style);

			// 获取配色方案
			var colors = this.getColors(option.colorType, option.isReverse);
			if (!colors) {
				console.error(e, '配色方案colorType错误:', option.colorType);
				return styles;
			}
			// 分段数
			var piece = option.piece;
			if (!piece || piece + 1 > limitSize) piece = limitSize - 1;
			if (piece < 2) {
				console.error(e, '分段太少:', piece);
				return styles;
			}
			// 计算区间
			var maxValue = Math.max.apply(Math, dataRange);
			var minValue = Math.min.apply(Math, dataRange);
			if (maxValue == minValue) {
				console.warn(e, '值相等');
				if (maxValue >= 0) {
					return [
						[0, Infinity, StyleManager.plainStyle]
					];
				}
				return [
					[-Infinity, 0, StyleManager.plainStyle]
				];
			}
			// 或扩大区间
			maxValue = Math.ceil(maxValue);
			minValue = Math.floor(minValue);
			// console.log(minValue, maxValue);

			/**
			 * 计算样式
			 * @param  {Number}   startValue 开始值
			 * @param  {Number}   endValue   结束值
			 * @param  {Number}   piece      分段数
			 * @param  {Array}   distColors  色带
			 * @return {Array}   样式
			 */
			function calc(startValue, endValue, piece, distColors) {
				var split = [],
					dist = [],
					diffValue = endValue - startValue,
					pValue = diffValue / piece,
					f = Math.abs(diffValue) < 1 ? 2 : 1, // 计算精度
					i;
				// 分段取值
				for (i = 0; i <= piece; i++) {
					// TODO 浮点运算处理
					split[i] = Number((startValue + pValue * i).toFixed(f));
				}
				//按数轴方向处理：负轴反置
				if (pValue < 0) {
					split.reverse();
					distColors.reverse();
				}
				for (i = 0; i <= piece; i++) {
					var color = $.extend({}, styleOpt, { fillColor: distColors.shift() });
					dist.push([split[i], split[i + 1], color]);
				}
				// 按数轴方向处理：移除负极值，添加正极值
				if (pValue < 0) dist.pop();
				else dist[piece][1] = Infinity;
				//加入结果
				styles = styles.concat(dist);

				return dist;
			}
			// 双色调
			if (option.colorType.length == 2) {
				// 区间位置判断
				var positive = minValue >= 0, //正轴
					negative = maxValue <= 0; //负轴
				if (positive || negative) {
					// 获取对应颜色
					var distColors = this.distColor(colors[Number(positive)], piece + 1);
					calc(minValue, maxValue, piece, distColors);
				} else { //正负轴分段
					// 色调-
					var piece1 = Math.floor(piece / 2), //向正轴偏移
						color1 = this.distColor(colors[0], piece1);
					calc(0, minValue, piece1, color1);
					// 色调+
					var piece2 = piece - piece1,
						color2 = this.distColor(colors[1], piece2 + 1);
					calc(0, maxValue, piece2, color2);
				}
			}
			// 单色调
			else if (option.colorType.length == 1) {
				colors = this.distColor(colors, piece + 1);
				// 计算样式
				calc(minValue, maxValue, piece, colors);
			}

			// console.log(JSON.stringify(styles));
			return styles;
		},
		/**
		 * 计算颜色分布
		 * @param  {Array}   colors 色带
		 * @param  {Number}  size   取色数量
		 * @return {Array}          颜色分布
		 */
		distColor: function(colors, size) {
			var colorSize = colors.length;
			var firstColor = colors[0];
			var lastColor = colors[colorSize - 1];

			if (size == 2) { //取两端
				return [firstColor, lastColor];
			} else if (size == 1) { //取首
				return [firstColor];
			} else if (size == 0) {
				return [];
			} else if (size >= colorSize) {
				return colors;
			}

			// 颜色数量
			var distSize = size - 2;
			// 取色间隔
			var distCell = Math.floor((colorSize - 2) / distSize);
			// 结果
			var dist = [firstColor];
			for (var i = 1; i <= distSize; i++) {
				var index = i * distCell;
				var color = colors[index];
				dist.push(color);
			}
			dist.push(lastColor);
			return dist;
		},
		/**
		 * 获取标准样式
		 */
		getStyleByName: function(styleName) {
			return this.commonStyles[styleName];
		},
		/**
		 * 获取配色
		 * @author rexer
		 * @date   2017-05-03
		 * @param  {[String]}   type      暖色调(w) | 冷色调 (c)
		 * @param  {[Boolean]}  isReverse 是否逆序[false]
		 * @return {Array}       配色数组
		 */
		getColors: function(type, isReverse) {
			// 色带
			var color1 = ["#a0f9f4", "#8ce3f6", "#78cdf7", "#64b7f8", "#3c8ae0", "#2874c7", "#145eae", "#004794", "#244ba6"];
			var color2 = ['#fefebe', '#feeaa0', '#fdd283', '#fdb265', '#f88b51', '#ef633e', '#dd3d2d', '#c21c26', '#9d2539'];
			if (isReverse) {
				color1.reverse();
				color2.reverse();
			}

			switch (type) {
				case 'c':
					return color1;
				case 'w':
					return color2;
				case 'wc':
					return [color2, color1];
				case 'cw':
					return [color1, color2];
			}

			return null;
		},
		/**
		 * 是否落点于区间
		 * @param  {Number|null}   left     区间左值
		 * @param  {Number|null   right    区间右值
		 * @param  {Number}   value    [description]
		 * @param  {String}   interval [description]
		 * @return {Boolean}           [description]
		 * @Deprecated
		 */
		isIn: function(left, right, value, interval) {
			interval = interval || '[]';
			left = left || -Infinity;
			right = right || Infinity;
			var leftInter = interval.substr(0, 1), //左闭
				rightInter = interval.substr(1, 1); //右闭
			var isLeft, isRight;
			if (leftInter === '[') isLeft = left <= value;
			else isLeft = left < value;
			if (rightInter === ']') isRight = right >= value;
			else isRight = right > value;
			return isLeft && isRight;
		},
		/**
		 * 按数值区间计算渐变色样式
		 * @param  {Array}   fillColors 渐变色数组
		 * @param  {Array}   dataRange  取值区间
		 * @param  {Number}  [piece]    分段数
		 * @return {Style}
		 * @Deprecated
		 */
		getGradientStyleByValue: function(fillColors, dataRange, piece) {
			if (!piece || piece >= fillColors.length)
				piece = fillColors.length - 1;
			var style = [];
			var maxValue = Math.max.apply(Math, dataRange);
			var minValue = Math.min.apply(Math, dataRange);
			var avgValue = (maxValue - minValue) / piece;
			for (var i = 0; i < piece; i++) {
				style.push({
					start: Number((minValue + avgValue * i).toFixed(2)),
					end: Number((minValue + avgValue * (i + 1)).toFixed(2)),
					startColor: this.getRGBJsonFromColor(fillColors[i]),
					endColor: this.getRGBJsonFromColor(fillColors[i + 1])
				});
			}
			return style;
		},
		/**
		 * @Deprecated
		 */
		convertStyleFromFill: function(styles) {
			var results = [];
			for (var i = 0, len = styles.length; i < len; i++) {
				var style = styles[i];
				var fillStyle = style[2];
				if (!fillStyle.fill) continue;
				var rgbJson = this.getRGBJsonFromColor(fillStyle.fillColor);
				if (fillStyle.hasOwnProperty('fillOpacity')) {
					rgbJson.alpha = fillStyle.fillOpacity;
				}
				results.push($.extend({}, fillStyle, {
					start: style[0],
					end: style[1],
					startColor: rgbJson,
					endColor: rgbJson
				}));
			}
			return results;
		},
		/**
		 * @Deprecated
		 */
		convertStyleFromGradient: function(styles) {
			var results = [];
			for (var i = 0, len = styles.length; i < len; i++) {
				var gStyle = styles[i];
				var color = gStyle.startColor;
				var fillStyle = $.extend({}, gStyle, {
					fillColor: this.getColorFromRGBJson(color)
				});
				if (color.hasOwnProperty('alpha')) {
					fillStyle.fillOpacity = color.alpha;
				}
				delete fillStyle.start;
				delete fillStyle.end;
				delete fillStyle.startColor;
				delete fillStyle.endColor;

				results.push([gStyle.start, gStyle.end, fillStyle]);
			}

			return results;
		},
		/**
		 * @Deprecated
		 */
		getColorFromRGBJson: function(rgb) {
			var rgbs = [rgb.red, rgb.green, rgb.blue];
			if (rgb.apha != null) return 'rgba(' + rgbs.push(rgb.apha).join() + ')';
			return 'rgb(' + rgbs.join() + ')';
		},
		/**
		 * 获取颜色对象
		 * @param  {String}   color RGB|RGBA|HEX
		 * @return {Object}         [description]
		 * @Deprecated
		 */
		getRGBJsonFromColor: function(color) {
			var hexExpr = /[\#]([a-fA-F\d]{6}|[a-fA-F\d]{3})/gm;
			var rgbExpr = /[Rr][Gg][Bb][\(](((([\d]{1,3})[\,]{0,1})[\s]*){3})[\)]/gm;
			var rgbaExpr = /[Rr][Gg][Bb][Aa][\(](((([\d]{1,3}|[\d\.]{1,3})[\,]{0,1})[\s]*){4})[\)]/gm;

			if (hexExpr.test(color)) { //hex颜色
				var colorStr = new RegExp(hexExpr).exec(color)[1];
				var res = Array.from ? Array.from(colorStr) : function(str) {
					var arr = [];
					var len = str.length;
					for (var i = 0; i < len; i++) {
						arr[i] = str[i];
					}
					return arr;
				}(colorStr);

				if (res.length === 3) return {
					red: parseInt('0x' + res[0] + res[0]),
					green: parseInt('0x' + res[1] + res[1]),
					blue: parseInt('0x' + res[2] + res[2]),
				};
				return {
					red: parseInt('0x' + res[0] + res[1]),
					green: parseInt('0x' + res[2] + res[3]),
					blue: parseInt('0x' + res[4] + res[5]),
				};
			} else if (rgbExpr.test(color)) { //rgb颜色
				var res = new RegExp(rgbExpr).exec(color)[1].split(',');
				return {
					red: parseInt(res[0]),
					green: parseInt(res[1]),
					blue: parseInt(res[2]),
				};
			} else if (rgbaExpr.test(color)) { //rgba颜色
				var res = new RegExp(rgbaExpr).exec(color)[1].split(',');
				return {
					red: parseInt(res[0]),
					green: parseInt(res[1]),
					blue: parseInt(res[2]),
					apha: parseFloat(res[3]) * 100
				};
			}
		}
	});

	return new StyleManagerClass();

}(clazz, jQuery);
