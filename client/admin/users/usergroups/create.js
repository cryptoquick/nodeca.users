'use strict';


/**
 *  client
 **/

/**
 *  client.admin
 **/

/**
 *  client.admin.users
 **/

/**
 *  client.admin.users.usergroups
 **/

/**
 *  client.admin.users.usergroups.create
 **/


/*global nodeca, _*/

var white_list = ['short_name', 'parent'];
var params_mask = 's_';

/**
 *  client.admin.users.usergroups.create($form, event)
 *
 * collect new group data from form and send on server
 **/
module.exports = function ($form) {
  var data = nodeca.client.admin.form.getData($form);
  var params = {};

  if (_.isEmpty(data.parent)) {
    delete(data.parent);
  }

  _.keys(data).forEach(function(key) {
    if (key.indexOf(params_mask) === 0) {
      params[key.replace(params_mask, '')] = data[key];
      return;
    }
    if (white_list.indexOf(key) !== -1) {
      params[key] = data[key];
    }
  });
  nodeca.server.admin.users.usergroups.create(params, function (err) {
    var err_message;
    if (err) {
      // Wrong form params - regenerate page with hightlighted errors
      if (err.code === nodeca.io.BAD_REQUEST) {
        // add errors
        if (err.data) {
          // error from action
          err_message = err.data.common;
        }
        else {
          // error from revalidator
          err_message = err.message;
        }
        nodeca.client.admin.notify('error', err_message);
        return;
      }

      // no need for fatal errors notifications as it's done by io automagically
      nodeca.logger.error(err);
      return;
    }

    nodeca.client.admin.notify('info', nodeca.runtime.t('admin.users.usergroups.edit.created'));
  });

  // Disable regular click
  return false;
};
