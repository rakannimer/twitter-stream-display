
var tweetDomCreator = require('./tweet-dom-creator.js');
var $ = require('jquery');
var _ = require('underscore')
var page = require('page');
var GoogleMapsLoader = require('google-maps');
var toastr = require('toastr');
var q = require("q");
var ko = require('knockout');
var archive_template = require('../templates/archived_data.html');


var tweetStream = {

	socket : null,
	tweets_displayed: 0,
	markers: [],
	map: null,
	latLng_points: [],
	showing_stream: false,
	showing_heatmap: false,
	showing_markers: false,
	heatmap:null,
	metadata:null,

	init: function() {
		var self = this;
		console.log(archive_template);
		//this.init_socket();
		this.bind_dom_events();
		this.getMinedMetaData().then(this.render_tags);
	},
	init_socket: function(){
		var connected = this.connect();
		if (connected) {
			this.bindTo_socket_events();	
		}
		
	},
	connect: function(forceNew) {
		if (typeof io !== 'undefined' ) {
			this.socket = io.connect('http://localhost:8075');
			this.show_loading('tweets');
			return true;
		}
		else {
			return false;
		}
	},
	bindTo_socket_events: function(){
		var self = this;

		this.socket.on("connected", function() {
			self.hide_loading('tweets');
			self.logToUser('Connected (ʘ‿ʘ)','success');
		});

		this.socket.on("disconnected", function() {
			self.logToUser('Disconnected (一_一) ','error');
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
		
		if (type !== 'success' && type !== 'info' && type !== 'warning' && type !== 'error') {
			return false;
		}
		toastr[type](message);

		/*
		// If Twitter bootstrap alerts
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
		*/
	},

	show_loading: function(component) {
		switch(component) {
			case 'tweets':
				$("#tweets_loading").removeClass('hide');
				break;
		}
	},

	hide_loading: function(component) {
		switch(component) {
			case 'tweets':
				$("#tweets_loading").addClass('hide');
				break;
		}
	},

	bind_dom_events: function() {
		var self = this;
		$("#search_button").on('click', {context: this}, this.search_clicked);

		$("#update_frequency").on('click', {context: this}, this.update_frequency_clicked);
		$("#stream_toggle").on('click', {context: this}, this.stream_toggle);
		$("#heatmap_toggle").on('click', {context: this}, this.heatmap_toggle);
		$("#markers_toggle").on('click', {context: this}, this.markers_toggle);
		$("#show_search").on('click', {context: this}, function(){
			$("#search_box").toggle('slow');
		});
	},



	stream_toggle: function(e) {
		var self = e.data.context;
		console.log(self.showing_stream);
		if (self.showing_stream === true) {
			self.socket.disconnect();
			self.socket = null;
			self.logToUser('Disconnected (一_一)','error');
			console.log("Here");
		}
		else {
			console.log("connecting");
			self.socket = io.connect('http://localhost:8075',{'forceNew': true});
			self.bindTo_socket_events();
			self.start_tweet_stream();
		}
		self.showing_stream = !self.showing_stream;
	},

	heatmap_toggle: function(e) {
		var self = e.data.context;
		//heatmap.setMap(heatmap.getMap() ? null : map);
		if (self.showing_heatmap === false) {
			if (self.heatmap === null) {
				self.grab_location_data().then(self.render_heatmap);	
			}
			else {
				self.render_heatmap(self);
			}
		}
		else {
			self.hide_heatmap();
		}
		self.showing_heatmap = !self.showing_heatmap;
	},

	markers_toggle: function(e) {
		var self = e.data.context;

		if (self.showing_markers === false) {

			if (self.markers.length === 0) {
				self.grab_location_data().then(function() {
					self.render_markers(self);
				});	
			}
			else {
				self.render_markers(self);
			}
		}
		else {
			self.hide_markers();
		}
		self.showing_markers = !self.showing_markers;
	},

	render_markers: function(self) {

		for (var i = 0 ; i < self.latLng_points.length; i++) {
			self.markers.push(self.create_map_marker(self.latLng_points[i]));
		}

	},

	hide_markers: function() {
		
		for (var i = 0 ; i < this.markers.length; i++) {
			
			this.markers[i].setMap(null);
		}
	},

	hide_heatmap: function() {
		this.heatmap.setMap(null)
	},

	render_heatmap: function(self){

		if (self.heatmap === null) {
			
			self.heatmap = new google.maps.visualization.HeatmapLayer({
		 		data: self.latLng_points,
		 		map: self.map
		 	});
		}
		else {
		 	self.heatmap.setData(self.latLng_points);
		 	self.heatmap.setMap(self.map);
		}
		
	},

	grab_location_data: function(callback){
		var latLng_point;
		var self = this;
		var deferred = q.defer();
		$.post('/locations',{},function(response){
			
			if (response.status === 'OK') {
				var tweets = response.tweets;
				var current_tweeet;
				for (var i = 0; i < tweets.length; i++) {
					latLng_point = new google.maps.LatLng(tweets[i].location.lng,tweets[i].location.lat);
					self.latLng_points.push(latLng_point);
					
				}
				return deferred.resolve(self);

			}
		});
		return deferred.promise;
	},

	getMinedMetaData: function() {
		var deferred = q.defer();
		var self = this;
		$.post('/metadata',{},function(response){
			self.archived_tweets = response.tweets;
			self.current_search_terms = response.current_search_terms;
			return deferred.resolve(self);
		});
		return deferred.promise;

	},
	render_tags:function(self){
		
		var compiledTemplate = _.template(archive_template);
        compiledTemplate = compiledTemplate({archived_tweets: self.archived_tweets});
        $("#tweet_archive").html(compiledTemplate);
        $('#current_search_terms').html(self.current_search_terms);

	},
	show_on_map: function(e) {
		var self = e.data.context;
		var latLng_point;
		$.post('/locations',{},function(response){
			
			if (response.status === 'OK') {
				var tweets = response.tweets;
				var current_tweeet;
				for (var i = 0; i < tweets.length; i++) {
					current_tweeet = tweets[i];
					latLng_point = new google.maps.LatLng(current_tweeet.location.lng,current_tweeet.location.lat);
					//For heat array
					self.latLng_points.push(latLng_point);
					
					//For markers display
					self.google_markers.push(self.create_map_marker(latLng_point));
				}
				 heatmap = new google.maps.visualization.HeatmapLayer({
    				data: self.latLng_points,
    				map: self.map
  				});

				 latLng_point = new google.maps.LatLng(131.044922,-25.363882);
				 self.google_markers.push(self.create_map_marker(latLng_point));
				self.latLng_points.push(latLng_point); 
				heatmap.setData(self.latLng_points);
				heatmap.setMap(self.map);
			}
			//var myLatlng = new google.maps.LatLng(-25.363882,131.044922);

		});
		
	},
	//
	//Move to different object doesn't belong here
	//
	create_map_marker: function(latLng_point) {
		var marker = new google.maps.Marker({
      		position: latLng_point,
      		map: this.map
  		});
  		return marker;
	},

	search_clicked: function(e) {
		var self = e.data.context;
		var search_terms = $("#search_terms").val();
		self.update_search(search_terms);
	},

	update_search: function(search_terms) {
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
	},
	load_map: function(){
		GoogleMapsLoader.KEY = 'AIzaSyDt4-myjrgFVGNxtl1zsXGaHvaCw2k68G4';
		GoogleMapsLoader.LIBRARIES = ['visualization'];
		var self = this;
		GoogleMapsLoader.load(function(google) {
			var options = {
				zoom: 3,
				center: new google.maps.LatLng(33, 35),
			};
			self.map = new google.maps.Map(document.getElementById("map"), options);
			// tweets_div = document.getElementById("tweets");
			// tweetStream.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(tweets_div);
			// controls_div = document.getElementById("controls");
			// tweetStream.map.controls[google.maps.ControlPosition.TOP_CENTER].push(controls_div);
		});
	},


};



tweetStream.init();
tweetStream.load_map();

//This will not be compatible with all browsers change to : http://benalman.com/projects/jquery-hashchange-plugin/ or microrouter
$(window).on('hashchange',function(e){	
	var new_page = location.hash;
	new_page = new_page.split('/');
	tweetStream.update_search(new_page[2]);

});
//tweetStream.start_tweet_stream();






// Sidebar 

    //$('.navbar.easy-sidebar').toggleClass('toggled');

