var async = require('async'),
	tweet_queue = require('fifo')(),
	io = require('socket.io')(8075),
	db = require('./db.js').init(),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('./creds.js').twitter,
	t = new Twitter(twitter_creds),
	mongojs = require('mongojs'),
	q = require("q"),
	timeBetweenTweets = 200,
	twitter_dashboard = {
		current_search_terms:'',
		tweet_queue :tweet_queue,
		init: function() {
			var self = this;
			this.get_current_search_terms().then(function(){
				self.track_tweets();
				self.current_interval = setInterval(function(){self.emit_tweet(self);}, self.time_between_tweets);
			});
		},
		
		get_current_search_terms: function() {
			var deferred = q.defer();
			var self = this;
			if (this.current_search_terms !== '') {
				deferred.resolve(this.current_search_terms);
			}
			db.get_current_search_terms().then(function(current_search_terms){
				self.current_search_terms = current_search_terms;
				deferred.resolve(current_search_terms);	
			});
			return deferred.promise;
		},
		
		emit_tweet : function(self) {
			if (self.tweet_queue.isEmpty()) {
				return;
			}
			var tweet = self.tweet_queue.shift();
			var data = {
				'status' : 'OK',
				'tweet': tweet
			};
			io.emit('server:tweet_received', JSON.stringify(data));
		},
		
		handle_tweet_received : function(self, tweet) {
			var tweet_model = db.build_tweet_model(self.current_search_terms, tweet);
			db.insertTweet(tweet_model, function(){
				console.log("Inserted into mongo");
			});
			
			this.tweet_queue.push(tweet_model);
		},
		
		track_tweets: function() {
			var self = this;
			t.on('tweet', function(tweet){
				self.handle_tweet_received(self,tweet);
			});
			t.track(self.current_search_terms);
		},
		
		update_frequency: function(interval) {
			var self = this;
			clearInterval(this.current_interval); 
			console.log(interval);
			self.current_interval = setInterval(function(){self.emit_tweet(self);}, interval);
			console.log(self.current_interval);
		},
		
		update_search_terms: function(search_terms) {
			var deferred = q.defer(); 
			var self = this;
			t.untrack(self.current_search_terms);
			this.tweet_queue.removeAll();
			t.track(search_terms);
			self.current_search_terms = search_terms;
			db.update_current_search_terms(1,search_terms).then(function(doc){
				return deferred.resolve(doc);
			});
			return deferred.promise;
		},
		get_history: function() {
			var deferred = q.defer();
			var self = this;
			db.get_search_history()
			.then(function(history) {
				return deferred.resolve(history);
			});
			return deferred.promise;
		},
		get_tweet_locations: function() {
			var deferred = q.defer();
			var self = this;
			//Get from db if not in memory 
			this.get_current_search_terms()
			.then(function(search_terms){
				return db.get_tweet_locations(self.current_search_terms);
			})
			.then(function(locations){
				return deferred.resolve(locations);
			});
			
			return deferred.promise;
		},
		
		init_sockets: function() {
			// Move to different object
			io.sockets.on('connection',function(socket){
				console.log("SOCKET:RECEIVED connection");
				socket.on('start', function(){
					console.log("SOCKET:RECEIVED start")
					console.log("Client is ready to start receiving events");
				});
			
				socket.emit('connected', function(){
					console.log("SOCKET:EMIT connected")
				});
			
				socket.on('disconnect', function(o){
					console.log("SOCKET:RECEIVED disconnect",o)
				});
			});
		}
		
	
	};
	
module.exports = twitter_dashboard;