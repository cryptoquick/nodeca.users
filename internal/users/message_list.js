// Get message list with all data needed to render
//
// in:
//
// - env.data.dialog_id
// - env.data.build_messages_ids (env, callback) - should fill `env.data.messages_ids` with correct sorting order
//
// out:
//
//   env:
//     res:
//       dialog
//       users: []
//       messages: []
//       settings: {}
//       last_message_id
//       first_message_id
//       infractions: ...
//     data:
//       dialog
//       messages: []
//       settings: {}
//
'use strict';


const _ = require('lodash');


module.exports = function (N, apiPath) {

  // Fetch and fill permissions
  //
  N.wire.before(apiPath, async function fetch_and_fill_permissions(env) {
    env.res.settings = env.data.settings = await env.extras.settings.fetch([
      'can_use_dialogs',
      'can_create_dialogs',
      'can_report_abuse',
      'can_see_ip',
      'users_mod_can_add_infractions_dialogs'
    ]);
  });


  // Check permissions
  //
  N.wire.before(apiPath, function check_permissions(env) {
    if (!env.user_info.is_member) throw N.io.NOT_FOUND;
    if (!env.data.settings.can_use_dialogs) throw N.io.NOT_FOUND;
  });


  // Fetch dialog
  //
  N.wire.before(apiPath, async function fetch_dialog(env) {
    let dialog = await N.models.users.Dialog.findOne()
                          .where('_id').equals(env.data.dialog_id)
                          .where('exists').equals(true)
                          .lean(true);

    if (!dialog) throw N.io.NOT_FOUND;

    // permission checks:
    //  - allow dialog owner to see messages in dialog
    //  - allow anyone who can give infractions to see all messages
    if (String(dialog.user) !== env.user_info.user_id &&
        !env.data.settings.users_mod_can_add_infractions_dialogs) {

      throw N.io.NOT_FOUND;
    }

    env.res.dialog = env.data.dialog = dialog;
  });


  // Get messages ids
  //
  N.wire.before(apiPath, async function get_messages_ids(env) {
    await env.data.build_messages_ids(env);
  });


  // Fetch and sort messages
  //
  N.wire.on(apiPath, async function fetch_and_sort_messages(env) {
    let messages = await N.models.users.DlgMessage.find()
                            .where('parent').equals(env.data.dialog._id)
                            .where('exists').equals(true)
                            .where('_id').in(env.data.messages_ids)
                            .lean(true);

    env.data.messages = [];

    // Sort in `env.data.messages_ids` order.
    // May be slow on large dialogs volumes
    env.data.messages_ids.forEach(id => {
      let msg = _.find(messages, m => m._id.equals(id));

      if (msg) {
        env.data.messages.push(msg);
      }
    });

    // Fill messages
    env.res.messages = env.data.messages;
  });


  // Fill first and last message _id
  //
  N.wire.after(apiPath, async function fill_first_and_last_message_id(env) {
    let last_msg = await N.models.users.DlgMessage.findOne()
                            .where('parent').equals(env.data.dialog._id)
                            .where('exists').equals(true)
                            .sort('_id')
                            .select('_id')
                            .lean(true);

    let first_msg = await N.models.users.DlgMessage.findOne()
                              .where('parent').equals(env.data.dialog._id)
                              .where('exists').equals(true)
                              .sort('-_id')
                              .select('_id')
                              .lean(true);

    env.res.first_message_id = first_msg ? first_msg._id : null;
    env.res.last_message_id = last_msg ? last_msg._id : null;
  });


  // Fetch infractions
  //
  N.wire.after(apiPath, async function fetch_infractions(env) {
    let settings = await env.extras.settings.fetch([
      'users_mod_can_add_infractions_dialogs',
      'can_see_infractions'
    ]);

    if (!settings.can_see_infractions && !settings.users_mod_can_add_infractions_dialogs) return;

    let infractions = await N.models.users.Infraction.find()
                                .where('src_common_id').in(_.map(env.data.messages, 'common_id'))
                                .where('exists').equals(true)
                                .select('src points ts src_common_id')
                                .lean(true);

    env.res.infractions = infractions.reduce((acc, infraction) => {
      acc[infraction.src_common_id] = infraction;
      return acc;
    }, {});
  });


  // Collect users
  //
  N.wire.after(apiPath, function collect_users(env) {
    env.data.users = env.data.users || [];

    env.data.users.push(env.data.dialog.to);

    env.data.messages.forEach(msg => {
      env.data.users.push(msg.user);
    });
  });
};
