/**
 *  class models.users.TokenLogin
 *
 *  Session ID and meta information about how session was created.
 **/


'use strict';


var Mongoose    = require('mongoose');
var Schema      = Mongoose.Schema;
var createToken = require('nodeca.core/lib/random_token');


module.exports = function (N, collectionName) {

  var TokenLogin = new Schema({
    session_id:      { type: String, 'default': createToken },
    user_id:         Schema.Types.ObjectId,
    authlink_id:     Schema.Types.ObjectId,
    ip:              String
  },
  {
    versionKey : false
  });

  // Indexes
  //////////////////////////////////////////////////////////////////////////////

  // used for re-creating session when redis session is expired
  TokenLogin.index({ session_id: 1 });

  //////////////////////////////////////////////////////////////////////////////


  N.wire.on('init:models', function emit_init_TokenLogin(__, callback) {
    N.wire.emit('init:models.' + collectionName, TokenLogin, callback);
  });


  N.wire.on('init:models.' + collectionName, function init_model_TokenLogin(schema) {
    N.models[collectionName] = Mongoose.model(collectionName, schema);
  });
};
