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
	timeBetweenTweets = 200,
	exec = require('child_process').exec,
	uuid= require('node-uuid');


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


app.post('/compile_code', function(req, res) {
	console.log("POST: compile_code");
	var folderName = 'r-twitter-'+uuid.v1();
	var folderPath = './public/user-code/'+folderName;
	var publicPath = '/user-code/'+folderName;
	var codeFilePath = folderPath+'/code.r';
	console.log(codeFilePath);
	//var resultGraph = './server/R/'+fileName+'.jpg';
	var code = "#!/usr/bin/env Rscript \n setwd('"+folderPath+"')  \n   options(device = function() png(width = 960)) \n ";
	code += req.body.code;
	var response = {};
	
	fs.mkdir(folderPath,function(params) {
		fs.writeFile(codeFilePath, code, function(err){
		if(err) {
			response.status = 'error';
			response.message = err;
	        return console.log(err);
	    }
		
	    console.log("The file was saved:");
		console.log("File path :", codeFilePath);
		console.log("File Content :", code);
		exec('Rscript '+codeFilePath, function(error, stdout, stderr) {
			console.log("Done executing Rscript");
			
			if (error !== null) {
				response.status  = 'error';
				
				response.message = {output: stderr};
				res.send(response);
				return;
				//Refactor !
			}
			response.status = 'ok';
			
			console.log('error : ', error);
			console.log('stderr : ', stderr);
			console.log('stdout : ', stdout);
			var graphPaths = [];
			fs.readdir(folderPath, function(err, files) {
				if (err !== null) {
					response.status = 'error';
					response.message = 'Error reading directory';
					console.log("Error reading from directory", err);
				}
				
				for (var i = 0; i < files.length; i++) {
					if (files[i].indexOf(".png") > -1){
						graphPaths.push(publicPath+'/'+files[i]);
						console.log("Image Found");
					}
				}
				response.message = {
					graphs:	graphPaths,
					output: stdout
				};
				res.send(response);
				//Refactor !
			});
//			exec('ls | grep .png', function(error, stdout, stderr) {
//				console.log('error : ', error);
//				console.log('stderr : ', stderr);
//				console.log('stdout : ', stdout);
//			});
			/*
				options(device = function() png(width = 960))
				cars <- c(1, 3, 6, 4, 9)
				plot(cars)
				cars2 <- c(1, 2, 3, 4, 5)
				plot(cars2)
			*/
		});
	});	
	})
		

});


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
	console.log(" POST: metadata");
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

