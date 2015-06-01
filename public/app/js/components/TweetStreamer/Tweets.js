var React = require('react');
var Tweet = require('./Tweet');
var AppStore = require('../../stores/app-store');
var tweets = [
	{id:'1'},
	{id:'2'}
];

var Tweets = React.createClass({

  getInitialState: function() {
    return {
      tweets:[] 
    };
  },
  componentDidMount: function() {
      //this.setState(AppStore.get_card_state());
      var self = this;

      AppStore.listen(function(data){
        console.log("Tweets Received");
        self.setState({'tweets' : AppStore.filtered_tweets});
      });


  },
	render: function() {
		var tweetsX = this.state.tweets.map(function (tweet) {
  		return (
  			<Tweet key={tweet.id} tweet = {tweet}/>
  		)
  	});
  	return (
  		<div>
  			{ tweetsX }
  		</div>

  	);
	}
});
module.exports = Tweets;

var AppStore = require('../../stores/app-store');
