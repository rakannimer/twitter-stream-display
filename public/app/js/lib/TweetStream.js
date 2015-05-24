
//socket.io is loaded from CDN, browserify npm module is outdated
var tweetDomCreator = require('../tweet-dom-creator.js'),
	q = require('q'),
	$ = global.$,
	Toast = require('./Toast'),
	Chart = require('chart.js'),
	language_codes = require('../language_codes');



var TweetStream = function() {
	var self = this;
	this.tweets_displayed = 0;
	this.showing_stream = false;
	this.socket = null;
	this.get_current_search_terms().then(this.render_search_terms);
	this.bind_dom_events();
	this.bar_chart = null;
};

TweetStream.prototype = {

	toggle_stream: function() {
		if (this.showing_stream === true) {
			this.stop_tweet_stream();
			this.socket.disconnect();
			this.socket = null;
			Toast.log('Disconnected','info');
		}
		else {
			if (this.socket === null)
				this.socket = io.connect('http://localhost:8075');	
			else 
				this.socket = io.connect('http://localhost:8075',{'forceNew': true});
			this.bindTo_socket_events();
			var search_terms = $("#search").val();
			this.start_tweet_stream(search_terms);
		}
		this.showing_stream = !this.showing_stream;
	},

	stop_tweet_stream: function() {
		this.socket.emit('server:stop_tweets');
	},

	bindTo_socket_events: function() {
		var self = this;
		this.socket.on("connected", function() {
			
			//self.hide_loading('tweets');
			Toast.log('Connected (ʘ‿ʘ)','success');
		});

		this.socket.on("disconnected", function() {
			Toast.log('Disconnected (一_一) ','error');
		});
	},

	start_tweet_stream: function(search_terms) {
		//this.socket.emit('server:stream_tweets');
		this.socket.emit('server:new_stream',{search_terms: search_terms});

		this.listen_to_tweet_stream();
	},

	listen_to_tweet_stream: function() {
		var self = this;
		this.socket.on('server:tweet_received', function(tweet_data){
			tweet_data = JSON.parse(tweet_data);
			if (tweet_data.status === 'OK') {
				if (tweet_data.data.geotagged === true) {
					var tweetNode = tweetDomCreator.createNode(tweet_data.data.tweet);
					$htmlTweetNode.find('.tweet').addClass("fancy_border");
					$("#tweets").prepend($htmlTweetNode.html());
				}
				else {
					tweetDomCreator.prependToNode(tweet_data.data.tweet, "#tweets");
				}
			}
		});
	},

	get_current_search_terms: function() {
		var deferred = q.defer();
		var self = this;
		$.get('/stream_settings/search',{},function(response){
			self.current_search_terms = response.data.current_search_terms;
			return deferred.resolve(self.current_search_terms);
		});
		return deferred.promise;	
	},

	render_search_terms: function(current_search_terms) {
		$('#current_search_terms').html(current_search_terms);
	},

	bind_dom_events: function() {
		var self = this;
		$("#search").on('keypress', function(e){
			var search_terms = $(this).val();
			if(e.which == 13) {
        		self.new_search.call(self, search_terms);
    			return false;
    		}
    		
		});
		$("#update_tweet_frequency").on('click', function() { 
			//Check if socket initiated 
			self.update_frequency.call(self);
		});
		$("#stream_toggle").on('click', function() {
			self.toggle_stream.call(self);
		});
		
	},

	new_search: function(search_query) {
		var self = this;
		this.show_history_loading();
		$.post('/mine/history_from_api', {search_query: search_query}, function(response) {
			if (response.status !== 'OK') { console.log("error ", response); return;}
			self.render_history(response.data);
		});
	},

	update_frequency: function() {
		var tweet_frequency = parseInt($("#tweet_frequency").val());
		tweet_frequency = tweet_frequency*1000;
		this.socket.emit('server:update_frequency', {tweet_frequency: tweet_frequency});
	},


	render_history: function(history) {

		$("#popularity").html(history.popularity_percentage + "%");
		$("#geotagged").html(history.geotagged_percentage + "%");
		$("#average_hashtag").html(history.hashtag_stats.mean);

		var languages = [];
		var tweet_count = [];
		Object.keys(history.tweet_count_by_language).forEach(function(key){
			languages.push(language_codes[key].name);
			tweet_count.push(history.tweet_count_by_language[key]);
		});
		tweet_count.sort(function(a, b){return b-a});
		$("#languages_chart").show();
		this.plot_bar_chart(languages, tweet_count, "#languages_chart");
	},
	show_history_loading: function(){
		var loading_div = $("#loading").clone().html();
		console.log(loading_div);
		$("#popularity").html(loading_div).removeClass('hide');
		$("#geotagged").html(loading_div);
		$("#average_hashtag").html(loading_div);
		//$("#languages").prepend(loading_div);
	},


	plot_bar_chart: function(labels, data, div_selector) {
		if (this.bar_chart !== null) {
			this.bar_chart.destroy();
			
			//return;
		}
		var ctx = $(div_selector).get(0).getContext("2d");

		var data = {
		    labels: labels,
		    datasets: [
		        {
		            label: "Tweet Count By Language",
		            fillColor: "rgba(220,220,220,0.2)",
		            strokeColor: "rgba(220,220,220,1)",
		            pointColor: "rgba(220,220,220,1)",
		            pointStrokeColor: "#fff",
		            pointHighlightFill: "#fff",
		            pointHighlightStroke: "rgba(220,220,220,1)",
		            data: data
		        }
	    	]
		};

		this.bar_chart = new Chart(ctx).Bar(data,{});
	}

};

module.exports = TweetStream;