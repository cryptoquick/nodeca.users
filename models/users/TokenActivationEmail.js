/**
 *  class models.users.TokenActivationEmail
 *
 *  Expirable secret key used for email address confirmation by newly
 *  registered users.
 **/


'use strict';


var Mongoose = require('mongoose');
var Schema   = Mongoose.Schema;
var crypto   = require('crypto');


var TOKEN_EXPIRE_TIMEOUT    = 6 * 60 * 60; // 6 hours in seconds.
var TOKEN_SECRET_KEY_LENGTH = 16;


function generateSecretKey() {
  return crypto.randomBytes(TOKEN_SECRET_KEY_LENGTH).toString('hex');
}


module.exports = function (N, collectionName) {
  var TokenActivationEmail = new Schema({
    secret_key: { type: String, 'default': generateSecretKey, required: true }
  , create_ts:  { type: Date,   'default': Date,              expires: TOKEN_EXPIRE_TIMEOUT, required: true }
  , user_id:    { type: Schema.Types.ObjectId,                required: true }
  },
  {
    versionKey : false
  });

  TokenActivationEmail.index({ secret_key: 1 });
  TokenActivationEmail.index({ user_id: 1 });

  TokenActivationEmail.methods.isExpired = function isExpired() {
    return Date.now() >= (this.create_ts.getTime() + TOKEN_EXPIRE_TIMEOUT * 1000);
  };


  N.wire.on("init:models", function emit_init_TokenActivationEmail(__, callback) {
    N.wire.emit("init:models." + collectionName, TokenActivationEmail, callback);
  });

  N.wire.on("init:models." + collectionName, function init_model_TokenActivationEmail(schema) {
    N.models[collectionName] = Mongoose.model(collectionName, schema);
  });
};
