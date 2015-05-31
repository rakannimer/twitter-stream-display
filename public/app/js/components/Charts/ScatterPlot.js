var React = require('React');

var AppStore = require('../../stores/app-store');


var ScatterPlot = React.createClass({

	getInitialState: function() {
		return {
			loaded : false,
			stats: null
		};
	},
	componentDidMount: function() {
		var self = this;
		AppStore.listen(function(data){
			// var card_data = AppStore.cards[self.props.type];
			
			// if (card_data.stats !== null)
			// 	console.log("HERE");
			// 	console.log(card_data);
   //        		self.setState({'stats': card_data.stats});
   //        		self.setState({'counts':card_data.data.counts});
   //        		self.setState({'loaded' : true});
   //        		self.setState({'type' : card_data.type});

		});
	},

	plot_chart: function() {
		console.log(this.state.type);
		if (!this.state.loaded && this.state.type !== this.props.type) {
			return;
		}
		var data_name = this.props.type;
		var mean = this.state.stats.mean;
		var max = this.state.stats.max;
		var min = this.state.stats.min;
		var data = this.state.counts;
		var container = "#"+this.props.type+"_graph";
		
	},

	render: function() {
		var data = {
		    labels: ["January", "February", "March", "April", "May", "June", "July"],
		    datasets: [
		        {
		            label: "My First dataset",
		            fillColor: "rgba(220,220,220,0.2)",
		            strokeColor: "rgba(220,220,220,1)",
		            pointColor: "rgba(220,220,220,1)",
		            pointStrokeColor: "#fff",
		            pointHighlightFill: "#fff",
		            pointHighlightStroke: "rgba(220,220,220,1)",
		            data: [65, 59, 80, 81, 56, 55, 40]
		        },
		        {
		            label: "My Second dataset",
		            fillColor: "rgba(151,187,205,0.2)",
		            strokeColor: "rgba(151,187,205,1)",
		            pointColor: "rgba(151,187,205,1)",
		            pointStrokeColor: "#fff",
		            pointHighlightFill: "#fff",
		            pointHighlightStroke: "rgba(151,187,205,1)",
		            data: [28, 48, 40, 19, 86, 27, 90]
		        }
		    ]
		};
		return (
			<div id="chart_div"></div>
		);
	}
});
module.exports = ScatterPlot;