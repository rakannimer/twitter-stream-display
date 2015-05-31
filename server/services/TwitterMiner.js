Date.prototype.to_string = function(){
	return this.getFullYear()+'-'+ parseInt(this.getMonth()+1) +'-'+this.getUTCDate();
};

//Twitter defined variables
var MAX_POPULARITY = 15;
var MAX_SEARCH_COUNT = '100';

var error = function(err) {
	//temp function
	console.log("error", err);
}
var Twitter = require('twitter-node-client').Twitter,
	q = require('q'),
	_ = require('underscore'),
	sentiment = require('sentiment');
	ss = require('simple-statistics'),
	creds = require('../creds'),
	config = {
        "consumerKey": creds.twitter.consumer_key,
        "consumerSecret": creds.twitter.consumer_secret,
        "accessToken": creds.twitter.token,
        "accessTokenSecret": creds.twitter.token_secret,
        "callBackUrl": creds.twitter_callback_url
	},

	TwitterMiner = function() {
		this.twitter = new Twitter(config);

	};
	TwitterMiner.prototype = {
		get_history: function(search_terms) {
			var self = this;
			
			var deferred = q.defer();
			var one_day_ago = new Date();
			one_day_ago.setDate(one_day_ago.getDate() - 1);
			var date_string = one_day_ago.to_string();

			var popular_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'popular' };
			var all_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'recent' };
			var mixed_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'mixed' };
			var tweets = [];
			var max_id = -1;
			var self = this;
			var tweet_data = {
				tweets: [],
				max_id: -1,
				count: 0
			};

			var recent_query = this.build_query(search_terms, max_id, 1, 'recent');
			console.log("Starting Search");
			this.search(recent_query)
			.then(function(tweets){
				var languages = self.group_by_language.call(self, tweets);
				var geotagged_percent = self.get_geotagged_percentage.call(self, tweets);
				var hashtag_stats = self.hashtag_stats.call(self, tweets);
 				var sentiment_stats = self.get_sentiment(tweets);
 				var retweets_stats = self.get_retweets.call(self, tweets);
 				var favorite_stats = self.get_favorites.call(self, tweets);

 				deferred.resolve({
 					tweets: tweets,
 					tweet_count_by_language: languages,
					geotagged_percentage: geotagged_percent,
					hashtags: hashtag_stats,
					sentiment: sentiment_stats,
					retweets: retweets_stats,
					favorites: favorite_stats,

 				})
			})
			.catch(function(err){
				console.log("Error , ", err);
			});
			
			return deferred.promise;


		},

		get_favorites: function(tweets) {
			var favorite_counts = [];
			var tweet_ids = [];
			for (var i = tweets.statuses.length - 1; i >= 0; i--) {
				favorite_counts.push(tweets.statuses[i].favorite_count);
				tweet_ids.push(tweets.statuses[i].id);
			};
			var stats = this.get_stats(favorite_counts);
			var result = {
				stats : stats,
				counts : favorite_counts,
				tweet_ids : tweet_ids
			};
			return result;
		},

		get_retweets: function(tweets) {
			var retweet_counts = [];
			var tweet_ids = [];
			for (var i = tweets.statuses.length - 1; i >= 0; i--) {
				retweet_counts.push(tweets.statuses[i].retweet_count);
				tweet_ids.push(tweets.statuses[i].id);
			};
			var stats = this.get_stats(retweet_counts);
			var result = {
				stats : stats,
				counts : retweet_counts,
				tweet_ids : tweet_ids
			};
			return result;

		},

		get_sentiment: function(tweets) {
			var sentiment_scores = [];
			var tweet_ids = [];
			//sentiment = {"value": tweets.statuses[i].id, "weight": sentiment_score}
			for (var i = tweets.statuses.length - 1; i >= 0; i--) {
				
				var sentiment_score = sentiment(tweets.statuses[i].text).score;
				//sentiment_scores.push({'sentiment_score':sentiment_score});
				sentiment_scores.push(sentiment_score);
				//sentiment_scores.push({"value": i, "weight": parseInt(sentiment_score), "name" : ""+sentiment_score});
				tweet_ids.push(tweets.statuses[i].id)
			}
			var stats = this.get_stats(sentiment_scores);
			
			var result = {
				stats : stats,
				counts: sentiment_scores,
				tweet_ids : tweet_ids
			};
			return result;

		},


		get_geotagged_percentage: function(tweets) {

			var not_geotagged = 0,
				geotagged = 0;

			for (var i = 0; i < tweets.statuses.length; i++) {

				if (tweets.statuses[i].geo === null) {
					not_geotagged++;
				}
				else {
					geotagged++;
				}
			}

			return geotagged/(geotagged+not_geotagged)*100;
		},

		hashtag_stats: function(tweets) {
			var hashtag_count = [];
			for (var i = 0; i < tweets.statuses.length; i++) {
				hashtag_count.push(tweets.statuses[i].entities.hashtags.length);
			}

			var stats =  this.get_stats(hashtag_count);
			var result = {
				stats : stats,
				counts: hashtag_count
			};
			return result;
		},

		more_search: function(query, tweets) {
			var deferred = q.defer();
			if (tweets.statuses.length < MAX_SEARCH_COUNT) {

			}
			return deferred.promise;

		},
		many_searches : function() {
			var recent_query = this.build_query(search_terms, max_id, 1, 'recent');
			console.log("Starting Search");
			this.search(recent_query)
			.then(function(tweets){
				console.log("First Run ");
				tweet_data.tweets.push(tweets);
				if (tweets.statuses.length ===  parseInt(MAX_SEARCH_COUNT)) {
					var recent_query = self.build_query(search_terms, tweets.statuses[tweets.statuses.length-1].id, 1, 'recent');
					return self.search(recent_query)
				}
				else {
					return deferred.resolve(tweets);
				}
			}).then( function(tweets){
				tweet_data.tweets.push(tweets);
				console.log( "LENGTH : ", tweets.statuses.length );
				if (tweets.statuses.length <  parseInt(MAX_SEARCH_COUNT)) {
					var recent_query = self.build_query(search_terms, tweets.statuses[tweets.statuses.length-1].id, 1, 'recent');
					return self.search(recent_query)
				}
				else {

					return deferred.resolve(tweets);
				}
			}).then(function(tweets){
				deferred.resolve(tweets);

			}).catch(function  (err) {
				console.log("Error : ", err);
			});
			
			return deferred.promise;
		},
		build_query: function(search_terms, max_id, days_ago, result_type) {
			var one_day_ago = new Date();
			one_day_ago.setDate(one_day_ago.getDate() - days_ago);
			var date_string = one_day_ago.to_string();
			var query;
			if (max_id === -1) {
				query = {'q':' '+ search_terms, 'count': MAX_SEARCH_COUNT, 'result\_type': result_type };
				//query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type': result_type };
			}
			else {
				query = {'q':' '+ search_terms, 'count': MAX_SEARCH_COUNT, 'max_id': max_id, 'result\_type': result_type };
				//query = {'q':' '+ search_terms +'   since:'+date_string, 'max_id': max_id, 'count': MAX_SEARCH_COUNT, 'result\_type': result_type };	
			}
			return query;
			
		},
		get_all_tweets_in_one_day: function(search_terms, tweet_data) {
			
			var deferred = q.defer();
			//if (tweet_data.done == true) {
			//	deferred.resolve(tweet_data);
			//}

			console.log(tweet_data);

			var one_day_ago = new Date();
			one_day_ago.setDate(one_day_ago.getDate() - 1);
			var date_string = one_day_ago.to_string();
			
			var max_id = tweet_data.max_id;
			var tweets = [];
			var self = this;
			var tweets_available = true;
			var i = 0;
			var self = this;

			if (max_id === -1) {
				var recent_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT,  'result\_type':'recent' };
			}
			
			else {
				var recent_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'max_id':max_id, 'result\_type':'recent' };
			}

			return this.search(recent_tweets_query).then(function(queried_tweets) {
				var deferred = q.defer();
				if (i > 0) {
					queried_tweets.shift();
				}
				for (var i = queried_tweets.statuses.length - 1; i >= 0; i--) {
					tweet_data.tweets.push(queried_tweets.statuses[i]);
				}
				console.log("HERE");
				tweet_data.count += queried_tweets.statuses.length;
				tweet_data.max_id = queried_tweets.statuses[queried_tweets.statuses.length - 1].id;
				console.log("COUNT COUNT COUNT COUNT : ", tweet_data.count)
				if (tweet_data.count > 200) {
					console.log("HERERERER DONE !!!");
					//tweet_data.done = true;
				}
				deferred.resolve(search_terms, tweet_data);
				return deferred.promise;
				

			}).catch(function(err){
				console.log("Error : ",err);
			});

			//return deferred.promise;
		},

		search: function(query) {
			var deferred = q.defer();
			this.twitter.getSearch(query, function(err){
				deferred.reject(err);
			}, function(data) {
				var tweets = JSON.parse(data);

				deferred.resolve(tweets);
			});
			return deferred.promise;
		},

		get_recursive: function(query) {
			
		},


		get_tweet_count: function(query) {
			var deferred = q.defer();
			this.search(query).then(function(tweets){
				deferred.resolve(tweets.statuses.length);
			})
			.catch(error)
			return deferred.promise;
		},

		search: function(query) {
			var deferred = q.defer();
			this.twitter.getSearch(query, function(err){
				deferred.reject(err);
			}, function(data) {
				var tweets = JSON.parse(data);

				deferred.resolve(tweets);
			});
			return deferred.promise;
		},


		group_by_language: function(tweets) {
			var tweets_by_language = {};

			for (var i = 0; i < tweets.statuses.length; i++) {


				if (typeof tweets_by_language[tweets.statuses[i].lang] === 'undefined') {
					tweets_by_language[tweets.statuses[i].lang] = 1;
				}
				else {
					tweets_by_language[tweets.statuses[i].lang]++;	
				}
			}

			return tweets_by_language;
		},

		
		get_stats: function(number_array) {
			var stats = {
				scores : number_array,
				mean : ss.mean(number_array),
				std_dev : ss.standard_deviation(number_array),
				median : ss.median(number_array),
				max : ss.max(number_array),
				min : ss.min(number_array),
			}
			return stats;
		}

	};	


module.exports = new TwitterMiner();
