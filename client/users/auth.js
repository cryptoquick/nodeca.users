'use strict';


/**
 *  client
 **/

/**
 *  client.common
 **/

/**
 *  client.common.auth
 **/


/*global $, _, nodeca, window*/


// rebuild_login_form(elem, params) -> Void
// - elem (Object): form DOM element
// - params (Object): render template params
//
// rebuild form after some error
//
function rebuild_login_form(elem, params) {
  elem.replaceWith(
    nodeca.client.common.render('users.auth.login.view', params)
  ).fadeIn();
}


/**
 *  client.common.auth.login($form, event)
 *
 *  send login request
 **/
module.exports.login = function ($form, event) {
  var message;
  var params = nodeca.client.common.form.getData($form);

  var is_empty_fields = _.any(['email', 'pass', 'recaptcha_response_field'], function(field) {
    return _.isEmpty(params[field]);
  });
  if (is_empty_fields) {
    message = nodeca.runtime.t('users.auth.login_form.empty_fields');
    rebuild_login_form($form, {email: params.email, error: message});
    return false;
  }

  // FIXME validate data and strengthen password
  nodeca.server.users.auth.login.plain.exec(params, function (err) {
    if (!!err) {
      // auth errors
      if (err.statusCode === 401) {
        rebuild_login_form($form, {email: params.email, error: err.message});
        return;
      }
      // FIXME push message to notification system
      return;
    }
    nodeca.client.common.history.navigateTo('users.profile');
  });
  return false;
};


/**
 *  client.common.auth.register($form, event)
 *
 *  send registration data on server
 **/
module.exports.register = function ($form, event) {
  var params = nodeca.client.common.form.getData($form);
  // FIXME validate data and strengthen password
  nodeca.server.users.auth.register.exec(params, function(err, request){
    if (err) {
      if (err.statusCode === 401) {
        //FIXME duplicate email err
      }
      else {
        //FIXME parse error message and set errors by field
      }
      return;
    }
    $form.replaceWith(
      nodeca.client.common.render('users.auth.register.success')
    ).fadeIn();
  });
  return false;
};