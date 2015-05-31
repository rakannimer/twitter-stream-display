var React = require('react');
var Card = require('./card')

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
  			{cardComponents}
  		</div>
  	);
  },

});

module.exports = CardRow;