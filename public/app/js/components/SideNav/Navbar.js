var React = require('react');
var MenuItem = require('./MenuItem')
console.log(MenuItem);
var Navbar = React.createClass({
	render: function() {
		return (
			<ul id="nav-mobile" className="side-nav fixed">
				<li  className="logo">
		    		<div className="logo_container">
		    			<a href="#" className="" >
							<img  width="70" src="./app/img/logo19.png" /> 
		    			</a>
		    		</div>
				</li>

				<MenuItem route = "#" title="Stream Tweets" active="true"/>
				<MenuItem route = "#" title="Write R"/>
				<MenuItem route = "#" title="Graphs"/>

		  	</ul>
		);
	}
});

module.exports = Navbar;