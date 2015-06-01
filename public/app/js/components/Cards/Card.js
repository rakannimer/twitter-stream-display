var React = require('react');
var Reflux = require('reflux');
var classNames = require( 'classnames' ); 
var AppStore = require('../../stores/app-store');
var ScatterPlot = require('../Charts/ScatterPlot');
var Card = React.createClass({

  	getInitialState: function() {
  		return {
  			headline: '',
        stats: {
          mean : -1,
          max : -1,
          min : -1,
          std_dev : -1,
          median : -1
        },
        loaded : false
  		}
  	},
  	componentDidMount: function() {
    	this.setState(AppStore.get_card_state());
    	var self = this;

    	AppStore.listen(function(data){
        alert(data);
        if (data !== 'CARDS_RECEIVED') {
          return;
        }
    		console.log("Received Data from store", data);
        console.log(self.props);
        var card_data = AppStore.cards[self.props.type];
        self.setState({'loaded' : true});
    		self.setState({'headline': card_data.headline });
        if (card_data.stats !== null)
          self.setState({'stats': card_data.stats});
    	});

  	},

  render: function() {

  	var result_classes = classNames({
  		'result': true,
      'show-result': this.state.loaded
    });

    return (
    	<div className="col l3">
			<div className="card main-bg headline-card" >
				<div className="card-content">
					<span className="card-title"> 
						{this.props.title}  
					</span>
          <div className={(this.state.loaded && this.props.type !== 'geotagged')?'':'hide'}>
              <ul>
                <li>Average : {this.state.stats.mean }</li>
                <li>Max : {this.state.stats.max }</li>
                <li>Min : {this.state.stats.min }</li>
                <li>Std Dev : {this.state.stats.std_dev }</li>
                <li>Median : {this.state.stats.median }</li>
              </ul>
          </div>
				</div>
        
        <ScatterPlot type={this.props.type}  />

				<div className="card-action">
					<a href="#">More Data</a>
				</div>
			</div>
		</div>

    );
  }
});

module.exports = Card;



