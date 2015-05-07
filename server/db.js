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

Array.prototype.getIndexBy = function (keys, value) {
	console.log("Current Search Term", value);
	var currentVal;
    for (var i = 0; i < this.length; i++) {
//        console.log(this[i]['_id'][name]);

		 currentVal = this[i];
		for (var j = 0; j < keys.length; j++) {
			currentVal = currentVal[keys[j]];
		}
		console.log("Current Value Searching for : ", currentVal);
		if (currentVal == value) {
            return i;
        }
    }
	return -1;
}

var db_instance = null;

var db = {
	url : 'mongodb://localhost:27017/tweet_streams',
	init: function(callback) {
		db_instance =  mongojs(this.url,['tweets','geotagged_count','sessions']);
		return this;
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
		//var count = 0;
		var self = this;
		db_instance.tweets.aggregate([
			//{$match:{'geotagged':1	}},
			{$group:
				{	
					_id: {
						'search_terms':"$search_terms",
						'geotagged': '$geotagged'
					},
			 		'count': 
					 	{'$sum':1}
				}
			 }
		],function(err,docs){
			var indexed_docs = self.indexBySearchTerms(docs);
			console.log(indexed_docs);
			callback(indexed_docs);
		});
	},

	indexBySearchTerms: function(docs) {
		var indexed_docs = [],
			docPosition = -1;
		//console.log(docs);
		for (var i = 0; i < docs.length; i++ ) {
			
			docPosition = indexed_docs.getIndexBy(['search_terms'], docs[i]['_id']['search_terms']);
			if (docPosition === -1) {
				indexed_docs.push(
					{
						search_terms : docs[i]['_id']['search_terms'],
						geotagged: docs[i]['_id']['geotagged'],
						count: docs[i]['count'],
						geo_count: docs[i]['_id']['geotagged'] === 1?docs[i]['count']:0,
						non_geo_count: docs[i]['_id']['geotagged'] === 0?docs[i]['count']:0
					}
				);
				//indexed_docs.push(docs[i]);
				console.log("NOT FOUND");
			}
			else {
				if (docs[i]['_id']['geotagged'] === 1) {
					indexed_docs[docPosition].geo_count = docs[i].count;
				}
				else if (docs[i]['_id']['geotagged'] === 0) {
					indexed_docs[docPosition].non_geo_count = docs[i].count;
				}
				indexed_docs[docPosition].count += docs[i].count;
			}
			
		}
		return indexed_docs;
	},

	getTermsBy: function(conditions) {
		var deferred = q.defer();
		
		if (db_instance === null) {

			deferred.resolve(false);
			return deferred.promise;
		}
		console.log("Here");
		var tweets = db_instance.collection('tweets');
		tweets.aggregate([
			{},
			{$group:{_id:"$search_terms"}
			}
		],function(docs){
			console.log(docs);
		});
		/*
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
		*/
		
		return deferred.promise;
	},
	get_current_search_terms: function(){
		var deferred = q.defer();
		var sessions = db_instance.collection("sessions");
		sessions.find({user_id:1}).toArray(function(err, docs) {
			if (docs.length > 0) {
				console.log("Current search terms :",docs[0].current_search_terms);
				return deferred.resolve(docs[0]);	
			}
			return false;
		});
		return deferred.promise;
	},
	update_current_search_terms: function(user_id, search_terms) {
		var deferred = q.defer();
		db_instance.collection("sessions").findAndModify({
		    query: { user_id: user_id },
		    update: { $set: { current_search_terms: search_terms } },
		    new: true
		}, function(err, doc, lastErrorObject) {
		    if (err === null) {
				return deferred.resolve(err);	
			}
			else {
				return deferred.resolve(doc);
			}
			
		});
		return deferred.promise;
	}


}


module.exports = db;