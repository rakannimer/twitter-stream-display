var $ = require('jquery');
var TweetStream = require('./TweetStream');
var CodeEditor = require('./CodeEditor');
var Map = require('./Map');
var Archive = require('./Archive');
var code_editor = new CodeEditor();
var tweet_stream = new TweetStream();
var map = new Map();
var archive = new Archive();

var Router = function() {
	this.current_page = location.hash;
	this.listen_to_hashchange();
	this.route(this.current_page);
	map.load_map();
};
Router.prototype = {

	listen_to_hashchange: function() {
		var self= this;
		$(window).on('hashchange',function(e){
			this.current_page = location.hash;
			self.route(this.current_page); 
			return;
		});
	},
	route: function(location_hash) {
		var self = this;
		var current_page = location.hash;
		var hashes = current_page.split('/')
		if (hashes.length < 2 ) {
			return;
		}
		switch(hashes[1]) {
			case '':
			case 'search_terms':
				if (self.page !== 'home') {
					$("#code").hide();
					$("#home").show();
					map.refresh()
					self.page = 'home';
				}
				if (typeof hashes[2] != 'undefined') {
					tweet_stream.update_search(hashes[2]);	
				}
				break;
			case 'code':
				if (self.page !== 'code') {
					code_editor.load_editor();
					code_editor.load_console();
					$("#app_container").children().hide();
					$("#code").show();
					code_editor.refresh_code_mirror()
					self.page = 'code';
				}
				break;
			case 'config':
				alert("soon");
		}
	} 
};
module.exports = Router;