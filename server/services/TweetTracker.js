var IoServer = require('socket.io'),
	async = require('async'),
	q = require('q'),
	FifoQueue = require('fifo'),
	Tweets = require('../models/Tweets'),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('../creds.js').twitter,
	t = new Twitter(twitter_creds),
	StreamSettings = require('../models/StreamSettings');
	
var TweetTracker = function() {
	this.tweet_queue = new FifoQueue();
	this.sockets = {};
	this.current_search_terms = '';
	this.tweet_frequency = 400;
	this.is_streaming = false;
};
var tweet_model;


TweetTracker.prototype = {
	
	new_stream: function(search_terms) {
	},

	start_stream: function(search_terms) {
		this.current_search_terms = search_terms;
		var self = this;
		t.on('tweet', function(tweet) {
			self.tweet_received.call(self, tweet);
		});
		
		if (this.current_search_terms !== search_terms && this.is_streaming) {
			this.current_search_terms = search_terms; //SAVE TO DB;
			this.track_new(search_terms);
		}
		else {
			t.track(search_terms);
			self.is_streaming = true;	
		}
	},
	
	track_new: function(search_terms) {
		if (this.is_streaming) {
			t.untrack(this.current_search_terms);
			t.track(search_terms);
		}
		else {
			this.start_stream(search_terms);
		}
	},
	
	remove_client: function(socket){
		delete this.sockets[socket.id];
	},
	
	
	stream_to_client: function(socket, tweet_frequency) {
		if (this.is_streaming) {
			var self = this;
			var interval_id = setInterval(function(){self.emit_tweet.call(self, socket);}, tweet_frequency);
			this.sockets[socket.id] = {
				'socket' : socket,
				'interval_id': interval_id
			};
		}
	},

	emit_tweet: function(socket) {
		
		if (this.tweet_queue.isEmpty()) {
			return;
		}
		var tweet = this.tweet_queue.shift();
		socket.emit('server:tweet_received', JSON.stringify({
			'status': 'OK',
			'data' : {tweet:tweet}
		}));
	},

	tweet_received: function(tweet, socket) {
		var tweet_model = new Tweets({tweet:tweet, search_terms:this.current_search_terms});
		tweet_model.save(function(err){

		});
		Tweets.count().exec(function(err, docs){
			console.log("err ", err);
			console.log("docs ", docs);
		});
		this.tweet_queue.push(tweet);
	},

	update_frequency: function(socket, tweet_frequency) {
		var self = this;

		try {
			clearInterval(this.sockets[socket.id].interval_id);	
		}
		catch(err) {
			console.log(err);
		}

		var interval_id = setInterval(function(){ self.emit_tweet.call(self, socket); }, tweet_frequency);
		console.log("Updating frequency. Previous interval_id ",this.sockets[socket.id].interval_id," New interval : ", interval_id);
		this.sockets[socket.id].interval_id = interval_id;
	},

	broadcast: function(message) {
		for(var id in this.sockets) {
			if (id !== 'undefined') {
				this.sockets[id].emit('server:tweet_received', JSON.stringify({
					'status' : 'OK',
					'tweet': {tweet:message}
				}));				
			}
		}
	}
};

module.exports = TweetTracker;
