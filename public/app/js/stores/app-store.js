var AppActions = require('../actions/app-actions');
var $ = require('jquery');
var Reflux = require('reflux');



var CardStore = Reflux.createStore({
	search_terms: '',
	cards: {},
	tweets: [],
	filtered_tweets: [],
	init: function() {

	},

	get_card_state: function() {
		return {
			result: this.result
		}
	},

	listenables: [AppActions],

	filter_tweets: function(tweet_id) {

		this.filtered_tweets = [];
		for (var i = this.tweets.length - 1; i >= 0; i--) {
			if (this.tweets[i].id === tweet_id) {
				console.log(this.tweets[i]);
				this.filtered_tweets.push(this.tweets[i]);
				console.log(this.tweets[i]);
			}
		}
		//this.tweets = this.filtered_tweets;
		this.trigger('TWEETS_FILTERED');

	},

	post_search: function(query) {
		
		var self = this;
		//this.show_history_loading();

		$.post('/mine/history_from_api', {search_query: query}, function(response) {
			if (response.status !== 'OK') { console.log("error ", response); return;}

			self.cards['favorites'] = {
				headline : response.data.favorites.stats.mean.roundToTwo(),
				stats: response.data.favorites.stats,
				data : response.data.favorites,
				counts: response.data.favorites.counts,
				tweet_ids : response.data.favorites.tweet_ids,
				data_rows : response.data.favorites.data_rows,
				type : 'favorites'
			};

			self.cards['hashtags'] = {
				headline : response.data.hashtags.stats.mean.roundToTwo(),
				stats: response.data.hashtags.stats,
				data : response.data.hashtags,
				counts : response.data.hashtags.counts,
				tweet_ids : response.data.favorites.tweet_ids,
				data_rows : response.data.hashtags.data_rows,
				type: 'hashtags'
			};

			self.cards['retweets'] = {
				headline : response.data.retweets.stats.mean.roundToTwo(),
				stats: response.data.retweets.stats,
				data : response.data.retweets,
				counts: response.data.retweets.counts,
				tweet_ids : response.data.retweets.tweet_ids,
				data_rows : response.data.retweets.data_rows,
				type: 'retweets'
			};

			self.cards['sentiment'] = {
				headline : response.data.sentiment.stats.mean.roundToTwo(),
				stats: response.data.sentiment.stats,
				data : response.data.sentiment,
				counts: response.data.sentiment.counts,
				tweet_ids : response.data.sentiment.tweet_ids,
				data_rows : response.data.sentiment.data_rows,
				type: 'sentiment'
			};

			self.tweets = response.data.tweets.statuses;
			self.filtered_tweets = response.data.tweets.statuses;

			self.trigger('CARDS_RECEIVED');

			
			
		});
		
	}

});

module.exports = CardStore;