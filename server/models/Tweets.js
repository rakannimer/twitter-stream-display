var mongoose = require("mongoose");
var q = require("q");
var lang_detect = require('cld');
var SchemaTypes = mongoose.Schema.Types;
var TweetsSchema = new mongoose.Schema({
		search_terms:{type: String},
		location: { type:[Number], index:'2d' },
		tweet: mongoose.Schema.Types.Mixed,
		geotagged: Boolean
	},
	{strict: false}
);

TweetsSchema.set('collection','tweets');

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

function format_search_history(docs) {
	var indexed_docs = [],
		docPosition = -1;

	for (var i = 0; i < docs.length; i++ ) {
		console.log(i);
		docPosition = indexed_docs.getIndexBy(['search_terms'], docs[i]['_id']['search_terms']);
		if (docPosition === -1) {
			indexed_docs.push(
				{
					search_terms : docs[i]['_id']['search_terms'],
					geotagged: docs[i]['_id']['geotagged'],
					count: docs[i]['count'],
					geo_count: docs[i]['_id']['geotagged'] === true?docs[i]['count']:0,
					non_geo_count: docs[i]['_id']['geotagged'] === false?docs[i]['count']:0
				}
			);
		}
		else {
			if (docs[i]['_id']['geotagged']  !== false) {

			}
			if (docs[i]['_id']['geotagged'] === true) {
				indexed_docs[docPosition].geo_count = docs[i].count;
			}
			else if (docs[i]['_id']['geotagged'] === false) {
				indexed_docs[docPosition].non_geo_count = docs[i].count;
			}
			indexed_docs[docPosition].count += docs[i].count;
		}
		
	}
	return indexed_docs;
}


TweetsSchema.pre('save', function(next) {

	if (this.tweet.coordinates !== null ) {
		if (this.tweet.coordinates) {
			console.log("Found geotagged tweets")
			var lng = this.tweet.coordinates.coordinates[1],
				lat = this.tweet.coordinates.coordinates[0];

			this.location = [lng, lat];
			this.geotagged = true;
		}
	}
	else {
		this.location = null;
		this.geotagged = false;	
	}


	next();	

});

TweetsSchema.statics.get_mine_history = function() {
	var deferred = q.defer(); 
	var self = this;	
	Tweets.aggregate([
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
			
			if (err !== null) return deferred.reject(err);
			
			var indexed_docs = format_search_history(docs);
			return deferred.resolve(indexed_docs);
		});
	return deferred.promise;
};



TweetsSchema.statics.get_locations = function(search_terms) {
  
  var deferred = q.defer(); 
  Tweets.findOne({user_id: 1}, values, function(err, doc){
    if (err === null) {
      return deferred.resolve(doc.current_search_terms);
    }
    else {
      return deferred.reject(err);
    }
  });
};

TweetsSchema.statics.group_by_language = function(search_terms) {
	var deferred = q.defer(); 
	var self = this;	
	Tweets.aggregate([
			{$match:{'search_terms':search_terms }},
			{$group:
				{	
					_id : {
						'search_terms': '$search_terms',
						"language":"$tweet.lang"
					},
			 		'count': 
					 	{'$sum':1}
				}
			 }
		],function(err,docs){
			console.log(docs); process.exit();

			if (err !== null) return deferred.reject(err);
			
			var indexed_docs = format_search_history(docs);
			return deferred.resolve(indexed_docs);
		});
	return deferred.promise;
}

//Refactor by Promisifying mongoose

var Tweets = mongoose.model('Tweets', TweetsSchema);

module.exports = Tweets;