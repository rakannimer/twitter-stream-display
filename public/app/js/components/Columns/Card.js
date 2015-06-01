var React = require('react');
var Reflux = require('reflux');
var classNames = require( 'classnames' ); 
var AppStore = require('../../stores/app-store');
var ScatterPlot = require('../Charts/ScatterPlot');
var GoogleChart = require('../Charts/GoogleChartLoader');
var LineChart = require('../Charts/LineChart');

Number.prototype.roundToTwo= function() {    
    return +(Math.round(this + "e+2")  + "e-2");
}

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
        counts: [],
        tweet_ids: [],
        data_rows: [],
        // data_rows: [
        //   ['Year', 'Sales', 'Expenses'],
        //   ['2004',  1,      400],
        //   ['2005',  2,      460],
        //   ['2006',  30,       1120],
        //   ['2007',  1030,      540]
        // ],
        loaded : false
  		}
  	},
  	componentDidMount: function() {
    	this.setState(AppStore.get_card_state());
    	var self = this;

    	AppStore.listen(function(data){
        
        var card_data = AppStore.cards[self.props.type];
        self.setState({'loaded' : true});
    		self.setState({'headline': card_data.headline });
        self.setState({'counts': card_data.counts});
        self.setState({'tweet_ids': card_data.tweet_ids});
        if (card_data.stats !== null)
          self.setState({'stats': card_data.stats});
        
        self.setState({'data_rows':card_data.data_rows})
    	});

  	},

  render: function() {

  	var result_classes = classNames({
  		'result': true,
      'show-result': this.state.loaded
    });

    return (
      <div className="row">
        <div className="col l6">
				  <span className="card-title"> 
					 {this.props.title}
				  </span>
        
          <div className={(this.state.loaded && this.props.type !== 'geotagged')?'':'hide'}>
              <ul className="stats-result-list">
                <li className = "stats-result">Average : {this.state.stats.mean.roundToTwo() }</li>
                <li className = "stats-result">Max : {this.state.stats.max.roundToTwo() }</li>
                <li className = "stats-result">Min : {this.state.stats.min.roundToTwo() }</li>
                <li className = "stats-result">Std Dev : {this.state.stats.std_dev.roundToTwo() }</li>
                <li className = "stats-result">Median : {this.state.stats.median.roundToTwo() }</li>
              </ul>
          </div>
        </div>
        <div >
          <div className="col l6">
              <LineChart  graphName={this.props.type} dataTable={this.state.data_rows} chartOptions={{}}/>
          </div>
        </div>
      </div>

    );
  }
});

module.exports = Card;



