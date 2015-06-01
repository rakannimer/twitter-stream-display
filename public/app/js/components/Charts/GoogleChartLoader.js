//GoogleChart Singleton

var q = require('q');
var React = require('react');
var $ = require('jquery');

var GoogleChartLoader = function(){

	this.is_loading = false;
	this.loaded = false;
	this.google_promise = q.defer();
	this.url = "https://www.google.com/jsapi";
	this.packages = ["corechart"];
	this.init = function() {

		if (this.is_loading) {
			return this.google_promise.promise;
		}

		this.is_loading = true;
		self = this;

	 	var options = {
	    	dataType: "script",
	    	cache: true,
	    	url: this.url,
	  	};
	  	$.ajax(options).done(
	  		function(){
	    		google.load("visualization", "1", {
	      			packages:self.packages,
	      			callback: function() {
	      				console.log('AJAX DONE');

	      				self.loaded = true;
	        			self.google_promise.resolve();
	      			}
	    		});
	    });
	    return this.google_promise.promise;
	}
};

module.exports = new GoogleChartLoader();


// var GoogleChart = React.createClass({
// 	getInitialState: function() {
// 		return {
// 			is_loading: false,
// 			google_promise : q.deferred()
// 		};
// 	},
// 	get_google: function() {

// 	},
// 	load: function() {
// 		if (this.state.is_loading) {
// 			return this.google_promise;
// 		}

// 		this.state.is_loading = true;
// 		self = this;

// 	 	var options = {
// 	    	dataType: "script",
// 	    	cache: true,
// 	    	url: this.url,
// 	  	};
// 	  	jQuery.ajax(options).done(
// 	  		function(){
// 	    		google.load("visualization", "1", {
// 	      			packages:this.url,
// 	      			callback: function() {
// 	      				console.log("Here");
// 	        			self.google_promise.resolve();
// 	      			}
// 	    		});
// 	    });
// 	    return self.google_promise.promise();
// 	},
// 	render: function() {

// 		var graph;
// 		var data = [
//           ['Year', 'Sales', 'Expenses'],
//           ['2004',  1000,      400],
//           ['2005',  1170,      460],
//           ['2006',  660,       1120],
//           ['2007',  1030,      540]
//         ];
// 		switch(this.props.type) {
// 			case 'Line':
// 				return <LineChart  graphName = {this.props.graphName} data={data}  />;
// 				break;
// 		}
// 		// return (
// 		// 	<graph graphName=this.props.graphName />
// 		// );
// 	}
// });

// module.exports = GoogleChart;