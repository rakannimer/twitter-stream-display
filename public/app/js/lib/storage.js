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
module.exports = storage;