
var tweetDomCreator = require('./tweet-dom-creator.js');
var $ = require('jquery');
var _ = require('underscore')
var page = require('page');
var GoogleMapsLoader = require('google-maps');
var toastr = require('toastr');
var q = require("q");
var ko = require('knockout');
var archive_template = require('../templates/archived_data.html');
var creds = require('./creds.js');
var codemirror = require('codemirror');
require('magnific-popup');
require('codemirror/mode/r/r');
//require('jquery-ui/resizable');
var stored_data = require('./stored_data');
var examples_template = require('../templates/examples_template.html');

$('.gallery-item').magnificPopup({
  type: 'image',
  gallery:{
    enabled:true
  }
});

toastr.options.closeButton = true;
toastr.options.extendedTimeOut = 60;
toastr.options.progressBar = true; 
//var slider = new SimpleSlider( document.getElementById('myslider'), {
//    autoPlay:false,
//    transitionTime:1,
//    transitionDelay:3.5
//  } );

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
	search_history:null,

	init: function() {
		//this.init_socket();
		this.bind_dom_events();
		this.get_search_history().then(this.render_tags);
		this.get_current_search_terms().then(this.render_current_search);
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
	render_current_search: function(self){
		$('#current_search_terms').html(self.current_search_terms);
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
		$.get('/locations',{},function(response){
			
			if (response.status === 'OK') {
				var tweets = response.data;
				for (var i = 0; i < tweets.length; i++) {
					latLng_point = new google.maps.LatLng(tweets[i].location.lng,tweets[i].location.lat);
					self.latLng_points.push(latLng_point);
					
				}
				return deferred.resolve(self);

			}
		});
		return deferred.promise;
	},
	
	get_current_search_terms: function() {
		var deferred = q.defer();
		var self = this;
		$.get('/search',{},function(response){
			self.current_search_terms = response.data.current_search_terms;

			return deferred.resolve(self);
		});
		return deferred.promise;	
	},

	get_search_history: function() {
		var deferred = q.defer();
		var self = this;
		$.get('/search_history',{},function(response){
			self.search_history = response.data;
			return deferred.resolve(self);
		});
		return deferred.promise;

	},
	render_tags:function(self){
		
		var compiledTemplate = _.template(archive_template);
        compiledTemplate = compiledTemplate({archived_tweets: self.search_history});
        $("#tweet_archive").html(compiledTemplate);

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
				var heatmap = new google.maps.visualization.HeatmapLayer({
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
		$("#current_search_terms").html(search_terms);
	},

	update_frequency_clicked: function() {

		var tweet_frequency = parseInt($("#tweet_frequency").val());
		tweet_frequency = tweet_frequency*1000;
		$.ajax({
			url: '/frequency',
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
		GoogleMapsLoader.KEY = creds.google_maps;
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





var code_editor = {
	init: function() {
		this.bind_dom_events();
		this.load_examples();
		
	},
	load_examples: function() {
		var self = this;
		$.get('/r_examples', function(response){
			if (response.status === 'OK') {
				var compiledTemplate = _.template(examples_template);
				compiledTemplate = compiledTemplate({data: response.data});
				$("#examples").html(compiledTemplate);
				self.bind_example_dom_events();
			}
			//response.data.examples_path
						
		});
	},
	load_editor: function(){
		var self = this;
		this.editor = codemirror.fromTextArea($("#code_editor").get(0), {
			lineNumbers: true,
			mode: "r",
			showCursorWhenSelecting: true,
			autofocus: true
		});
		
		this.editor.setOption("extraKeys", {
		  Tab: function(cm) {
		    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		    cm.replaceSelection(spaces);
		  },
		  "Cmd-S": function() {
			  storage.setItem("saved_code",self.editor.getValue());
			  toastr['success']("Code Saved");
		  }
		});
		var stored_code = storage.getItem("saved_code");
		if(typeof stored_code !== 'undefined') {
			//this.editor.setValue(stored_code);	
		}
		this.editor.setValue(stored_data.r_examples.count_entries);
		this.editor.setCursor(this.editor.lineCount(), 0);
	},

	load_console: function() {
		this.console = codemirror.fromTextArea($("#console_editor").get(0), {
			mode: "r",
			theme: "blackboard",
			readOnly: true
		});
		
		this.console.setOption("extraKeys", {
		  Tab: function(cm) {
		    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		    cm.replaceSelection(spaces);
		  }
		});
		this.console.setValue("Ready \n");
	},
	
	clear_console: function() {
			
	},

	write_to_console: function(message) {
		this.console.setValue(this.console.getValue()+message);
		this.console.setCursor(this.console.lineCount(), 0);
	},
	
	write_to_editor: function(message) {
		this.editor.setValue(message);
		this.editor.setCursor(this.editor.lineCount(), 0);	
	},

	bind_dom_events: function() {
		$("#compile_r").on('click', {context: this}, this.compile_r_clicked);
		$("#clear_console").on('click', {context: this}, this.clear_console_clicked);
	},
	bind_example_dom_events: function() {
		$('.example').on('click', {context:this}, this.example_clicked);	
	},
	example_clicked: function(e) {
		var self = e.data.context;
		
		var example_path = $(e.target).attr('data-href');
		if (storage.exists(example_path)) {
			self.write_to_editor(storage.getItem(example_path));
		}
		else {
			
			$.get(example_path, function(response) {
				storage.setItem(example_path, response);
				self.write_to_editor(response);
			});	
		}

	},
	refresh_code_mirror: function() {
		this.editor.refresh();
		this.console.refresh();	
	},

	clear_console_clicked: function(e) {
		var self = e.data.context;
		self.console.setValue("");
	},
	compile_r_clicked: function(e) {
		var self = e.data.context;
		var code = self.editor.getValue();
		toastr['info']('Compiling Code');
		$.post('/compile_code',{code: code},function(response) {
			var output = response.data.output;
			
			if (response.status === 'OK') {
				toastr['success']('Code compiled without errors');
			}
			else {
				self.write_to_console(output.stderr);
				toastr['error']('Something happened');
			}

			if (typeof output.stdout === 'undefined') {
				self.write_to_console('Done. \n');
			}
			else {
				self.write_to_console(output.stdout);	
			}
			
			if (response.data.graphs.length > 0) {
				$("#graphs_result").html("");
				for (var i =0; i < response.data.graphs.length; i++) {
					$("#graphs_result").append('<a class="gallery-item"  href="'+response.data.graphs[i]+'"><img style="width:200px;height:100px;" src="'+response.data.graphs[i]+'" /></a>');
				}
				$('.gallery-item').magnificPopup({
				  type: 'image',
				  gallery:{
				    enabled:true
				  }
				});
			}
			
		});
	}
};

//This will not be compatible with all browsers change to : http://benalman.com/projects/jquery-hashchange-plugin/ or microrouter

var router = {
	page : 'home',
	init : function() {
		var current_page = location.hash;
		var current_page_chunks = current_page.split('/');
		this.listen_to_hashchange();
		this.route(current_page_chunks);
	},
	listen_to_hashchange: function() {
		var self= this;
		$(window).on('hashchange',function(e){	
			var new_page = location.hash;
			 
			var new_page_chunks = new_page.split('/');
			self.route(new_page_chunks); 
			return;
		});
	},
	route: function( hashes) {
		var self = this;

		if (hashes.length < 2 ) {
			return;
		}
		switch(hashes[1]) {
			case '':
			case 'search_terms':
				if (self.page !== 'home') {
					$("#code").hide();
					$("#home").show();
					self.page = 'home';
				}
				if (typeof hashes[2] != 'undefined') {
					tweetStream.update_search(hashes[2]);	
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
}


var storage = {
	init: function() {
		
	},
	supports_html5_storage: function() {
		 try {
		    return 'localStorage' in window && window['localStorage'] !== null;
		  } catch (e) {
		    return false;
  		}
	},
	setItem: function(key,data) {
		localStorage.setItem(key,data);
	},
	getItem: function(key) {
		if(typeof localStorage[key] !== 'undefined') {
			return localStorage[key];
		}
		return "";
	},
	exists: function(key) {
		return (typeof localStorage[key] !== 'undefined');
	}
}

router.init();
code_editor.init();

tweetStream.init();
tweetStream.load_map();
//tweetStream.start_tweet_stream();






// Sidebar 

    //$('.navbar.easy-sidebar').toggleClass('toggled');

