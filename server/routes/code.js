var express = require('express');
var router = express.Router();
var RHelper = require('../services/RHelper');

router.post('/compile', compile);
router.get('/examples', get_examples);

var r_helper = new RHelper();

function compile(req, res, next) {	
	r_helper.compile(req.body.code).then(function(data) {
		var status = (data.output.err === null)?'OK':'ERROR';
		var response = {
			status: status,
			data: data
		};
		res.send(response);

	});
}

function get_examples(req, res, next) {

	r_helper.get_examples().then(function(examples){
		var response = {
			'status' : 'OK',
		    'data' : examples
		};
		console.log(response);
		res.send(response);
	});
}


module.exports = router;