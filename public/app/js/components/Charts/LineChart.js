
var React = require('react');
var GoogleChartLoader = require('./GoogleChartLoader');
var AppStore = require('../../stores/app-store');

console.log(GoogleChartLoader);

var wrapper = null;

var GoogleLineChart = React.createClass({
  wrapper: null,
  getInitialState: function() {
    return {
      wrapper : null,
      dataTable: []
    };
  },
  getInitialProps: function() {
    return {
      graphName : '',
      wrapper : null,
      dataTable : []
    };
  },
  render: function(){
    return React.DOM.div({id: this.props.graphName, style: {height: "150px", width:"200px", paddingTop:"45px", display: "none" }});
  },
  componentDidMount: function(){
    var self = this;
    GoogleChartLoader.init().then(function(){
      self.drawCharts();
    });     
  },

  componentDidUpdate: function(){

    if (GoogleChartLoader.loaded) {
      this.drawCharts();
      return;
    }
    GoogleChartLoader.init().then(function() {
      this.drawCharts();
    });
    
  },

  drawCharts: function() {
    
    console.log("Drawing Chart");
    if (this.props.dataTable.length === 0){
      return;
    }


    //Read options from prop
    
    var self = this;
    if (this.wrapper == null) {
      this.wrapper = new google.visualization.ChartWrapper({
        chartType: 'ScatterChart',
        dataTable: this.props.dataTable,
        options: {legend: { position: 'bottom' }, pointSize: 2, curveType: 'function', explorer: {}, colors: ['#29abe1'], }, //tooltip: {trigger:'none'}},
        containerId: this.props.graphName
      });

      google.visualization.events.addListener(this.wrapper, 'ready', function () {
        google.visualization.events.addListener(self.wrapper.getChart(), 'select', function() {
          var selected_point = self.wrapper.getChart().getSelection();
          
          console.log(selected_point[0].row);
          console.log(self.props.dataTable)
          //Change after changing datatable type
          var row = selected_point[0].row+1;
          var tweet_id = self.props.dataTable[row][0];
          
          console.log(tweet_id);
          AppStore.filter_tweets(tweet_id);


        });
      });

      

    }
    else {
      console.log(this.props.dataTable);
      this.wrapper.setDataTable(this.props.dataTable);
    }

    $("#"+this.props.graphName).show();

    this.wrapper.draw();
    
   // var data = google.visualization.arrayToDataTable(this.props.dataTable);

    //console.log(this.chart);
    
    // if (!chart) {
    //   console.log("HERE ", chart);
    //   chart = new google.visualization.LineChart(document.getElementById(this.props.graphName));  
    // }
    // else {
    //   console.log("already drawn");
    // }
    // chart.draw(data, options);
    
  }
});

module.exports = GoogleLineChart;