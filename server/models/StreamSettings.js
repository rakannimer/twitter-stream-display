var mongoose = require("mongoose");
var q = require('q');
var SchemaTypes = mongoose.Schema.Types;
var StreamSettingsSchema = new mongoose.Schema({
  user_id : {type: Number},
  current_search_terms: {type: String},
  tweet_frequency: {type: Number},
  created_at    : { type: Date },
  updated_at    : { type: Date }
});


function preupdate(next){
  
  var now = new Date();
  this.updated_at = now;

  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
}
StreamSettingsSchema.pre('save', preupdate);
StreamSettingsSchema.pre('update', preupdate);
StreamSettingsSchema.pre('findOneAndUpdate', preupdate);

StreamSettingsSchema.statics.get = function(conditions, values) {
	//Change by using bluebird on Mongo !
  var deferred = q.defer(); 
  StreamSettings.findOne(conditions, values, function(err, doc){
		if (err === null) {
      return deferred.resolve(doc);
    }
    else {
      return deferred.reject(err);
    }
	});
	return deferred.promise;
};

StreamSettingsSchema.statics.get_current_search_terms = function(user_id) {
  //Change by using bluebird on Mongo !
  var deferred = q.defer(); 
  StreamSettings.findOne({user_id: 1}, {}, function(err, doc){
    if (err === null) {
      return deferred.resolve(doc.current_search_terms);
    }
    else {
      return deferred.reject(err);
    }
  });
  return deferred.promise;

};
StreamSettingsSchema.statics.update_frequency_by_user_id = function(user_id, tweet_frequency) {
  StreamSettings.update({user_id : 1}, { $set: {tweet_frequency: tweet_frequency}}, function(){
    console.log("Saved");
  });
};

var StreamSettings = mongoose.model('StreamSettings', StreamSettingsSchema);
module.exports = StreamSettings;