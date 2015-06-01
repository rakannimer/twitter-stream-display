var React = require('react');
var Card = require('./card')
var TweetStream = require('../TweetStreamer/TweetStream');
var cards = [
 // {title:"Geotagged Tweets", type :"geotagged"},
  {title:"Hashtags", type:"hashtags"},
  {title:"Sentiment", type:"sentiment"},
  {title:"Retweets", type:"retweets"},
  {title:"Favorites", type:"favorites"}
];

var CardRow = React.createClass({
  
	componentDidMount: function() {
	 
  },

  render: function() {

  	var cardComponents = cards.map(function (card) {
  		return (
  			<Card key={card.title} title={card.title} type={card.type} result={card.result} />
  		)
  	});
  	return (

  		<div className="row">
        <div className="col l6">
          <div className="card main-bg headline-card" >
            <div className="card-content">
  			     {cardComponents}
             </div>
  	 	   </div>
        </div>
        <TweetStream />
      </div>
  	);
  },

});

module.exports = CardRow;