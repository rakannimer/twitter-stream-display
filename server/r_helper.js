var fs = require('fs');

require.extensions['.r'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var uuid= require('node-uuid'),
	q = require("q"),
	_ = require('underscore'),
	async = require('async'),
	exec = require('child_process').exec,
	r_template = require('./templates/header.r'),
	r_helper = {
		graph_paths: [],
		code_folder : 'user-code',
		init: function() {
			var folder_name = this.mk_folder_name();
			this.folder_path = './public/user-code/'+folder_name;	
			this.public_folder_path = '/user-code/'+folder_name;
			this.code_file_path = './public/user-code/'+folder_name+'/code.r';
		},
		mk_folder_name: function() {
			//Refactor: Add some more complex logic if there's user authentication
			return 'r-twitter-'+uuid.v1();
		},
		compile: function(code) {
			var deferred = q.defer(),
			 	self = this,
			 	compile_output;
				
			this.mkdir(this.folder_path)
			.then( function(){  
				return self.write_code_to_fs(code); 
			})
			.then(function(params){ 
				return self.compile_r_script(); 
			})
			.then(function(compile_out){
				compile_output = compile_out;
				
				return self.get_graphs_paths();
			})
			.then(function(params) {
				console.log("ASD");
				return deferred.resolve({
					output: {stdout: params.stdout, stderr: params.stderr},
					graphs: self.graph_paths
				});
			});
			
			return deferred.promise;
			
		},
		compile_r_script: function() {
			var deferred = q.defer();
			var self = this;
			console.log("Compiling R");
			
			exec('Rscript '+self.code_file_path, function(err, stdout, stderr){
				console.log("HERE");
				var r_output = {err: err, stdout: stdout, stderr: stderr};
				console.log(r_output);
				return deferred.resolve(r_output);
			});
			return deferred.promise;
		},
		
		prepare_output: function(compile_output) {
			//var deferred = q.defer();
			return {
				console_output: compile_output,
				graphs: this.graph_paths
			};
		},
		
		get_graphs_paths: function() {
			var deferred = q.defer();
			var self = this;
			console.log("here");
			fs.readdir(this.folder_path, function(err, files) {
				if (err !== null) {
					return deferred.reject({status:'READ_DIR', message:err});
				}
				for (var i = 0; i < files.length; i++) {
					if (files[i].indexOf(".png") > -1){
						self.graph_paths.push(self.public_folder_path +'/'+files[i]);
						console.log("Image Found");
					}
				}
				return deferred.resolve(self.graph_paths);
			});
			return deferred.promise;
		},
		
		write_code_to_fs: function(code) {
			var deferred = q.defer(),
			 	self = this,
				r_head = this.template_r_header();
			
			fs.writeFile(self.code_file_path, r_head+code, function(err) {
				if (err) {
					return deferred.reject({status:'CREATE_FILE', message:err});
				}
				console.log(r_head+code);
				return deferred.resolve(true);
			});
			return deferred.promise;
		},
		
		mkdir: function(folder_path, callback) {
			var deferred = q.defer();
			fs.mkdir(this.folder_path, function(err){
				if (err) {
					return deferred.reject({status:'CREATE_DIR', message:err});
				}
				return deferred.resolve(true);
			});
			return deferred.promise;
		},
		template_r_header: function() {
			var compiledTemplate = _.template(r_template);
			compiledTemplate = compiledTemplate({folder_path: this.folder_path});
			return compiledTemplate;
		}
	};

r_helper.init();


module.exports = r_helper;