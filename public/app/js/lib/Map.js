var GoogleMapsLoader = require('google-maps');
var creds = require('../creds.js');
var q = require('q');
var $ = require('jquery');

var Map = function(){
	this.heatmap = null;
	this.latlng_points  = [];
	this.map = null;
	this.showing_heatmap = false;
	this.showing_markers = false;
	this.markers = [];
	this.div_id = 'map';
	this.bind_dom_events();
};

Map.prototype = {

	load_map: function() {
		var self = this;
		GoogleMapsLoader.KEY = creds.google_maps;
		GoogleMapsLoader.LIBRARIES = ['visualization'];
		GoogleMapsLoader.load(function(google) {
			var options = {
				zoom: 3,
				center: new google.maps.LatLng(33, 35),
			};
			self.map = new google.maps.Map(document.getElementById(self.div_id), options);
		});
	},

	heatmap_toggle: function() {

		var self = this;
		if (this.showing_heatmap === false) {
			if (this.heatmap === null) {
				this.get_tweet_locations().then( function () {
					self.render_heatmap.call(self); 
				});	
			}
			else {
				this.render_heatmap();
			}
		}
		else {
			this.hide_heatmap();
		}
		this.showing_heatmap = !this.showing_heatmap;
	},

	render_heatmap: function() {
		if (this.heatmap === null) {
			
			this.heatmap = new google.maps.visualization.HeatmapLayer({
		 		data: this.latlng_points,
		 		map: this.map
		 	});
		}
		else {
		 	this.heatmap.setData(this.latlng_points);
		 	this.heatmap.setMap(this.map);
		}
	},

	hide_heatmap: function() {
		this.heatmap.setMap(null)
	},

	markers_toggle: function() {
		var self = this;
		if (this.showing_markers === false) {
			if (this.markers.length === 0) {
				this.get_tweet_locations().then(function() {
					self.render_markers.call(self);
				});	
			}
			else {
				this.render_markers();
			}
		}
		else {
			this.hide_markers();
		}
		this.showing_markers = !this.showing_markers;
	},


	create_marker: function(latLng_point) {
		var marker = new google.maps.Marker({
      		position: latLng_point,
      		map: this.map
  		});
  		return marker;
	},

	add_latlng_point: function(lng, lat) {
		var latlng_point = new google.maps.LatLng(lng,lat);
		this.latlng_points.push(latlng_point);
	},

	render_markers: function(){
		var marker;
		console.log(this);
		for (var i = 0; i < this.latlng_points.length; i++) {
			marker = this.create_marker(this.latlng_points[i]);
			this.markers.push(marker);
		}
	},

	hide_markers: function() {	
		for (var i = 0 ; i < this.markers.length; i++) {
			this.markers[i].setMap(null);
		}
	},

	get_tweet_locations: function() {
		var deferred = q.defer();
		var self = this;
		$.get('/mine/locations', {}, function(response) {
			
			if (response.status === 'OK') {
				var tweets = response.data,
					location, lng, lat;
				for (var i = 0; i < tweets.length; i++) {
					location = tweets[i].location;
					lng = location[0];
					lat = location[1];
					self.add_latlng_point(lng,lat);
				}
				deferred.resolve();
			}
			else {
				deferred.reject(response.message);
			}
		});
		return deferred.promise;
	},

	bind_dom_events: function() {
		var self = this;
		$("#heatmap_toggle").on('click', function(){ 
			self.heatmap_toggle.call(self);
		});
		$("#markers_toggle").on('click', function() {
			self.markers_toggle.call(self);
		});
	},
	
	refresh: function() {
		if (this.map !== null) {
			google.maps.event.trigger(map.map, 'resize')	
		}
		
	}
};

module.exports = Map;