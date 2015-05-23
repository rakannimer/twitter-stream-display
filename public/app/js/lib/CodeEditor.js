var codemirror = require('codemirror'),
	$ = require('jquery'),
	_ = require('underscore');
require('codemirror/mode/r/r');
require('magnific-popup');
var examples_template = require('../../templates/examples_template.html');

var Toast = require('./Toast');
var storage = require('./storage');


var CodeEditor = function() {
	this.editor = null;
	this.console = null;
	$('.gallery-item').magnificPopup({
		type: 'image',
		gallery: {
	    	enabled:true
		}
	});
	this.bind_dom_events();
	this.load_examples();
}

CodeEditor.prototype = 
{
	init: function() {
		
	},

	load_editor: function(){
		if (this.editor !== null) {
			return;
		}
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
			  Toast.log("Code Saved","success");
		  }
		});
		var stored_code = storage.getItem("saved_code");
		if(typeof stored_code !== 'undefined') {
			this.editor.setValue(stored_code);	
		}
		//this.editor.setValue(stored_data.r_examples.count_entries);
		this.editor.setCursor(this.editor.lineCount(), 0);
	},

	load_console: function() {
		if (this.console !== null) {
			return;
		}
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
		Toast.log("Code Saved","info");
		$.post('/code/compile',{code: code},function(response) {
			var output = response.data.output;
			
			if (response.status === 'OK') {
				Toast.log("Code Saved","success");
			}
			else {
				self.write_to_console(output.stderr);
				Toast.log("Something happened","error");
			}

			if (typeof output.stdout === 'undefined') {
				self.write_to_console('Done. \n');
			}
			else {
				self.write_to_console(output.stdout);
				if (output.stderr !== '') {
					self.write_to_console(output.stderr);
				}
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
	},
	load_examples: function() {
		var self = this;
		$.get('/code/examples', function(response){
			if (response.status === 'OK') {
				var compiledTemplate = _.template(examples_template);
				compiledTemplate = compiledTemplate({data: response.data});
				$("#examples").html(compiledTemplate);
				self.bind_example_dom_events();
			}
			//response.data.examples_path
						
		});	
	}
	
};

module.exports = CodeEditor;