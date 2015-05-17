var response = {
	sendOk: function(res, data) {
		var response = {
			status : 'OK',
			data: data
		}
		res.send(response);
	},
	sendError: function(res, data) {
		var response = {
			status: 'ERROR',
			data: data	
		};
		res.send(response);
	}
};

module.exports = response;