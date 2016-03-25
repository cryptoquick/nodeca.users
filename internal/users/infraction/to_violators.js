// Add user to violators
//
'use strict';


module.exports = function (N, apiPath) {

  N.wire.on(apiPath, function* add_user_to_violators(params) {
    let violators = yield N.models.users.UserGroup.findOne()
                              .where('short_name').equals('violators')
                              .lean(true);

    yield N.models.users.User.update({ _id: params.infraction.for }, { $addToSet: { usergroups: violators._id } });

    let expire = new Date(Date.now() + (params.action_data.days * 24 * 60 * 60 * 1000));

    yield N.models.users.UserPenalty.update(
      { user_id: params.infraction.for },
      { expire },
      { upsert: true }
    );
  });
};