var AppActions = require('../actions/app-actions');
var $ = require('jquery');
var Reflux = require('reflux');



var CardStore = Reflux.createStore({
	search_terms: '',
	cards: {},
	init: function() {
	},

	get_card_state: function() {
		return {
			result: this.result
		}
	},

	listenables: [AppActions],

	post_search: function() {
		
		var self = this;
		//this.show_history_loading();
		$.post('/mine/history_from_api', {search_query: "ASDASD"}, function(response) {
			if (response.status !== 'OK') { console.log("error ", response); return;}

			//self.cards['geotagged'] = {
			//	headline: roundToTwo(response.data.geotagged_percentage),
			//	stats : null
			//}
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

			self.trigger('CARDS_RECEIVED');
			//this.render_history(response.data);
			//this.render_sentiment(response.data.sentiment);
			//this.render_tweets(response.data.tweets.statuses);
			//this.render_retweets(response.data.retweets);
		});
		
	}

});

module.exports = CardStore;