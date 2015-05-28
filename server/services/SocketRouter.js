var Promise = require("bluebird"),
	IoServer = require('socket.io'),
	TweetTracker = require('./TweetTracker'),
	StreamSettings = require('../models/StreamSettings');
	
var SocketRouter = function() {
	
	this.io = new IoServer(8075);

	var tweet_tracker = new TweetTracker();

	this.io.sockets.on('connection',function(socket) {
		socket.emit('connected', function(){});
		
		socket.on('server:stream_tweets', function() {
			if (tweet_tracker.is_streaming) {
				tweet_tracker.stream_to_client(socket);	
			}
			else {
				
				StreamSettings.get({user_id:1})
				.then(function(settings){
					tweet_tracker.start_stream(settings.current_search_terms);
					return settings.tweet_frequency;
				})
				.then(function(tweet_frequency) {
					tweet_tracker.stream_to_client(socket, tweet_frequency);
					socket.emit('server:streaming_tweets');
				});
			}
		});
		
		socket.on('server:new_stream', function(data) {
			console.log(data);
			StreamSettings.get({user_id:1})
				.then(function(settings){
					if (data.search_terms === ''){
						tweet_tracker.start_stream(settings.current_search_terms);	
					} 
					else {
						tweet_tracker.start_stream(data.search_terms);		
					}
					return settings.tweet_frequency;
				})
				.then(function(tweet_frequency) {
					tweet_tracker.stream_to_client(socket, tweet_frequency);
					socket.emit('server:streaming_tweets');
				});
		});

		socket.on('server:update_frequency', function(data){
			StreamSettings.update_frequency_by_user_id(1, data.tweet_frequency);
			tweet_tracker.update_frequency(socket, data.tweet_frequency);
		});
		
		socket.on('server:stop_tweets', function() {
			tweet_tracker.remove_client(socket);
		});
		
		socket.on('disconnect', function(o) {
			tweet_tracker.remove_client(socket);
		});
	
	});
	
	this.on_connection = function(self, socket) {
		socket.emit('connected', function(){});
	};
	
};

module.exports = SocketRouter;
