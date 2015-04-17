
var tweetDomCreator = require('./tweet-dom-creator.js');
var $ = require('jquery');

var tweetStream = {
	
	socket : null,
	tweets_displayed: 0,

	init: function() {
		var that = this;
		this.init_socket();
		this.bind_dom_events();
	},
	init_socket: function(){
		this.connect();
		this.bindTo_socket_events();
	},
	connect: function(forceNew) {
		if (io !== undefined ) {
			this.socket = io.connect('http://localhost:8075');
		}
	},
	bindTo_socket_events: function(){
		var that = this;
		this.socket.on("connected", function() {
			that.logToUser('Connected :)','success');
		});
		
		this.socket.on("disconnected", function() {
			that.logToUser('disconnected','danger');
		});
	},
	start_tweet_stream: function() {
		this.socket.on('server:tweet_received', function(tweet_data){
			tweet_data = JSON.parse(tweet_data);
			console.log(tweet_data.status);
			switch(tweet_data.status) {
				case 'OK':
					if (tweet_data.tweet.location !== null) {
						tweetNode = tweetDomCreator.createNode(tweet_data.tweet.tweet);
						var $htmlTweetNode = $('<div />', {html:tweetNode});
						$htmlTweetNode.find('.tweet').addClass("fancy_border");
						$("#tweets").prepend($htmlTweetNode.html());
					}
					else {
						tweetDomCreator.prependToNode(tweet_data.tweet.tweet, "#tweets");
					}
					break;
			}
			//
		});
	},

	/*
		type is success,info,warning or danger
	*/
	logToUser: function(message,type) {
		
		if (type !== 'success' && type !== 'info' && type !== 'warning' && type !== 'danger') {
			return false;
		}

		$("#alert").html(message).addClass('alert-'+type).fadeIn('fast',function() {
			setTimeout(function(){
				$("#alert").fadeOut('slow',function(){
					$("#alert").removeClass('alert-'+type);	
				});
			}, 2000);
		});
	},

	bind_dom_events: function() {
		var that = this;
		$("#search_button").on('click', this.search_clicked);
		$("#update_frequency").on('click', this.update_frequency_clicked);
		$("#stop_stream").on('click', function() {
			that.socket.disconnect();
			that.socket = null;
			that.logToUser('Stopped streaming tweets','danger');
		});
		$("#restart_stream").on('click', function(){
			that.socket = io.connect('http://localhost:8075',{'forceNew': true});
			that.bindTo_socket_events();
			that.start_tweet_stream();
		});
	},
	search_clicked: function() {
		var search_terms = $("#search_terms").val();
		$.ajax({
			url: '/search',
			success: function(response) {
				console.log(response);
			},
			error: function() {
				console.log('error');
			},
			data: {
				search_terms: search_terms
			},
			type:'POST'
		});
	},
	update_frequency_clicked: function() {
		var tweet_frequency = parseInt($("#tweet_frequency").val());
		tweet_frequency = tweet_frequency*1000;
		$.ajax({
			url: '/update_frequency',
			success: function(response) {
				console.log(response);
			},
			error: function() {
				console.log('error');
			},
			data: {
				frequency: tweet_frequency
			},
			type:'POST'
		});
	}

};

console.log(tweetStream);
tweetStream.init();

tweetStream.start_tweet_stream();

