var express = require('express'),
	io = require('socket.io')(8075),
	fs = require('fs'),
	tweet_queue = require('fifo')(),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('./creds.js').twitter;
	t = new Twitter(twitter_creds);


var app = express();
var port = process.env.PORT || 8080;
var users = [];
var bodyParser = require("body-parser");
var currentSearchTerms = ''
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

var tweet = {};
var data = {};
var emit_tweet = function() {
	if (!tweet_queue.isEmpty()) {
		tweet = tweet_queue.shift();
		data = {
			'status' : 'OK',
			'tweet': tweet
		};
		io.emit('server:tweet_received', JSON.stringify(data));
	}
	
}
var handle_tweet_received = function(tweet) {
	tweet_queue.push(tweet);
}
currentSearchTerms = 'ice cream';
t.on('tweet',handle_tweet_received);
t.track(currentSearchTerms);
var currentInterval = setInterval(emit_tweet,2000);

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
