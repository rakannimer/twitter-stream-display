
var React = require('react');
var Reflux = require('reflux');
var Navbar = require('./SideNav/Navbar');
var Header = require('./Header/Header');
var CardRow = require('./Columns/CardRow');
var SearchForm = require('./SearchForm');

var CardStore = require('../stores/app-store');

var App = React.createClass({

	getInitialState: function() {
		return {};
	},
	render: function() {
		return (
			<div className="App">
				<Navbar/>
				<Header>
					<SearchForm /> 
				</Header>
				<main>
					<CardRow />
				</main>
			</div>
		);
	}
});

React.render(<App />, document.getElementById('content'));


module.exports = App;