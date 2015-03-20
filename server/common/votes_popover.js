// Fetch votes info, for popover
//
'use strict';

var _ = require('lodash');

module.exports = function (N, apiPath) {
  N.validate(apiPath, {
    for: { format: 'mongo', required: true }
  });

  // Fill votes and collect users
  //
  N.wire.on(apiPath, function fill_votes(env, callback) {
    N.models.users.Vote.find({ for: env.params.for, value: { $in: [ 1, -1 ] } })
        .select('from value')
        .lean(true)
        .exec(function (err, votes) {

      if (err) {
        callback(err);
        return;
      }

      env.data.users = env.data.users || [];

      env.res.votes = _.reduce(votes, function (result, vote) {
        env.data.users.push(vote.from);

        if (vote.value === 1) {
          result.up.push(vote.from);
        } else if (vote.value === -1) {
          result.down.push(vote.from);
        }

        return result;
      }, { up: [], down: [] });

      callback();
    });
  });
};