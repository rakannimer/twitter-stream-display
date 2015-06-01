var React = require('react');

var Tweet = React.createClass({
	render: function() {
    var tweet = this.props.tweet;
    if (typeof tweet.entities.media !== 'undefined') {
      var media = <img src= {tweet.entities.media[0].media_url_https} /> 
    }
    else {
      var media = "";
    }
    
	 return (

      <div className="card tweet clearfix grey lighten-4 black-text">
        <div className="profile-image">
          <img src={tweet.user.profile_background_image_url_https} />
        </div>
        <div className="user-info">
          <span className="username">
            <a href={"https://twitter.com/"+tweet.user.screen_name} target="_blank"> {tweet.user.screen_name} </a>
          </span>
          <span className="screen-name">
            {"@"+tweet.user.screen_name}
          </span>
          <span className="timestamp">
            {tweet.created_at}
          </span>
        </div>
        <div className="tweet-content">
          {tweet.text}
          <div className="tweet-image"> 
            {media}
          </div>
          <div className="favorites">
            <div className="favoriteStar">
            <img src="./app/img/star.png" width="30" /> 
            </div>
            <div className="favoriteCount">
              { tweet.favorite_count }
            </div>
          </div>
        </div>


      </div>
    );
	}
});

module.exports = Tweet;