var express = require('express'),
	io = require('socket.io')(8075),
	fs = require('fs'),
	assert = require('assert'),
	tweet_queue = require('fifo')(),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('./server/creds.js').twitter,
	t = new Twitter(twitter_creds),
	bodyParser = require('body-parser'),
	db = require('./server/db.js'),
	q = require("q"),
 	currentSearchTerms = 'node.js,js,javascript',
	app = express(),
	port = process.env.PORT || 8080,
	users = [],
	currentSearchTerms = '',
	tweet,
	data,
	tweet_obj,
	timeBetweenTweets = 200;



app.use(express.static('public/'));
app.use(bodyParser.urlencoded({ extended: false }));	

db.init();
//db.getSearchTerms(function(result){
//	console.log(result);
//	process.exit();
//});

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
	var tweet_model = db.build_tweet_model(currentSearchTerms, tweet);
	db.insertTweet(tweet_model, function(){
		console.log("Inserted into mongo");
	});
	
	tweet_queue.push(tweet_model);
};


currentSearchTerms = 'node.js,js,javascript';
t.on('tweet', handle_tweet_received);

t.track(currentSearchTerms);
console.log("Tracking : " + currentSearchTerms);
//t.location('-180,-90,180,90',true);

var currentInterval = setInterval(emit_tweet,timeBetweenTweets);




app.post('/update_frequency', function(req, res) {
	console.log("POST: update_frequency");
	var new_interval = parseInt(req.body.frequency);
	clearInterval(currentInterval);
	currentInterval = setInterval(emit_tweet,new_interval);
	res.send('ok');
});

app.post('/search', function(req, res) {
	console.log("POST: search");
	var search_terms = req.body.search_terms;
	t.untrack(currentSearchTerms);	
	currentSearchTerms = search_terms;
	tweet_queue.removeAll();
	t.track(currentSearchTerms);
	res.send("ok");
});

app.post('/locations', function(req, res) {
	console.log("POST: locations");
	db.getTweetLocations(currentSearchTerms, function(tweets) {
		
		response = {
			'status' : 'OK',
		    'tweets' : tweets 
		};
		res.send(response);
	});
});


app.post('/metadata', function(req, res) {
	console.log("POST: metadata");
	db.getSearchTerms(function(result){
		response = {
			'status' : 'OK',
		    'tweets' : result,
		    'current_search_terms': currentSearchTerms 
		};
		res.send(response);
	});
	db.getTweetLocations(currentSearchTerms, function(tweets) {
		
	});
});

app.listen(port);

console.log("Application is running on http://localhost:8080")

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

