var express = require('express'),
	io = require('socket.io')(8075),
	fs = require('fs'),
	assert = require('assert'),
	tweet_queue = require('fifo')(),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('./creds.js').twitter,
	t = new Twitter(twitter_creds),
	bodyParser = require('body-parser'),
	db = require('./db.js');






var app = express(),
	port = process.env.PORT || 8080,
	users = [],
	currentSearchTerms = '',
	tweet,
	data,
	tweet_obj,
	timeBetweenTweets = 100;


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
db.init();


var emit_tweet = function() {
	if (!tweet_queue.isEmpty()) {
		tweet = tweet_queue.shift();
		data = {
			'status' : 'OK',
			'tweet': tweet
		};
		io.emit('server:tweet_received', JSON.stringify(data));
	}
};

var handle_tweet_received = function(tweet) {
	if (tweet.coordinates !== null) {
		if (tweet.coordinates){
			console.log("Found Location !");
			var location = {"lat": tweet.coordinates.coordinates[0],"lng": tweet.coordinates.coordinates[1]};
			tweet_obj = {
				tweet: tweet,
				location : location,
				search_terms : currentSearchTerms
			};

			db.insertTweet(tweet_obj, function(result){
				console.log("Inserted into mongo");
			});
		}
	}
	else {
		tweet_obj = {
			tweet: tweet,
			location : null,
			search_terms : currentSearchTerms
		};
	}
	
	tweet_queue.push(tweet_obj);
};

currentSearchTerms = 'dogs,pets,cats';
t.on('tweet', handle_tweet_received);

t.track(currentSearchTerms);
//t.location('-180,-90,180,90',true);

var currentInterval = setInterval(emit_tweet,timeBetweenTweets);

app.post('/update_frequency', function(req, res) {
	console.log("updating frequency");
	var new_interval = parseInt(req.body.frequency);
	clearInterval(currentInterval);
	currentInterval = setInterval(emit_tweet,new_interval);
});

app.post('/search', function(req, res) {
	var search_terms = req.body.search_terms;
	t.untrack(currentSearchTerms);	
	currentSearchTerms = search_terms;
	tweet_queue.removeAll();
	t.track(currentSearchTerms);
	res.send("ok");
});

app.post('/locations', function(req, res) {

});

app.listen(port);

console.log("Application is running on http://localhost:8080")

io.sockets.on('connection',function(socket){
	console.log('User connected  ');
	socket.on('start', function(){
		console.log("Client is ready to start receiving events");
	});

	socket.emit('connected', function(){
		console.log('Server ready to start streaming data');
	});

	socket.on('disconnect', function(o){
		console.log('User disconnected : ');
		console.log(o);
	});
});

var stopStream = function() {
	socket.disconnect();
};

var restartStream = function() {
	socket.connect();
};
