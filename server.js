var express = require('express'),
	io = require('socket.io')(8076),
	fs = require('fs'),
	assert = require('assert'),
	tweet_queue = require('fifo')(),
	Twitter = require('node-tweet-stream'),
	twitter_creds = require('./server/creds.js').twitter,
	t = new Twitter(twitter_creds),
	bodyParser = require('body-parser'),
	db = require('./server/db.js').init(),
	q = require("q"),
	app = express(),
	router = express.Router(),
	port = process.env.PORT || 8080,
	users = [],
	currentSearchTerms = '',
	tweet,
	data,
	tweet_obj,
	timeBetweenTweets = 200,
	exec = require('child_process').exec,
	uuid= require('node-uuid'),
	r_helper = require('./server/r_helper.js'),
	twitter_dashboard = require('./server/twitter_dashboard.js');


app.use(express.static('public/'));
app.use(bodyParser.urlencoded({ extended: false }));	

router.post('/compile_code',function(req, res){  });

router.post('/frequency', function(req, res) { 
	console.log("POST: frequency");
	var interval = parseInt(req.body.frequency);
	twitter_dashboard.update_frequency(interval);
	res.send({status:'OK', message:'FREQUENCY_UPDATED'});
});

router.post('/search', function(req, res){ 
	console.log("POST: search");
	var search_terms = req.body.search_terms;
	twitter_dashboard.update_search_terms(search_terms)
	.then(function(doc){
		res.send({status:'OK', message:'SEARCH_TERMS_UPDATED'});
	});
	return;
});
router.post('/locations', function(req, res){  });
router.post('/mined_data', function(req, res){  });


app.use(router);

twitter_dashboard.init();
//t.on('tweet', handle_tweet_received);
//t.track(currentSearchTerms);
//console.log("Tracking : " + currentSearchTerms);

//t.location('-180,-90,180,90',true);


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

		});
	});	
	})
		

});


app.post('/update_frequency', function(req, res) {
	
});

app.post('/search', function(req, res) {
//	console.log("POST: search");
//	var search_terms = req.body.search_terms;
//	t.untrack(currentSearchTerms);	
//	currentSearchTerms = search_terms;
//	tweet_queue.removeAll();
//	t.track(currentSearchTerms);
//	res.send("ok");
});

app.post('/locations', function(req, res) {
	console.log("POST: locations");
	db.getTweetLocations(currentSearchTerms, function(tweets) {
		
		var response = {
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



