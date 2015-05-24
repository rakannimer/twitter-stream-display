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
			var one_day_ago = new Date();
			var deferred = q.defer();

			one_day_ago.setDate(one_day_ago.getDate() - 1);
			var date_string = one_day_ago.to_string();
			var popular_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'popular' };
			var all_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'recent' };
			var mixed_tweets_query = {'q':' '+ search_terms +'   since:'+date_string, 'count': MAX_SEARCH_COUNT, 'result\_type':'mixed' };
			
			q.all([
				this.get_tweet_count(popular_tweets_query),
				this.get_tweet_count(all_tweets_query),
				this.search(mixed_tweets_query)

			]).spread( function(popular_tweet_count, all_tweet_count, tweets){
				var popularity_percentage = (popular_tweet_count/MAX_POPULARITY)*100;
				var acceptable_volume = (all_tweet_count/parseInt(MAX_SEARCH_COUNT))*100 > 90;
				deferred.resolve({
					search_query : search_terms,
					popularity_percentage : popularity_percentage,
					acceptable_volume : acceptable_volume,
					tweet_count_by_language: self.group_by_language.call(self, tweets),
					geotagged_percentage: self.get_geotagged_percentage.call(self, tweets),
					hashtag_stats: self.hashtag_stats.call(self, tweets)
				});
			})
			.catch(error);

			return deferred.promise;
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

		analyze: function(tweets) {
			//Parallelize ?
			return {
				tweet_count_by_language: this.group_by_language(tweets),
				geotagged_percentage: this.get_geotagged_percentage(tweets),
				hashtag_stats: this.hashtag_stats(tweets)
			};
		},

		group_by_language: function(tweets) {
			//var deferred = q.defer();
			var tweets_by_language = {};

			for (var i = 0; i < tweets.statuses.length; i++) {


				if (typeof tweets_by_language[tweets.statuses[i].lang] === 'undefined') {
					tweets_by_language[tweets.statuses[i].lang] = 1;
				}
				else {
					tweets_by_language[tweets.statuses[i].lang]++;	
				}
			}
			//console.log(tweets_by_language);
			//deferred.resolve(tweets_by_language);
			return tweets_by_language;
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

			var stats = {
				mean : ss.mean(hashtag_count),
				std_dev : ss.standard_deviation(hashtag_count),
				median : ss.median(hashtag_count),
				max : ss.max(hashtag_count)
			}
			return stats;
			
		}

	};	


module.exports = new TwitterMiner();
