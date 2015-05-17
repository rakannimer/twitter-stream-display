var express = require('express'),
	StreamSettings = require('../models/StreamSettings'),
	Response = require('../services/response'),
	TweetTracker = require('../services/TweetTracker'),
	router = express.Router();
	
router.post('/frequency', set_tweet_frequency);
router.post('/search', set_current_search_terms);
router.get('/search', get_current_search_terms);

function set_tweet_frequency(req, res, next) {
	
	var tweet_frequency = parseInt(req.body.frequency);
	StreamSettings.findOneAndUpdate( {user_id: 1},
	{tweet_frequency: tweet_frequency}, {new: true}, function(err,doc) {
		if (err === null) {
			console.log(doc);
			Response.sendOk(res, {tweet_frequency:doc.tweet_frequency});
		}
		else {
			Response.sendError(res, err);
		}
	}
	);
}

function get_current_search_terms(req, res, next) {
	
	StreamSettings.findOne({user_id : 1}, 
	function(err,search_terms) { 
		if (err === null) {
			Response.sendOk(res, search_terms);
		}
		else {
			Response.sendError(res, err);
		}
		
		console.log(err); console.log(search_terms); });
}

function set_current_search_terms(req, res, next) {
	
	var search_terms = req.body.search_terms;
	StreamSettings.findOneAndUpdate( {user_id: 1},
	{current_search_terms: search_terms}, {new: true}, function(err,doc) {
		if (err === null) {
			Response.sendOk(res, {current_search_terms:doc.current_search_terms});
		}
		else {
			Response.sendError(res, err);
		}
	}
	);
	
	//res.send('set_current_search_terms : '+search_terms);
}


module.exports = router;