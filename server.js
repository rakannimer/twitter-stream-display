var express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	router = express.Router(),
	port = process.env.PORT || 8080,
	r_helper = require('./server/r_helper.js'),
	twitter_dashboard = require('./server/twitter_dashboard.js');


app.use(express.static('public/'));
app.use(bodyParser.urlencoded({ extended: false }));	
app.use(router);

router.post('/compile_code',function(req, res){
	r_helper.compile(req.body.code).then(function(output) {
		res.send({status:'OK', data: output})
		console.log("OUTPUT : ", output);
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
	var search_terms = twitter_dashboard.get_current_search_terms()
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



twitter_dashboard.init();
app.listen(port);
console.log("Application is running on http://localhost:8080")



