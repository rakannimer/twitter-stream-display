var Reflux = require('reflux');

var AppActions = Reflux.createActions(
	["post_search"],
	["filter_tweets"]
);


module.exports = AppActions;