var fs = require('fs');

require.extensions['.r'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var uuid= require('node-uuid'),
	q = require("q"),
	_ = require('underscore'),
	async = require('async'),
	exec = require('child_process').exec,
	r_template = require('../templates/header.r'),
	logger = require('tracer').colorConsole({
                    format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
                    dateformat : "HH:MM:ss.L"
                });

	var RHelper = function() {
		this.graph_paths = [];
		this.code_folder  = 'user-code';
		this.examples_folder_path = './public/R-examples';
		this.examples = [];
		this.public_examples_path = '/R-examples/';
	};

	RHelper.prototype = {
		
		get_examples: function() {
			var deferred = q.defer();
			var self = this;
			
			console.log(process.cwd());

			fs.readFile(this.examples_folder_path+'/examples.json','utf8',function(err,data){
				if(err) throw err;
				var r_examples = JSON.parse(data);
				self.examples = r_examples;
				
				return deferred.resolve( 
					{public_path: self.public_examples_path,
					 examples:self.examples} 
				);
			});
//			fs.readdir(this.examples_folder_path, function(err, files){
//				if (err !== null) {
//					return deferred.reject({status:'READ_DIR', message:err});
//				}
//				var file_names = [];
//				for (var i = 0; i < files.length; i++) {
//					if (files[i].indexOf(".r") > -1){
//						file_names.push(files[i]);
//						self.examples_file_path.push('/R-examples/'+files[i]);
//						logger.trace("R script Found %s", self.examples_file_path[i]);
//					}
//				}
//				return deferred.resolve( {paths:self.examples_file_path,names:file_names});
//			});
			return deferred.promise;
		},
		prepare_dir: function() {
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
			this.prepare_dir();
			var deferred = q.defer(),
			 	self = this,
			 	compile_output;
				
			this.mkdir(this.folder_path)
			.then( function(){  
				return self.write_code_to_fs(code); 
			}, function(e){console.log("ERor Writing code ",e)})
			.then(function(params){ 
				return self.compile_r_script(); 
			})
			.then(function(r_compile_output){
				compile_output = r_compile_output;
				
				return self.get_graphs_paths();
			}, function(){console.log("Eror getting getting graphs")})
			.then(function(params) {
				
				return deferred.resolve({
					output: compile_output,
					graphs: self.graph_paths
				});
			}, function(e){logger.error("Error Compiling R script %s, Error : %d",self.code_file_path,e)});
			
			return deferred.promise;
			
		},
		compile_r_script: function() {
			var deferred = q.defer();
			var self = this;
			logger.trace("Compiling R");
			
			exec('Rscript '+self.code_file_path, function(err, stdout, stderr){
				var r_output = {err: err, stdout: stdout, stderr: stderr};
				logger.info('Rscript compile output: %j ',r_output);
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
			fs.readdir(this.folder_path, function(err, files) {
				if (err !== null) {
					return deferred.reject({status:'READ_DIR', message:err});
				}
				for (var i = 0; i < files.length; i++) {
					if (files[i].indexOf(".png") > -1){
						self.graph_paths.push(self.public_folder_path +'/'+files[i]);
						logger.trace("Graph Found %s", self.graph_paths[i]);
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
				logger.trace("Code Written to %s , \nFile content :\n%s",self.code_file_path,r_head+code);
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



module.exports = RHelper;