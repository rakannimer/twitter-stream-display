var _ = require('underscore');
var $ = require('jquery');
var tweetTemplate = require('../templates/tweet-dom.html');

var linkify = require('html-linkify');

var tweetDomCreator = {

    logTemplate: function() {
        console.log(tweetTemplate);
    },

    createNode : function(tweet) {

        tweet.created_at = this.formatTime(tweet.created_at);
        tweet.text = linkify(tweet.text);
        var compiledTemplate = _.template(tweetTemplate);
        compiledTemplate = compiledTemplate({tweet: tweet});
        return compiledTemplate;
    },

    appendToNode: function(tweet, identifier) {
        var tweetTemplate = this.createNode(tweet);
        $(identifier).append(tweetTemplate);
    },
    prependToNode: function(tweet, identifier) {
        var tweetTemplate = this.createNode(tweet);
        $(identifier).prepend(tweetTemplate);
    },

 //
 // Formats the time in the following manner
 // Longer than 24 hours (MM/dd/yyyy hh:mm:ss TT)
 // Less than 24 hours (hh:mm:ss TT)
 //
    formatTime : function(time){

        var now = new Date();
        var date = new Date(time);
        var amPm = "AM";
        var hour = date.getHours();

        if(hour>12) {
            hour = (hour - 12);
            amPm = "PM";
        }
        else if(hour===12)
            amPm = "PM";

        var minute = date.getMinutes();
        if(minute < 10)
            minute = '0'+minute;

        var seconds = date.getSeconds();
        if(seconds < 10)
            seconds = '0'+seconds;

        if(now.getTime()-date.getTime()>1000*60*60*24){
            return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() +
                " " + hour + ":" + minute + ":" + seconds + ' ' + amPm;
        }
        else
            return hour + ":" + minute + ":" + seconds + ' ' + amPm;
    }
  };


  if (typeof define === 'function' && define.amd) {
    define(function() { return tweetDomCreator; });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = tweetDomCreator;
  } else if (typeof window !== 'undefined') {
    window.tweetDomCreator = window.swal = tweetDomCreator;
  }
