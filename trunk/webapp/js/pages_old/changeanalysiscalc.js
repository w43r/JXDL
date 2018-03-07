/**
 * 气候变化分析算法集
 * @author rexer
 * @date   2016-12-01
 */
var Calc = {

	// ===================== 气候变化检测 =====================

	// 累积距平
	sumAnomaly: function(data) {
		var sum = 0;
		var results = [];
		data.forEach(function(item) {
			sum += item.anomaly;
			results.push($.extend({ anomalySum: Number(sum.toFixed(2)) }, item));
		});
		return results;
	},
	// 线性回归系数
	linear: function(data) {
		// 直线方程： x = a + b*t;
		// r: 时间变量t & 变量值x 的相关系数

		var T = 1; //t基数
		var n = data.length;
		// b值变量
		var b1 = b2 = b3 = b4 = b5 = 0;
		// r值变量
		var x4 = x5 = 0;
		// a值变量
		var sumValue = sumT = 0;
		data.forEach(function(value, index) {
			var t = index + T;
			b1 += t * value;
			b2 += value;
			b3 += t;
			b4 += t * t;
			b5 += t;
			sumValue += value;
			sumT += t;
			x4 += value * value; //x的平方和
			x5 += value; //x和
		});
		// 直线方程系数b
		var b = (b1 - 1 / n * b2 * b3) / (b4 - 1 / n * b5 * b5);

		// a值变量
		var avgValue = sumValue / n,
			avgT = sumT / n;
		// 直线方程a
		var a = avgValue - avgT * b;

		// 相关系数R
		var r = (n * b1 - sumT * sumValue) /
			(Math.sqrt(n * b4 - Math.pow(b5, 2)) * Math.sqrt(n * x4 - Math.pow(x5, 2)));

		var rr = Math.pow(r, 2);

		console.info('a=' + a, ' b=' + b, ' rr=' + rr);
		return {
			a: a,
			b: b,
			rr: rr,
			r: r
		};
	},
	// 求解线性回归
	linears: function(data) {
		var values = [];
		data.forEach(function(item) {
			values.push(item.value);
		});
		var linear = Calc.linear(values);
		var results = [];
		// 计算离散点
		data.forEach(function(item, index) {
			var t = index + 1;
			var linears = linear.a + linear.b * t;
			results.push($.extend({ linears: linears }, item));
		});
		return { data: results, linear: linear };
	},
	/**
	 * 查询自由度
	 * @param  {Integer}   n 自由度
	 */
	linearR: function(n) {
		if (n <= 0) return null;
		if (n > 100) return null;
		return Calc.CONST.LINEAR_RS[n];
	},
	/**
	 * 滑动平均
	 * @param  {Array}    data 数据
	 * @param  {Number}   len  滑动长度
	 * @return {Array}         [description]
	 */
	mavg: function(data, len) {
		var results = [];
		var arr = []; //要素值数据
		data.forEach(function(item, index) {
			arr.push(item.value);
			results.push($.extend({}, item));
		});

		var firstCurr = (len - 1) / 2; //起始位置
		var loop = arr.length - len;
		for (var i = 0; i <= loop; i++) {
			var sec = arr.slice(i, len + i); //分段
			var mavg = eval(sec.join('+')) / len;
			var dataCurr = firstCurr + i; //保存位置
			// 保存
			results[dataCurr].mavg = Number(mavg.toFixed(2));
		}

		return results;
	},
	// 滑动T检验
	mavgt: function(data, len) {
		var results = [];
		var arr = []; //要素值数据
		data.forEach(function(item, index) {
			arr.push(item.anomaly);
			results.push($.extend({}, item));
		});

		var loop = arr.length - len * 2;
		var v = len * 2 - 2; // 分布自由度
		var Ts = Calc.mT(v);
		for (var i = 0; i <= loop; i++) {
			var curr1 = i, //分段1位置
				curr2 = curr1 + len, //分段2位置
				dataCurr = len + i - 1; //数据保存位置

			// 分段子序列
			var sec1 = arr.slice(curr1, curr1 + len),
				sec2 = arr.slice(curr2, curr2 + len);
			// 平均值
			var avgS1 = eval(sec1.join('+')) / len,
				avgS2 = eval(sec2.join('+')) / len;

			// 方差
			var ss1 = eval('Math.pow(' + sec1.join('-(' + avgS1 + '),2)+Math.pow(') + ',2)');
			var ss2 = eval('Math.pow(' + sec2.join('-(' + avgS2 + '),2)+Math.pow(') + ',2)');

			// s系数的平方: n1 = n2 = len 为分段数
			// ( n1*ss1 + n2* ss2 ) / ( n1 + n2 + 2 )
			var ss = (ss1 + ss2) / (len + len - 2);

			// 统计量t: ( avg1 - avg2 ) / 根号( ss*( 1/n1 - 1/n2 )
			var t = (avgS1 - avgS2) / Math.sqrt(ss * 2 / len);

			// 保存
			results[dataCurr].mavgt = t;
			results[dataCurr].t005 = Ts.t005;
			results[dataCurr].t001 = Ts.t001;
			results[dataCurr].nt005 = -(Ts.t005);
			results[dataCurr].nt001 = -(Ts.t001);
		}

		return results;
	},
	/**
	 * 信度水平
	 * @param  {Integer}   v 自由度
	 */
	mT: function(v) {
		var dataset = Calc.CONST.T;
		if (v <= 0) return null;
		if (v <= 30) return dataset[v - 1];
		else if (v <= 40) return dataset[30];
		else if (v <= 60) return dataset[31];
		else if (v <= 120) return dataset[32];
		else return dataset[33];
	},
	// MK突变
	mkMut: function(data) {
		// 95%信度水平
		var t95 = 1.96;

		var results = [];
		var x = []; //要素值数据
		data.forEach(function(item, index) {
			x.push(item.value);
			results.push($.extend({}, item));
		});

		var alpha = [];
		var s = [];
		var n = data.length;
		// 正向的标准正态分别
		var uf = [];
		// 反向的标准正态分别
		var ub = [];
		//初始化，对比大小。
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				if (!alpha[i]) alpha[i] = [];
				alpha[i][j] = (x[i] > x[j] ? 1 : 0);
			}
		}

		s[0] = 0.0;
		uf[0] = 0.0;
		for (var i = 1; i < n; i++) {
			s[i] = s[i - 1];
			for (var j = 0; j < i; j++) {
				s[i] += alpha[i][j];
			}
			var k = i + 1;
			var eS = k * (k + 1.0) / 4.0;
			var varS = k * (k - 1.0) * (k * 2.0 + 5.0) / 72.0;
			uf[i] = (s[i] - eS) / Math.sqrt(varS);
		}

		s[n - 1] = 0.0;
		for (var i = n - 2; i >= 0; i--) {
			s[i] = s[i + 1];
			for (var j = n - 1; j > i; j--) {
				s[i] += alpha[i][j];
			}
			var k = n - i;
			var eS = k * (k + 1.0) / 4.0;
			var varS = k * (k - 1.0) * (k * 2.0 + 5.0) / 72.0;
			ub[i] = (eS - s[i]) / Math.sqrt(varS);
		}
		ub[n - 1] = 0.0;

		// 保存
		for (var index = 0; index < n; index++) {
			var res = results[index];
			res.ub = ub[index];
			res.uf = uf[index];
			res.t95 = t95;
			res.nt95 = -t95;
			results[index] = res;
		}

		return results;
	},
	// MK趋势
	mkTrend: function(data) {
		var s = 0; //正态分布
		var n = data.length; //序列大小

		if (n <= 10) return null; //小于10不计算

		// 计算S
		for (var i = 0; i < n - 1; i++) {
			for (var j = i + 1; j < n; j++) {
				if (data[j] > data[i]) s++;
				if (data[j] < data[i]) s--;
			}
		}

		//方差
		var varS = n * (n - 1) * (2 * n + 5) / 18;

		// 标准的正态系统变量
		var z;
		if (s > 0) {
			z = (s - 1) / (Math.sqrt(varS));
		} else if (s < 0) {
			z = (s + 1) / (Math.sqrt(varS));
		} else {
			z = 0;
		}

		return Number(z.toFixed(2));
	},

	// ===================== 气候变化影响评估 =====================

	/**
	 * 气候生产潜力 (TM模型)
	 * @param  {Number}   T 平均气温
	 * @param  {Number}   R 降水量
	 * @return {Number}     [description]
	 */
	tm: function(T, R) {
		var L = 300 + 25 * T + 0.05 * Math.pow(T, 3);
		var V = null;
		if (R < 0.316 * L) {
			V = 1.05 * R / Math.sqrt(1 + Math.pow(1.05 * R / L, 2));
		} else {
			V = R;
		}

		var Tspv = 3000 * (1 - Math.exp(-0.0009695 * (V - 20)));

		return Tspv;
	},
	/**
	 * 降水资源总量
	 * @param  {Array}   Rs      降水深度
	 * @param  {Array}   station 站号[国家站]
	 * @return {Array}   降水资源总量
	 */
	qar: function(Rs, station) {
		var xml = MapControl.getRegionXML();
		var Qs = []; //降水资源总量 单位：亿立方米
		var loop = Rs.length;
		for (var i = 0; i < loop; i++) {
			var stationCode = station[i],
				R = Rs[i];
			var area = xml.querySelector('province[stationcode="' + stationCode + '"]');
			var A = Number(area.getAttribute('area')); //面积
			var Q = R * A;
			Qs.push(Number((Q / 100000000 / 100).toFixed(2)));
		}

		return Qs;
	},
	/**
	 * 降水资源总量 单站
	 */
	qars: function(Rs, stationId) {
		// 获取区域信息
		var xml = MapControl.getRegionXML();
		// 查询站点区域
		var area = xml.querySelector('province[stationcode="' + stationId + '"]');
		if (!area) return;
		//面积
		var A = Number(area.getAttribute('area'));
		//降水资源总量 单位：亿立方米
		var Qs = [];
		var loop = Rs.length;
		for (var i = 0; i < loop; i++) {
			R = Rs[i];
			var Q = R * A;
			Qs.push(Number((Q / 100000000 / 100).toFixed(2)));
		}
		return Qs;
	},
	/**
	 * 蒸发量
	 * @param  {Number}   T 平均气温
	 * @param  {Number}   P 降水量
	 * @return {Number}   蒸发量
	 */
	evap: function(T, P) {
		var E = 3100 * P / (3100 + 1.8 * Math.pow(P, 2) * Math.exp(-34.4 * T / (235 + T)));

		return E;
	},
	/**
	 * 可利用降水量
	 * @param  {Number}   T 平均气温
	 * @param  {Number}   P 降水量
	 * @return {Number}   可利用降水量
	 */
	upre: function(T, P) {
		var E = Calc.evap(T, P);
		var Pi = P - E;
		return Pi;
	},
	/**
	 * 空调度日
	 * @param  {Array}   Ts     温度
	 * @param  {Number}  index 基础温度
	 * @return {Number}        [description]
	 */
	ccd: function(Ts, index) {
		var result = 0;
		var loop = Ts.length;
		for (var i = 0; i < loop; i++) {
			var T = Ts[i],
				rd = T - index;
			if (rd > 0) result += rd;
		}
		return result;
	},
	/**
	 * 采暖度日
	 * @param  {Array}   Ts     温度
	 * @param  {Number}  index 基础温度
	 * @return {Number}        [description]
	 */
	hdd: function(Ts, index) {
		var result = 0;
		var loop = Ts.length;
		for (var i = 0; i < loop; i++) {
			var T = Ts[i],
				rd = index - T;
			if (rd > 0) result += rd;
		}
		return result;
	},
	/**
	 * 温湿指数
	 * @param  {Number}   T  平均温度
	 * @param  {Number}   RH  相对湿度
	 * @return {Number}      [description]
	 */
	thi: function(T, RH) {
		var THI = (1.8 * T + 32) - 0.55 * (1 - RH) * (1.8 * T - 26);

		return THI;
	},
	// 温湿指数 等级
	thi2level: function(THI) {
		if (THI < 40) return [1, '极冷，极不舒适'];
		if (THI <= 45) return [2, '寒冷，不舒适'];
		if (THI <= 55) return [3, '偏冷，较不舒适'];
		if (THI <= 60) return [4, '清凉，舒适'];
		if (THI <= 65) return [5, '凉，非常舒适'];
		if (THI <= 70) return [6, '暖，舒适'];
		if (THI <= 75) return [7, '偏热，较舒适'];
		if (THI <= 80) return [8, '闷热，不舒适'];
		return [9, '极闷热，极不舒适'];
	},
	/**
	 * 人体舒适度指数
	 * @param  {Number}   T  最高温度
	 * @param  {Number}   RH 相对湿度
	 * @param  {Number}   V  风速
	 * @return {Number}      [description]
	 */
	ssd: function(T, RH, V) {
		var SSD = (1.818 * T + 18.18) * (0.88 + 0.002 * RH) +
			(T - 32) / (45 - T) - 3.2 * Math.pow(V, 0.5) + 3.2;

		return SSD;
	},
	// 舒适度指数 等级
	ssd2level: function(SSD, stds) {
		if (!Calc.isArray(stds) || stds.length !== 8) {
			stds = [20, 40, 50, 60, 70, 75, 80, 85];
		}
		if (SSD < stds[0]) return [-4, '寒冷，人感觉极不舒适，冷得发抖'];
		if (SSD <= stds[1]) return [-3, '冷，人感觉很不舒适，体温稍有下降'];
		if (SSD <= stds[2]) return [-2, '凉，人感觉不舒适'];
		if (SSD <= stds[3]) return [-1, '凉爽，人感觉较舒适'];
		if (SSD <= stds[4]) return [0, '舒适'];
		if (SSD <= stds[5]) return [1, '温暖，人感觉较舒适，轻度出汗'];
		if (SSD <= stds[6]) return [2, '暖，人感觉不舒适，容易出汗'];
		if (SSD <= stds[7]) return [3, '热，感觉很不舒适，容易过度出汗'];
		return [4, '炎热，人体感觉极不舒适'];
	},
	/**
	 * 炎热指数
	 * 只适合气温高于80℉ （26.7℃）且湿度大于40%的气候条件。
	 * @param  {Number}   T 干球温度(℉)
	 * @param  {Number}   R 相对湿度(%)
	 * @return {Number}     炎热指数(℉)
	 */
	hotIndex: function(T, R) {
		// 系数
		var c1 = -42.379,
			c2 = 2.04901523,
			c3 = 10.14333127,
			c4 = -0.22475541,
			c5 = -6.83783 * Math.pow(10, -3),
			c6 = -5.481717 * Math.pow(10, -2),
			c7 = 1.2287 * Math.pow(10, -3),
			c8 = 8.5282 * Math.pow(10, -4),
			c9 = -1.99 * Math.pow(10, -6);
		// 炎热指数
		var HI = c1 +
			c2 * T +
			c3 * R +
			c4 * T * R +
			c5 * T * T +
			c6 * R * R +
			c7 * T * T * R +
			c8 * T * R * R +
			c9 * T * T * R * R;
		return HI;
	},
	/**
	 * 炎热等级
	 * @param  {Number}   HI 炎热指数(℉)
	 * @return {Array}       [人体感受, 健康关注]
	 */
	hotIndex2level: function(HI, stds) {
		if (!Calc.isArray(stds) || stds.length !== 4) {
			stds = [80, 90, 105, 130];
		}
		if (HI <= stds[0]) return ['', ''];
		if (HI <= stds[1]) return ['热，感觉不太舒适', '户外工作容易产生身体疲劳，持续户外工作则有可能会导致热痉挛'];
		else if (HI <= stds[2]) return ['炎热，感觉难受', '室内需要开空调，室外工作可能会出现热痉挛、热疲劳，若持续户外工作则有可能会导致中暑'];
		else if (HI <= stds[3]) return ['酷热，非常难受', '尽量减少室外活动，室外工作易出现热痉挛、热疲劳，若持续户外工作则会导致中暑'];
		else return ['极端热，人体难以忍受', '尽量避免室外活动，易中暑'];
	},
	/**
	 * 华氏度转摄氏度
	 * @param  {Number}   F 华氏度
	 */
	F2C: function(F) {
		return (F - 32) / 1.8;
	},
	/**
	 * 摄氏度转华氏度
	 * @author rexer
	 * @date   2017-02-07
	 * @param  {Number}   C 摄氏度
	 */
	C2F: function(C) {
		return C * 1.8 + 32;
	},
	isArray: function(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]'
	}
};

/**
 * 常量
 * @type {Object}
 */
Calc.CONST = {
	/**
	 * 线性趋势 检验相关系数临界值表
	 * n: 样本数
	 */
	LINEAR_RS: [
		{ n: 1, r005: 0.99692, r001: 0.99988 },
		{ n: 2, r005: 0.95000, r001: 0.99000 },
		{ n: 3, r005: 0.87834, r001: 0.95874 },
		{ n: 4, r005: 0.81140, r001: 0.91720 },
		{ n: 5, r005: 0.75449, r001: 0.87453 },
		{ n: 6, r005: 0.70673, r001: 0.83434 },
		{ n: 7, r005: 0.66638, r001: 0.79768 },
		{ n: 8, r005: 0.63190, r001: 0.76459 },
		{ n: 9, r005: 0.60207, r001: 0.73479 },
		{ n: 10, r005: 0.57598, r001: 0.70789 },
		{ n: 11, r005: 0.55294, r001: 0.68353 },
		{ n: 12, r005: 0.53241, r001: 0.66138 },
		{ n: 13, r005: 0.51398, r001: 0.64114 },
		{ n: 14, r005: 0.49731, r001: 0.62259 },
		{ n: 15, r005: 0.48215, r001: 0.60551 },
		{ n: 16, r005: 0.46828, r001: 0.58971 },
		{ n: 17, r005: 0.45553, r001: 0.57507 },
		{ n: 18, r005: 0.44376, r001: 0.56144 },
		{ n: 19, r005: 0.43286, r001: 0.54871 },
		{ n: 20, r005: 0.42271, r001: 0.53680 },
		{ n: 21, r005: 0.41325, r001: 0.52562 },
		{ n: 22, r005: 0.40439, r001: 0.51510 },
		{ n: 23, r005: 0.39607, r001: 0.50518 },
		{ n: 24, r005: 0.38824, r001: 0.49581 },
		{ n: 25, r005: 0.38086, r001: 0.48693 },
		{ n: 26, r005: 0.37389, r001: 0.47851 },
		{ n: 27, r005: 0.36728, r001: 0.47051 },
		{ n: 28, r005: 0.36101, r001: 0.46289 },
		{ n: 29, r005: 0.35505, r001: 0.45563 },
		{ n: 30, r005: 0.34937, r001: 0.44870 },
		{ n: 31, r005: 0.34396, r001: 0.44207 },
		{ n: 32, r005: 0.33879, r001: 0.43573 },
		{ n: 33, r005: 0.33384, r001: 0.42965 },
		{ n: 34, r005: 0.32911, r001: 0.42381 },
		{ n: 35, r005: 0.32457, r001: 0.41821 },
		{ n: 36, r005: 0.32022, r001: 0.41282 },
		{ n: 37, r005: 0.31603, r001: 0.40764 },
		{ n: 38, r005: 0.31201, r001: 0.40264 },
		{ n: 39, r005: 0.30813, r001: 0.39782 },
		{ n: 40, r005: 0.30440, r001: 0.39317 },
		{ n: 41, r005: 0.30079, r001: 0.38868 },
		{ n: 42, r005: 0.29732, r001: 0.38434 },
		{ n: 43, r005: 0.29396, r001: 0.38014 },
		{ n: 44, r005: 0.29071, r001: 0.37608 },
		{ n: 45, r005: 0.28756, r001: 0.37214 },
		{ n: 46, r005: 0.28452, r001: 0.36833 },
		{ n: 47, r005: 0.28157, r001: 0.36462 },
		{ n: 48, r005: 0.27871, r001: 0.36103 },
		{ n: 49, r005: 0.27594, r001: 0.35754 },
		{ n: 50, r005: 0.27324, r001: 0.35415 },
		{ n: 51, r005: 0.27063, r001: 0.35086 },
		{ n: 52, r005: 0.26809, r001: 0.34765 },
		{ n: 53, r005: 0.26561, r001: 0.34453 },
		{ n: 54, r005: 0.26321, r001: 0.34150 },
		{ n: 55, r005: 0.26087, r001: 0.33854 },
		{ n: 56, r005: 0.25859, r001: 0.33566 },
		{ n: 57, r005: 0.25637, r001: 0.33284 },
		{ n: 58, r005: 0.25420, r001: 0.33010 },
		{ n: 59, r005: 0.25209, r001: 0.32743 },
		{ n: 60, r005: 0.25003, r001: 0.32482 },
		{ n: 61, r005: 0.24803, r001: 0.32227 },
		{ n: 62, r005: 0.24606, r001: 0.31978 },
		{ n: 63, r005: 0.24415, r001: 0.31735 },
		{ n: 64, r005: 0.24228, r001: 0.31497 },
		{ n: 65, r005: 0.24045, r001: 0.31264 },
		{ n: 66, r005: 0.23866, r001: 0.31036 },
		{ n: 67, r005: 0.23691, r001: 0.30814 },
		{ n: 68, r005: 0.23520, r001: 0.30596 },
		{ n: 69, r005: 0.23352, r001: 0.30382 },
		{ n: 70, r005: 0.23188, r001: 0.30173 },
		{ n: 71, r005: 0.23028, r001: 0.29969 },
		{ n: 72, r005: 0.22871, r001: 0.29768 },
		{ n: 73, r005: 0.22716, r001: 0.29571 },
		{ n: 74, r005: 0.22565, r001: 0.29379 },
		{ n: 75, r005: 0.22417, r001: 0.29189 },
		{ n: 76, r005: 0.22272, r001: 0.29004 },
		{ n: 77, r005: 0.22130, r001: 0.28822 },
		{ n: 78, r005: 0.21990, r001: 0.28643 },
		{ n: 79, r005: 0.21853, r001: 0.28468 },
		{ n: 80, r005: 0.21718, r001: 0.28296 },
		{ n: 81, r005: 0.21586, r001: 0.28127 },
		{ n: 82, r005: 0.21457, r001: 0.27961 },
		{ n: 83, r005: 0.21329, r001: 0.27797 },
		{ n: 84, r005: 0.21204, r001: 0.27637 },
		{ n: 85, r005: 0.21081, r001: 0.27479 },
		{ n: 86, r005: 0.20960, r001: 0.27324 },
		{ n: 87, r005: 0.20841, r001: 0.27172 },
		{ n: 88, r005: 0.20725, r001: 0.27022 },
		{ n: 89, r005: 0.20610, r001: 0.26875 },
		{ n: 90, r005: 0.20497, r001: 0.26730 },
		{ n: 91, r005: 0.20386, r001: 0.26587 },
		{ n: 92, r005: 0.20276, r001: 0.26447 },
		{ n: 93, r005: 0.20169, r001: 0.26308 },
		{ n: 94, r005: 0.20063, r001: 0.26172 },
		{ n: 95, r005: 0.19958, r001: 0.26038 },
		{ n: 96, r005: 0.19856, r001: 0.25906 },
		{ n: 97, r005: 0.19755, r001: 0.25776 },
		{ n: 98, r005: 0.19655, r001: 0.25648 },
		{ n: 99, r005: 0.19557, r001: 0.25522 },
		{ n: 100, r005: 0.19460, r001: 0.25398 }
	],
	/**
	 * 滑动T检验 t分布表
	 * @type {Array}
	 */
	T: [
		{ v: 1, t005: 12.71, t001: 63.66 },
		{ v: 2, t005: 4.30, t001: 9.93 },
		{ v: 3, t005: 3.18, t001: 5.84 },
		{ v: 4, t005: 2.78, t001: 4.6 },
		{ v: 5, t005: 2.57, t001: 4.03 },
		{ v: 6, t005: 2.45, t001: 3.71 },
		{ v: 7, t005: 2.37, t001: 3.50 },
		{ v: 8, t005: 2.31, t001: 3.36 },
		{ v: 9, t005: 2.26, t001: 3.25 },
		{ v: 10, t005: 2.23, t001: 3.17 },
		{ v: 11, t005: 2.20, t001: 3.11 },
		{ v: 12, t005: 2.18, t001: 3.06 },
		{ v: 13, t005: 2.16, t001: 3.01 },
		{ v: 14, t005: 2.15, t001: 2.98 },
		{ v: 15, t005: 2.13, t001: 2.95 },
		{ v: 16, t005: 2.12, t001: 2.92 },
		{ v: 17, t005: 2.11, t001: 2.90 },
		{ v: 18, t005: 2.10, t001: 2.88 },
		{ v: 19, t005: 2.09, t001: 2.86 },
		{ v: 20, t005: 2.09, t001: 2.85 },
		{ v: 21, t005: 2.08, t001: 2.83 },
		{ v: 22, t005: 2.07, t001: 2.82 },
		{ v: 23, t005: 2.07, t001: 2.81 },
		{ v: 24, t005: 2.06, t001: 2.80 },
		{ v: 25, t005: 2.06, t001: 2.79 },
		{ v: 26, t005: 2.06, t001: 2.78 },
		{ v: 27, t005: 2.05, t001: 2.77 },
		{ v: 28, t005: 2.05, t001: 2.76 },
		{ v: 29, t005: 2.04, t001: 2.76 },
		{ v: 30, t005: 2.04, t001: 2.75 },
		{ v: 40, t005: 2.02, t001: 2.70 },
		{ v: 60, t005: 2.00, t001: 2.66 },
		{ v: 120, t005: 1.98, t001: 2.62 },
		{ v: Infinity, t005: 1.96, t001: 2.58 }
	]
};
