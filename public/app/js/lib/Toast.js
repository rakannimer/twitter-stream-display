var toastr = require('toastr'),

	Toast = function() {
		toastr.options.closeButton = true;
		toastr.options.extendedTimeOut = 60;
		toastr.options.progressBar = true; 
	};

	Toast.prototype.log = function(message, type){
		if (type !== 'success' && type !== 'info' && type !== 'warning' && type !== 'error') {
			console.log("Warning : variable type supplied to Toast is not valid, default 'info' type provided");
			type = 'info';	
		}
		Materialize.toast(message,3000);
		//toastr[type](message);
	};

module.exports = new Toast();