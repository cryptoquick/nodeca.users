"use strict";

exports.root = __dirname;
exports.name = 'nodeca.users';
exports.init = function (N) { require('./lib/hooks.js')(N); };
