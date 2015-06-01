var React = require('react');
var Reflux = require('reflux');
var AppActions = require('../actions/app-actions');
var AppStore = require('../stores/app-store');

var SearchForm = React.createClass({

  getInitialState: function() {
    return {};
  },

  handleKeyDown: function(e) {
    if (e.keyCode === 13) {
      AppStore.post_search(e.target.value);

    }
  },
  
  render: function() {
    return (

      <div>

          <div className="input-field header-search">
            <input onKeyDown={this.handleKeyDown} id="search" type="search" required />
            <label htmlFor="search"><i className="mdi-action-search" /></label>
            <i className="mdi-navigation-close" />
          </div>
        
      </div>
    );
  }
});

module.exports = SearchForm;