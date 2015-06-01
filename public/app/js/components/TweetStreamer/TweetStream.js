var React = require('react');
var Tweets = require('./Tweets');
var TweetStream = React.createClass({
	render: function() {
		return (
			<div className="col l6">
	        	<div className="card main-bg section headline-card">
	        		<div className="card-content">
	        			<span className="card-title">Analyzed Sample </span>
	        			<div className="tweet_container"  id='tweets'>
	        				<Tweets />
	        			</div>
	        		</div>
	        	</div>
	        </div>
		);
	}
});

module.exports = TweetStream;