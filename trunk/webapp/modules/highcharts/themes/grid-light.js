/**
 * Grid-light theme for Highcharts JS
 * @author Torstein Honsi
 */

// Load the fonts
// Highcharts.createElement('link', {
//     href: 'modules/highcharts/themes/fonts/dosis.css',
//     rel: 'stylesheet',
//     type: 'text/css'
// }, null, document.getElementsByTagName('head')[0]);

Highcharts.theme = {
	colors: ['#7CB5EC', '#F7A35C', '#90EE7E', '#7798BF', '#AAEEEE', '#FF0066', '#EEAAEE', '#55BF3B', '#DF5353', '#7798BF', '#AAEEEE'],
	chart: {
		backgroundColor: '#fff',
		style: {
			fontFamily: 'Microsoft YaHei, 微软雅黑, SimSun, 宋体, sans-serif'
		}
	},
	title: {
		style: {
			fontSize: '16px',
			fontWeight: 'bold'
		}
	},
	subtitle: {
		style: {
			fontSize: '14px'
		}
	},
	tooltip: {
		valueDecimals: 2,
		borderWidth: 0,
		backgroundColor: 'rgba(219,219,216,0.8)',
		shadow: false,
		style: {
			fontSize: '14px'
		}
	},
	legend: {
		itemStyle: {
			fontWeight: 'normal',
			fontSize: '14px',
			color: '#000'
		}
	},
	xAxis: {
		gridLineWidth: 0,
		labels: {
			style: {
				fontSize: '12px',
			}
		}
	},
	yAxis: {
		lineWidth: 1,
		tickWidth: 1,
		gridLineWidth: 0,
		title: {
			style: {
				fontSize: '14px',
				color: '#000'
			}
		},
		labels: {
			style: {
				fontSize: '14px'
			}
		}
	},
	plotOptions: {
		candlestick: {
			lineColor: '#404048'
		}
	},


	// General
	background2: '#F0F0EA'

};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);
