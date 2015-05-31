var React = require('react');
var MenuItem = React.createClass({

	getDefaultProps: function() {
		return {
			route:'#',
			title:'',
			active: false
		};
	},
	render: function() {
		console.log(this.props.active?'active':'');
		return (
		    <li className={this.props.active?'active':''}>
		    	<a href={this.props.route} className="waves-effect waves-light sidenav-item ">
		    		{ this.props.title }
		    	</a>
		    </li>
		);
	}
});

module.exports = MenuItem;