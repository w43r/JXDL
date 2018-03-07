/**
 * 气候要素标准配色方案
 * @type {Object}
 */
StyleManager.commonStyles = {
	/**
	 * 气温一般配色
	 * @type {Array}
	 */
	tempStyles: [
		[-Infinity, -2, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[-2, 2, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[2, 10, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[10, 22, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[22, 35, {
			stroke: false,
			fill: true,
			fillColor: '#ffff00',
			fillOpacity: '0.92'
		}],
		[35, 37, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[37, 40, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[40, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 5~9月气温
	 * @type {Array}
	 */
	temp5to9Styles: [
		[-Infinity, 22, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[22, 25, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[25, 30, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[30, 35, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[35, 37, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[37, 40, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[40, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 3~4 |　10~11月
	 * @type {Array}
	 */
	temp3to4or10to11Styles: [
		[-Infinity, 10, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[10, 15, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[15, 18, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[18, 22, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[22, 25, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[25, 30, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[30, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 12月至2月
	 * @type {Array}
	 */
	temp12to2Styles: [
		[-Infinity, -2, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[-2, 2, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[2, 10, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[10, 15, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[15, 18, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[18, 22, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[22, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 气温距平
	 * @type {Array}
	 */
	tempAnomaly: [
		[-Infinity, -6, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[-6, -4, {
			stroke: false,
			fill: true,
			fillColor: '#004ca8',
			fillOpacity: '0.92'
		}],
		[-4, -2, {
			stroke: false,
			fill: true,
			fillColor: '#0096ff',
			fillOpacity: '0.92'
		}],
		[-2, -1, {
			stroke: false,
			fill: true,
			fillColor: '#84b9fb',
			fillOpacity: '0.92'
		}],
		[-1, 0, {
			stroke: false,
			fill: true,
			fillColor: '#abf7eb',
			fillOpacity: '0.92'
		}],
		[0, 1, {
			stroke: false,
			fill: true,
			fillColor: '#eefdca',
			fillOpacity: '0.92'
		}],
		[1, 2, {
			stroke: false,
			fill: true,
			fillColor: '#fde37d',
			fillOpacity: '0.92'
		}],
		[2, 4, {
			stroke: false,
			fill: true,
			fillColor: '#fa9200',
			fillOpacity: '0.92'
		}],
		[4, 6, {
			stroke: false,
			fill: true,
			fillColor: '#f05d04',
			fillOpacity: '0.92'
		}],
		[6, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#e60000',
			fillOpacity: '0.92'
		}]
	],
	rain1hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 1.5, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[1.5, 7.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[7.0, 15.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[15.0, 40.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[40.0, 50.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[50.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 3小时降水
	 * @type {Array}
	 */
	rain3hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 3.0, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[3.0, 10.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[10.0, 20.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[20.0, 50.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[50.0, 70.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[70.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 6小时降水
	 * @type {Array}
	 */
	rain6hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 4.0, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[4.0, 13.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[13.0, 25.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[25.0, 60.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[60.0, 120.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[120.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 12小时降水
	 * @type {Array}
	 */
	rain12hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 5.0, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[5.0, 15.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[15.0, 30.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[30.0, 70.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[70.0, 140.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[140.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 24小时降水
	 * @type {Array}
	 */
	rain24hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 10.0, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[10.0, 25.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[25.0, 50.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[50.0, 100.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[100.0, 250.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[250.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 日降水 夏秋季
	 * 降水过程
	 * @type {Array}
	 */
	rainDaySummerAutumnStyles: [
		[0, 10, {
			stroke: false,
			fill: false
		}],
		[1, 10, {
			stroke: false,
			fill: true,
			fillColor: '#a1f18d',
			fillOpacity: '0.92'
		}],
		[10, 25, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[25, 50, {
			stroke: false,
			fill: true,
			fillColor: '#60b8ff',
			fillOpacity: '0.92'
		}],
		[50, 100, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[100, 250, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[250, 400, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[400, 600, {
			stroke: false,
			fill: true,
			fillColor: '#ffaa00',
			fillOpacity: '0.92'
		}],
		[600, 1000, {
			stroke: false,
			fill: true,
			fillColor: '#ff6600',
			fillOpacity: '0.92'
		}],
		[1000, 1500, {
			stroke: false,
			fill: true,
			fillColor: '#e60000',
			fillOpacity: '0.92'
		}],
		[1500, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#990000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 日降水 冬春
	 * 降水过程
	 * @type {Array}
	 */
	rainDayWinterSpringStyles: [
		[0, 1, {
			stroke: false,
			fill: false
		}],
		[1, 5, {
			stroke: false,
			fill: true,
			fillColor: '#a1f18d',
			fillOpacity: '0.92'
		}],
		[5, 10, {
			stroke: false,
			fill: true,
			fillColor: '#50d270',
			fillOpacity: '0.92'
		}],
		[10, 25, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[25, 50, {
			stroke: false,
			fill: true,
			fillColor: '#60b8ff',
			fillOpacity: '0.92'
		}],
		[50, 100, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[100, 250, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[250, 400, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[400, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ffaa00',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 降水距平百分率
	 * @type {Array}
	 */
	rainAnomalyRateStyles: [
		[-Infinity, -400, {
			stroke: false,
			fill: true,
			fillColor: '#e60000',
			fillOpacity: '0.92'
		}],
		[-400, -200, {
			stroke: false,
			fill: true,
			fillColor: '#ff6464',
			fillOpacity: '0.92'
		}],
		[-200, -100, {
			stroke: false,
			fill: true,
			fillColor: '#ff9966',
			fillOpacity: '0.92'
		}],
		[-100, -50, {
			stroke: false,
			fill: true,
			fillColor: '#ffd280',
			fillOpacity: '0.92'
		}],
		[-50, 0, {
			stroke: false,
			fill: true,
			fillColor: '#effe63',
			fillOpacity: '0.92'
		}],
		[0, 50, {
			stroke: false,
			fill: true,
			fillColor: '#a1f18d',
			fillOpacity: '0.92'
		}],
		[50, 100, {
			stroke: false,
			fill: true,
			fillColor: '#9cffff',
			fillOpacity: '0.92'
		}],
		[100, 200, {
			stroke: false,
			fill: true,
			fillColor: '#009999',
			fillOpacity: '0.92'
		}],
		[200, 400, {
			stroke: false,
			fill: true,
			fillColor: '#0096ff',
			fillOpacity: '0.92'
		}],
		[400, 800, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[800, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#4c0073',
			fillOpacity: '0.92'
		}]
	],
	rainAnomalyRateStyles2: [ // 降水总量距平率
		[-Infinity, -100, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: '#9d2438',
			fillOpacity: '0.8'
		}],
		[-100, -80, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(255,0,0)',
			fillOpacity: '0.8'
		}],
		[-80, -50, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(255,100,100)',
			fillOpacity: '0.8'
		}],
		[-50, -20, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(255,150,100)',
			fillOpacity: '0.8'
		}],
		[-20, 0, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(255,255,150)',
			fillOpacity: '0.8'
		}],
		[0, 20, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(200,255,200)',
			fillOpacity: '0.8'
		}],
		[20, 50, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(50,200,50)',
			fillOpacity: '0.8'
		}],
		[50, 80, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(0,255,255)',
			fillOpacity: '0.8'
		}],
		[80, 100, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(0,150,255)',
			fillOpacity: '0.8'
		}],
		[100, Infinity, {
			stroke: true,
			strokeWidth: .2,
			strokeColor: '#000',
			fill: true,
			fillColor: 'rgb(0,0,255)',
			fillOpacity: '0.8'
		}]
	],
	/**
	 * 48小时降水
	 * @type {Array}
	 */
	rain48hStyles: [
		[0, 0.1, {
			stroke: false,
			fill: false
		}],
		[0.1, 10.0, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[10.0, 25.0, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[25.0, 50.0, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[50.0, 100.0, {
			stroke: false,
			fill: true,
			fillColor: '#0000e1',
			fillOpacity: '0.92'
		}],
		[100.0, 250.0, {
			stroke: false,
			fill: true,
			fillColor: '#fa00fa',
			fillOpacity: '0.92'
		}],
		[250.0, 400.0, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[400.0, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 相对湿度配色
	 * @type {Array}
	 */
	rhStyles: [
		[-Infinity, 20, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[20, 40, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[40, 60, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[60, 80, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[80, 90, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[90, 95, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[95, 100, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 风速
	 * @type {Array}
	 */
	windVStyles: [
		[-Infinity, 1.6, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[1.6, 3.4, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[3.4, 5.5, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[5.5, 10.8, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[10.8, 17.2, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[17.2, 24.5, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[24.5, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	/**
	 * 风速（等级）
	 * @type {Array}
	 */
	windSStyles: [
		[-Infinity, 1, {
			stroke: false,
			fill: true,
			fillColor: '#a6f28f',
			fillOpacity: '0.92'
		}],
		[1, 2, {
			stroke: false,
			fill: true,
			fillColor: '#3dba3d',
			fillOpacity: '0.92'
		}],
		[2, 3, {
			stroke: false,
			fill: true,
			fillColor: '#61b8ff',
			fillOpacity: '0.92'
		}],
		[4, 5, {
			stroke: false,
			fill: true,
			fillColor: '#0000ff',
			fillOpacity: '0.92'
		}],
		[6, 7, {
			stroke: false,
			fill: true,
			fillColor: '#ff00ff',
			fillOpacity: '0.92'
		}],
		[8, 9, {
			stroke: false,
			fill: true,
			fillColor: '#800040',
			fillOpacity: '0.92'
		}],
		[10, Infinity, {
			stroke: false,
			fill: true,
			fillColor: '#ff0000',
			fillOpacity: '0.92'
		}]
	],
	mciStyles: [
		[-Infinity, -2, {
			title: '特旱',
			stroke: false,
			fill: true,
			fillColor: '#700016',
			fillOpacity: '0.8'
		}],
		[-2, -1.5, {
			title: '重旱',
			stroke: false,
			fill: true,
			fillColor: '#fe0000',
			fillOpacity: '0.8'
		}],
		[-1.5, -1, {
			title: '中旱',
			stroke: false,
			fill: true,
			fillColor: '#fe9533',
			fillOpacity: '0.8'
		}],
		[-1, 0, {
			title: '轻旱',
			stroke: false,
			fill: true,
			fillColor: '#ffff8b',
			fillOpacity: '0.8'
		}],
		[0, Infinity, {
			title: '正常',
			stroke: false,
			fill: true,
			fillColor: '#fff',
			fillOpacity: '0.8'
		}]
	]
}
