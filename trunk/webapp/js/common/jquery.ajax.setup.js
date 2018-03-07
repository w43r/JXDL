~ function($) {
	// ajax活动请求池
	$.XHRPOOL = new(function() {
		var _XHRPOOL_ = [];

		// 获取活动中的请求
		this.get = function() {
			var me = this;
			var pool = [];
			$.each(_XHRPOOL_, function(i, xhr) {
				if (xhr && xhr.state && xhr.state() === 'pending') {
					pool.push(xhr);
				} else {
					me.remove(i);
				}
			});
			return pool;
		};

		this.push = function(xhr) {
			var index = _XHRPOOL_.length;
			xhr._XHR_POOL_ID_ = index; // 序列号作为ID
			_XHRPOOL_[index] = xhr;
			return index;
		};

		this.remove = function(index) {
			_XHRPOOL_.splice(index, 1);
		};

		this.clear = function() {
			_XHRPOOL_ = [];
		};

		// 取消所有请求
		this.abortAll = function() {
			var pool = this.get();
			for (var i = 0; i < pool.length; i++) {
				pool[i].abort && pool[i].abort();
			}
			this.clear();
		};
	});

	$.ajaxSetup({
		statusCode: { //设置全局状态码拦截
			408: function() {
				G.timeout();
				throw new Error('byebye');
			}
		},
		complete: function(xhr) { //拦截过期200 response
			if (xhr.status === 200 &&
				!/UserService\/logout/.test(this.url) &&
				/cd4ab5a3-20d5-4978-bcd5-9beaadd34b4a/.test(xhr.responseText)) {
				$.XHRPOOL.abortAll();
				G.timeout();
			}
			$.XHRPOOL.remove(xhr._XHR_POOL_ID_);
		},
		beforeSend: function(xhr) {
			// 请求前，将jqXHR压入队列pool
			if (xhr){
				$.XHRPOOL.push(xhr);
			}
		}
	});
}(jQuery);
