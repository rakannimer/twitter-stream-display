var _ = require('underscore'),
	q = require('q'),
	archive_template = require('../../templates/archived_data.html');

var Archive = function() {
	var self = this;
	this.get_search_history().then(function(){ 
		self.render_archive.call(self)
	});
};

Archive.prototype = {


	get_search_history: function() {
		var deferred = q.defer();
		var self = this;
		$.get('/mine/history',{},function(response) {
			if (response.status !== 'OK') return deferred.reject(response.message);
			
			self.search_history = response.data;
			return deferred.resolve(response.data.search_history);
		});

		return deferred.promise;

	},
	render_archive: function(search_history) {
		var compiledTemplate = _.template(archive_template);
        compiledTemplate = compiledTemplate({archived_tweets: search_history});
        $("#tweet_archive").html(compiledTemplate);
	}

};
module.exports = Archive;