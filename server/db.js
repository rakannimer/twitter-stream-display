var mongojs = require('mongojs'),
	assert = require('assert'),
	language_detect = require('cld'),
	q = require("q");
/*
var insertTweets = function(db, callback) {
  // Get the tweets collection
  var collection = db.collection('tweets');
  // Insert some documents
  collection.insert([
    {a : 1}
  ], function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the tweets collection");
    callback(result);
  });
}
*/

var db_instance = null;

var db = {
	url : 'mongodb://localhost:27017/tweet_streams',
	init: function(callback) {
		that = this;
		db_instance =  mongojs(this.url,['tweets','geotagged_count']);
		// mongojs.connect(this.url, function(err, db) {
		// 	console.log("Connected to mongo");
		// 	assert.equal(null, err);
		// 	db_instance = db;
		// 	callback();
		// });
	},
	build_tweet_model: function(search_terms,tweet) {
		var tweet_obj,
			// different field to apply different index from geospatial one on geotagged
			geotagged,
			location,
			language;

		language_detect.detect(tweet.text, function(err, result) {
			
			if (err !== null) {
				console.log("Language not detected");
				console.log(err);
				language = null;
			}
			else {
				if (typeof result.languages !== 'undefined')
				{
					console.log(result.languages);
					if (result.languages.length > 1) {
						if (typeof result.languages[0] === 'object') {
							language = result.languages[0].code;		
						}
					}
				}
				
			}
		});

		if (tweet.coordinates !== null) {
			if (tweet.coordinates){
				location = {"lat": tweet.coordinates.coordinates[0], "lng": tweet.coordinates.coordinates[1]};
				geotagged = 1;
			}
		}
		
		else {
			location = null;
			geotagged = 0;
		}
		
		tweet_obj = {
			tweet: tweet,
			location : location,
			search_terms : search_terms,
			geotagged: geotagged,
			language: language
		};



		return tweet_obj;
	},

	insertTweet: function(tweet_model,callback) {
		if (db_instance === null) {
			return false;
		}

		var tweets = db_instance.collection('tweets');
		//if (tweet_model.geotagged === 1) {
			tweets.insert(tweet_model, function(err,result){
		   		callback();
			});
		//}
		
		//db.insertTweet(tweet_obj, function(result){
		//	console.log("Inserted into mongo");
		//});

		// var tweets = db_instance.collection('tweets');
		// tweets.insert(tweet,function(err,result){
		// 	assert.equal(err, null);
  //   		console.log("Inserted a document into the tweets collection");
  //   		callback(result);
		// });

	},

	getTweetLocations: function(search_terms, callback) {
		var tweets = db_instance.collection('tweets');

		tweets.find({search_terms:search_terms, geotagged: 1}, {location: 1}).toArray(function(err, docs) {
		    assert.equal(err, null);
		    console.log("Found "+ docs.length+" records");
		    if (docs.length > 0) {
		    	console.log(docs[0].location);
		    }
		    callback(docs);
		  });
	},

	getSearchTerms: function(callback) {
//		var tweets = db_instance.collection('tweets');
		var count = 0;
		db_instance.tweets.mapReduce(
			//Mapper !Refactor
			function(){
				//Return search_terms as key and counts as object
				//if (this.search_terms === "amsterdam, king\'s day")
				//{
					emit(this.search_terms, {geotagged:this.geotagged});
				//}
			},
			//Reducer !Refactor
			function(key,values){
			
				var count = 0;
				var geo_count = 0;
				var non_geo_count = 0;
				for (var i = 0 ;i < values.length; i++) {
					if (values[i].geotagged === 1)
					{
						geo_count++;	
					}
					
					count++;
				}
				non_geo_count = count - geo_count;

				return {
					count: count,
					geo_count:  geo_count,
					non_geo_count: non_geo_count
				};	
			    
			},
			{
				out : "geotagged_count"
			}
 		);
 
 		db_instance.geotagged_count.find(function (err, docs) {
 			if(err) console.log(err);
 			callback(docs);
 			console.log(docs);
 		});

		// this.getTermsBy({}).then(function(docs){
		// 	callback(docs);
		// }).then;
	},

	getTermsBy: function(conditions) {
		var deferred = q.defer();
		
		if (db_instance === null) {

			deferred.resolve(false);
			return deferred.promise;
		}
		console.log("Here");
		var tweets = db_instance.collection('tweets');
		tweets.group({}, conditions, {'non_geotagged_count':0, 'geotagged_count':0,'count':0}, function (obj, prev) { 
				if (prev.geotagged === 1) {
					prev.geotagged_count++;
				}
				else {
					prev.non_geotagged_count++;	
				}
				prev.count++;

		}, true, function(err, docs) {
			deferred.resolve(docs);
		});
		return deferred.promise;
	}


}


module.exports = db;