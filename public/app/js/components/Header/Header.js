var React = require('react');
var Navbar = require('../SideNav/Navbar')


var Header = React.createClass({
	render: function() {
		return (
			<div>
				<header>
					<nav className="top-nav" >
						<div className="nav-wrapper" >
							<div className="row">
				  				<div className="col l12">

				  					{this.props.children}

								</div>
							</div>
			  			</div>
					</nav>
					
				</header>
			</div>
		);
	}
});

module.exports = Header;

