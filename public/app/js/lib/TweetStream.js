
//socket.io is loaded from CDN, browserify npm module is outdated
var tweetDomCreator = require('../tweet-dom-creator.js'),
	q = require('q'),
	$ = require('jquery'),
	Toast = require('./Toast');

var TweetStream = function() {
	var self = this;
	this.tweets_displayed = 0;
	this.showing_stream = false;
	this.socket = null;
	this.get_current_search_terms().then(this.render_search_terms);
	this.bind_dom_events();
};

TweetStream.prototype = {

	toggle: function() {
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
			this.start_tweet_stream();
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

	start_tweet_stream: function() {
		this.socket.emit('server:stream_tweets');
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
		$("#update_frequency").on('click', function() { 
			self.update_frequency.call(self);
		});
		$("#stream_toggle").on('click', function() {
			self.toggle.call(self);
		});
	},
	update_frequency: function() {
		var tweet_frequency = parseInt($("#tweet_frequency").val());
		tweet_frequency = tweet_frequency*1000;
		this.socket.emit('server:update_frequency', {tweet_frequency: tweet_frequency});
	}

};

module.exports = TweetStream;