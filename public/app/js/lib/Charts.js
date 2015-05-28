var c3 = require('c3')
var $ = global.$;
var Charts = function() {

};
Charts.prototype = {

	draw_scatter_plot : function(container, data, stats ) {
		var data_name = 'sentiment';
		var mean = stats.mean;
		var max = stats.max;
		var min = stats.min;
		console.log("container ", container);
		console.log("data ", data);
		
		data.unshift(data_name);
		var x = ['x'];
		for (var i = 0; i < data.length; i++) {
			x.push[i];
		};
		$(container).css('background-color','white');

		var colors = {};
		colors[data_name] =  'orange';//'#29abe1';


		var chart = c3.generate({
			bindto: container,
		    data: {
		       columns: [
		           data
		       ],
		        
		        type: "scatter",
		        colors: colors,
		    },
		    grid: {
		    	y: {
				    lines: [
				    	{value: mean, text: 'Mean: '+mean, class: 'mean-label'},
				    	{value: 0, text: '', class: 'x-axis'}
				    ]
  				},
  				x: {
  					show: true
  				}
		    },
		    tooltip: {
		        format: {
		            title: function (d) { return 'Data ' + d; },
		            value: function (value, ratio, id) {
		                var format = id === 'sentiment' ? d3.format(',') : d3.format('$');
		                console.log(format(value));
		                return format(value);
		            }
		//            value: d3.format(',') // apply this format to both y and y2
		        }
		       // ,
		     //   contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
    		//		return '<span style="color:black;"> TOOLTIP </span>';
  			//	}
		    },

		    axis: {
		        y: {
		            label: 'Sentiment Score'
		        }
		    }

		});

	},
	draw_bar_chart: function(container, data, stats ) {
		console.log(container+ " ", data+" ",stats+" " );
		var chart = c3.generate({
		    data: {
		        json: {
		            
		        }
		    }
		});
	}
};
var charts = new Charts();
module.exports = charts;