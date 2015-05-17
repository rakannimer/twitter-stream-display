var express = require('express');
var router = express.Router();
var StreamSettings = require('../models/StreamSettings');
var Tweets = require('../models/Tweets');
var Response = require('../services/response');

router.get('/locations', tweet_locations);
router.get('/history', mining_history);
router.get('/group_by_language', group_by_language);

function tweet_locations(req, res, next) {
	StreamSettings.get_current_search_terms(1)
	.then(function(search_terms){
		
		return Tweets.find()
		.where('search_terms').equals(search_terms)
		.where('geotagged').equals(true)
		.select('search_terms location')
		.exec(function(err,docs){
			Response.sendOk(res, docs);
		});
	})
	.catch(function(err){
		Response.sendError(err);
	});
	//res.send('tweet_locations');
}

function mining_history(req, res, next) {
	Tweets.get_mine_history()
	.then(function(docs){
		Response.sendOk(res, docs);
		//res.send(docs);
	})
	.catch(function(err){
		console.log(err);
		Response.sendError(err);
	});
}

function group_by_language(req, res, next) {
	
	StreamSettings.get_current_search_terms(1).then(function(search_terms){
		return Tweets.group_by_language(search_terms);
	})
	.then(function(docs){
		Response.sendOk(res, docs);
	})
	.catch(function(err){
		console.log(err);
		Response.sendError(err);
	});
}

module.exports = router;