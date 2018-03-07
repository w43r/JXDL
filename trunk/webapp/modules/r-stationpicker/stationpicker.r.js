/**
 * 站点选择插件
 * @author rexer
 * @date   2016-06-07
 * @events StationInput.Event:
 *              loadSuccess.station 数据加载完成
 *              loadFailure.station 数据加载失败
 *              ready.station 初始化完成
 *              change.station 站点选择完成
 *
 *         StationPanel.Event:
 *             ready.station 初始化完成
 *             close.station 关闭按钮触发
 *             hidden.station 已隐藏
 */
! function($) {
	/**
	 * 站点输入补全
	 * @constructor
	 */
	var StationInput = function(element, opts) {
		this.option = opts;
		this.$this = $(element);
		this._authority();
		this.load();
	};

	StationInput.prototype = {
		_authority: function(data) { //权限
			// TODO 区县用户对站点进行过滤；用户输入时纠错
			if (G.User.isCity()) return;
			var areaCode = G.User.getArea();
			var station = $.fn.customStationPanel.getStationByAreaCode(areaCode);
			if (station) {
				this.option.first = station.stationCode;
				this.DEFAULT_STATION = station;
			}
		},
		getCode: function() {
			return this.$this.find('input.stationinput-input').attr('data-code');
		},
		updateSetting: function(para) {
			if (typeof para !== 'object') return;
			if ((para.data && para.data !== this.option.data) || (para.station && para.station !== this.option.station)) {
				this.stations = null;
				$.extend(true, this.option, para);
				this.load();
			} else {
				$.extend(true, this.option, para);
				this.dropdown();
			}
		},
		load: function() {
			if (this.stations) return;
			if (this.option.data.length > 0) {
				this.stations = this.deal(this.option.data);
				// this.option.data = [];
				this.dropdown();
				return;
			}
			var that = this;
			$.post(that.option.url, that.option.para, function(data) {
				if (!$.isArray(data) || data.length === 0) {
					var err = new Error('customStationInput, Wrong data of response: ' + that.option.url);
					that.$this.triggerHandler('loadFailure.station', err);
					throw err;
				}
				that.stations = that.deal(data);
				that.$this.triggerHandler('loadSuccess.station', data);
				that.dropdown();
			}).fail(function(err) {
				that.$this.triggerHandler('loadFailure.station', err);
			});
		},
		deal: function(data) {
			var result = [],
				split = this.option.split,
				codeKey = this.option.dataSchema.code,
				nameKey = this.option.dataSchema.name;
			switch (this.option.station) {
				case 'nation':
					data.forEach(function(item) {
						if (!isNaN(new String(item[codeKey])[0]))
							result.push([item[codeKey], item[nameKey]].join(split));
					});
					return result;
				case 'area':
					data.forEach(function(item) {
						if (isNaN(new String(item[codeKey])[0]))
							result.push([item[codeKey], item[nameKey]].join(split));
					});
					return result;
				default:
					data.forEach(function(item) {
						result.push([item[codeKey], item[nameKey]].join(split));
					});
					return result;
			}
		},
		dropdown: function() {
			var that = this,
				list = this.stations,
				limit = this.option.limit;

			this.$this.empty();

			var $input = $('<input type="text" class="stationinput-input">').attr('placeholder', '站号/站名').on('keyup', function(event) {
				if (/(38|40|27|13)/.test(event.which)) return; // 32 space

				var keyword = $(this).val();
				if (keyword === '') {
					$dropdown.hide();
					$(this).attr({
						'data-code': '',
						'data-name': '',
						'data-index': ''
					});
					return;
				}
				//中英数字空格
				if (/[^\u4e00-\u9fa5a-zA-Z0-9\s]/.test(keyword)) return;
				var li = [];
				for (var i = 0; i < list.length; i++) {
					if (li.length == limit) break;
					var item = list[i];
					if (!new RegExp(keyword, 'i').test(item)) continue;
					li.push('<li data-index="' + i + '">' + item + '</li>');
				}
				if (li.length == 0) {
					$dropdown.hide();
					return;
				}
				$dropdown.empty().append(li.join('')).show()
					.find('li:first').addClass('active');
			}).on('keydown', function(event) {
				if (!/(38|40|27|13)/.test(event.which) || $dropdown.is(':hidden')) return;

				var $items = $dropdown.find('li');
				var index = $items.siblings('.active').index();
				if (!~index) index = 0;
				switch (event.which) {
					case 13: //enter
						$items.eq(index).click();
						return;
					case 27: //esc
						$dropdown.hide();
						return;
					case 38: //up
						if (index > 0) index--;
						else index = $items.length - 1;
						break;
					case 40: //down
						if (index < $items.length - 1) index++;
						else index = 0;
						break;
					default:
						return;
				}
				$items.eq(index).trigger('active');
			}).click(function(event) {
				event.preventDefault();
				$input.trigger('keyup');
			});
			var $dropdown = $('<ul class="stationinput-dropdown" role="dropdown"></ul>').width(this.option.width).on('click', 'li', function() {
				var text = $(this).html(),
					values = text.split(that.option.split);
				$input.val(text).attr({
					'data-code': values[0],
					'data-name': values[1],
					'data-index': $(this).attr('data-index')
				});
				that.$this.triggerHandler('change.station', values[0], values[1]);
				$dropdown.hide();
			}).on('active mouseover', 'li', function(event) {
				event.preventDefault();
				$(this).addClass('active').siblings('li').removeClass('active');
			});
			this.$this.addClass('custom-stationinput').width(this.option.width).append($input).append($dropdown).hover(null, function(event) {
				event.preventDefault();
				$dropdown.hide();
			}).triggerHandler('ready.station');

			//defualt
			if (this.option.first) {
				$input.val(this.option.first).click();
				$dropdown.find('.active').click();
			}
		}
	};

	$.fn.customStationInput = function() {
		var instance = this.data('customStationInput'),
			arg = arguments[0];
		if (arguments.length === 0 || typeof arg === 'object') {
			if (!instance) {
				var options = $.extend(true, {}, $.fn.customStationInput.defaults, arg);
				instance = new StationInput(this, options);
				this.data('customStationInput', instance);
			}
			return $.extend(true, this, instance);
		}
		if (typeof arg === 'string') {
			var fn = instance[arg];
			if (fn) {
				var args = $.makeArray(arguments).slice(1);
				return fn.apply(instance, args);
			}
		}
	};

	$.fn.customStationInput.defaults = {
		url: '',
		data: [],
		dataSchema: { code: 'station_Id_C', name: 'station_Name' },
		station: 'all',
		limit: 10,
		split: ' ',
		width: 180
	};

	//=============================================================
	/**
	 * 站点弹出框
	 * @tips 绑定mousedown事件,兼容handsontable编辑器hook类型,以便阻止其冒泡
	 * @constructor
	 */
	var StationPanel = function(element, opts) {
		this.option = opts;
		this.$this = $(element);
		//this._authority();
		this.init();
		return this;
	};

	StationPanel.prototype = {
		getCodes: function(key) {
			key = key || 'data-code';
			var codes = [];
			$('.stationpanel-station.active').each(function() {
				codes.push($(this).attr(key));
			});
			return codes.join();
		},
		init: function() {
			var $head = $('<div class="panel-heading"></div>').html('<h3 class="panel-title">' + this.option.title + '</h3>');
			this.$body = $('<div class="panel-body"></div>')
				.append('<div class="content-station"></div>')
				.append('<div class="content-region"></div>')
				.append('<div class="content-ctrl"></div>');

			this.$panel = $('<div class="custom-stationpanel panel panel-primary"></div>')
				.append($head).append(this.$body).appendTo(this.option.container);
			this.$this.on('remove', $.proxy(this.destroy, this))
				.find('.stationpanel-btn')
					//.prop('disabled', !G.User.getAuthority().B)
					.click($.proxy(this.toggle, this));
			this._body();
		},
		first: function(para) {
			var $station = this.$panel.find('.stationpanel-station');
			var $first = $($station.siblings('*[data-code="' + para + '"]')[0] || $station.siblings('*[data-name="' + para + '"]')[0] || $station.siblings('*[data-area="' + para + '"]')[0])
			$first.addClass('active').siblings('.active').removeClass('active');
			this._update();
			return $first;
		},
		_body: function() {
			var that = this,
				labelOpt = this.option.labels,
				stationNodes = [],
				regionNodes = [],
				codeKey = this.option.dataSchema.code,
				nameKey = this.option.dataSchema.name,
				areaKey = this.option.dataSchema.area,
				regionKey = this.option.dataSchema.region,
				$ctrl = this.$body.find('.content-ctrl');
			//close-btn
			$('<button type="button" class="stationpanel-ctrl close">确定</button>').on('mousedown', function(event) {
				event.stopPropagation();
				that.$this.triggerHandler('close.station');
				that.hide();
			}).appendTo($ctrl);

			this.option.station.forEach(function(item, i) {
				var btnLabel = item[nameKey];
				var format = labelOpt.btn;
				var width = '75px';
				if (format) {
					// 匹配度
					var matchIndex = Number(/{areaName}/.test(format)) + Number(/{areaCode}/.test(format)) + Number(/{stationCode}/.test(format))
					// 格式化
					btnLabel = format.replace(/{areaName}/, item[nameKey])
						.replace(/{areaCode}/, item[areaKey])
						.replace(/{stationCode}/, item[codeKey]);

					if (matchIndex == 2) {
						width = '100px';
					} else if (matchIndex === 3) {
						width = '120px';
					}
				}

				stationNodes.push('<button style="width:' + width + ';" type="button" class="checkbutton stationpanel-station" data-region="' + item[regionKey] + '" data-area="' + item[areaKey] + '" data-code="' + item[codeKey] + '" data-name="' + item[nameKey] + '">' + btnLabel + '</button>');
			});
			this.$body.find('.content-station').append(stationNodes);
			var $station = $('.stationpanel-station');
			if (this.option.single) {
				$station.on('mousedown', function(event) {
					event.stopPropagation();
					var $this = $(this);
					if ($this.hasClass('.active')) return;
					$this.addClass('active').siblings('.active').removeClass('active');
					that._update();
				});
				this.$this.triggerHandler('ready.station');
				//default
				if (this.option.first) this.first(this.option.first).trigger('mousedown');
			} else {
				this.option.region.forEach(function(item, i) {
					regionNodes.push('<button type="button" class="checkbutton stationpanel-region" data-station="' + item.stations.length + '" data-region="' + item.id + '">' + item.name + '</button>');
				});
				this.$body.find('.content-region').append(regionNodes);
				var $region = $('.stationpanel-region');
				$('<button type="button" class="checkbutton stationpanel-ctrl all">全选</button>').on('mousedown', function(event) {
					$station.addClass('active');
					$region.addClass('active');
					that._update();
				}).appendTo($ctrl);
				$('<button type="button" class="checkbutton stationpanel-ctrl cancel">全不选</button>').on('mousedown', function(event) {
					$station.removeClass('active');
					$region.removeClass('active');
					that._update();
				}).appendTo($ctrl);
				$('<button type="button" class="checkbutton stationpanel-ctrl reverse">反选</button>').on('mousedown', function(event) {
					$station.each(function() {
						var $this = $(this);
						if ($this.hasClass('active')) $this.removeClass('active');
						else $this.addClass('active');
					});
					that._update();
					that._region();
				}).appendTo($ctrl);

				$region.on('mousedown', function(event) {
					event.stopPropagation();
					var $this = $(this),
						region = $this.attr('data-region'),
						$stations = $('.stationpanel-station[data-region="' + region + '"]');
					if ($this.hasClass('active')) {
						$this.removeClass('active');
						$stations.removeClass('active');
					} else {
						$this.addClass('active');
						$stations.addClass('active');
					}
					that._update();
				});
				$station.on('mousedown', function(event) {
					event.stopPropagation();
					var $this = $(this);
					if ($this.hasClass('active')) $this.removeClass('active');
					else $this.addClass('active');
					that._update();
					that._region();
				});
				this.$this.triggerHandler('ready.station');
				//defualt
				if (this.option.first) $('.stationpanel-ctrl.all').trigger('mousedown');
			}
		},
		_authority: function() {
			if (G.User.getAuthority().B) return;
			this.option.single = true;
			this.option.first = G.User.getArea();
		},
		_region: function() {
			var $station = $('.stationpanel-station.active'),
				$region = $('.stationpanel-region').removeClass('active'),
				states = {};
			$station.each(function() {
				var region = $(this).attr('data-region');
				if (!states[region]) states[region] = 0;
				states[region]++;
			});
			$region.each(function() {
				var $this = $(this),
					region = $this.attr('data-region'),
					state = Number($this.attr('data-station'));
				if (states[region] === state)
					$this.addClass('active');
			});
		},
		_update: function(text) {
			this.$this.find('.stationpanel-text').html(text || this.getCodes('data-name') || '无');
		},
		toggle: function() {
			if (this.$panel.is(':hidden')) this.show();
			else this.hide();
			return this;
		},
		show: function() {
			//if (!G.User.getAuthority().B) return;
			this.$panel.css({
				top: ($(window).height() - this.$panel.outerHeight()) / 2 + $(document).scrollTop(),
				left: ($(window).width() - this.$panel.outerWidth()) / 2
			}).show();
			return this;
		},
		hide: function() {
			this.$panel.hide();
			this.$this.triggerHandler('hidden.station');
			return this;
		},
		destroy: function() {
			this.$panel.remove();
			this.$this.removeData('customStationPanel');
		}
	};

	$.fn.customStationPanel = function() {
		var instance = this.data('customStationPanel'),
			arg = arguments[0];
		if (arguments.length === 0 || typeof arg === 'object') {
			if (!instance) {
				var options = $.extend(true, {}, $.fn.customStationPanel.defaults, arg);
				instance = new StationPanel(this, options);
				this.data('customStationPanel', instance);
			}
			return $.extend(true, this, instance);
		}
		if (typeof arg === 'string') {
			var fn = instance[arg];
			if (fn) {
				var args = $.makeArray(arguments).slice(1);
				return fn.apply(instance, args);
			}
		}
	};

}(jQuery);
