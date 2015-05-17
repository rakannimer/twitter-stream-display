var express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	router = express.Router(),
	port = 8080,
	r_helper = require('./server/r_helper.js'),
	//twitter_dashboard = require('./server/twitter_dashboard.js'),
	TweetTracker = require('./server/services/TweetTracker'),
	routes = require('./server/routes'),
	SocketRouter = require('./server/services/SocketRouter'),
	StreamSettings = require('./server/models/StreamSettings'),
	mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/tweet_streams/', function(err){
	if (err) {throw err; }

	
	var socket_router = new SocketRouter();
	var tweet_tracker = new TweetTracker();

	StreamSettings.get({user_id:1})
		.then(function(settings){
			tweet_tracker.start_stream(settings.current_search_terms);
			return settings.tweet_frequency;
		})




app.use(express.static('public/'));
app.use(bodyParser.urlencoded({ extended: false }));	

//var routes = require('./server/routes');
app.use('/', routes);
app.use(router);
//twitter_dashboard.init();
app.listen(port);
console.log("Application is running on http://localhost:8080")


});

/*
	routes/
		stream_settings.js
			POST frequency	
			POST search
			GET  search
		mine.js
			GET	 locations
			GET  history
		code.js
			GET  examples
			POST compile
 */
	
/*

router.post('/compile_code',function(req, res){
	
	r_helper.compile(req.body.code).then(function(data) {
		var status = (data.output.err === null)?'OK':'ERROR';
		var response = {
			status: status,
			data: data
		};
		res.send(response);

	});
});

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
});

router.get('/search', function(req, res){
	console.log("GET: search");
	twitter_dashboard.get_current_search_terms()
	.then(function(search_terms){
		res.send({'status':'ok', 'data': {current_search_terms: search_terms}});
	});
});

router.get('/locations', function(req, res){  
	twitter_dashboard.get_tweet_locations()
	.then(function(locations){
		res.send({status:'OK', message:'LOCATIONS_GRABBED', data: locations});
	});
});

router.get('/search_history', function(req, res){ 
	twitter_dashboard.get_history()
	.then(function(history){
		var response = {
			'status' : 'OK',
		    'data' : history,
		};
		res.send(response);
	});
 });

router.get('/r_examples', function(req, res){
	r_helper.get_examples().then(function(examples){
		var response = {
			'status' : 'OK',
		    'data' : examples
		};
		console.log(response);
		res.send(response);
	});
});

*/





