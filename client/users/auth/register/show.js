'use strict';


var _           = require('lodash');
var ko          = require('knockout');


var CHECK_NICK_DELAY = 1000;


var view = null;


// View model for editable fields of the form: email, pass and nick.
//
function Control(defaultHelp) {
  this.defaultHelp = defaultHelp;

  this.css     = ko.observable('');
  this.message = ko.observable(null);
  this.value   = ko.observable('');
  this.help    = ko.computed(function () { return this.message() || this.defaultHelp; }, this);
}


N.wire.on('navigate.done:' + module.apiPath, function setup_page(__, callback) {
  // Root view model.
  view = {
    email: new Control(t('email_help'))
  , pass:  new Control(t('pass_help'))
  , nick:  new Control(t('nick_help'))

  , recaptcha_response_field: {
      visible: true
    , css:     ko.observable('')
    , message: ko.observable(null)
    }
  };

  if (N.runtime.page_data.email) {
    view.email.value(N.runtime.page_data.email);
  }

  // Reset nick CSS class and message on every change.
  view.nick.value.subscribe(function () {
    this.css('');
    this.message(null);
  }, view.nick);

  // Setup automatic nick validation on input.
  view.nick.value.subscribe(_.debounce(function (text) {
    if (text.length < 1) {
      return;
    }

    var self = this;

    N.io.rpc('users.auth.check_nick', { nick: text }).done(function (res) {
      self.css(res.error ? 'has-error' : '');
      self.message(res.message);
    });
  }, CHECK_NICK_DELAY), view.nick);

  // Apply root view model.
  ko.applyBindings(view, $('#content')[0]);

  // Init ReCaptcha.
  N.wire.emit('common.blocks.recaptcha.create', null, callback);
});


N.wire.on('navigate.exit:' + module.apiPath, function teardown_page() {
  ko.cleanNode($('#content')[0]);
  view = null;
});


// Send registration data to the server.
//
N.wire.on('users.auth.register.exec', function register(form) {

  N.io.rpc('users.auth.register.exec', form.fields)
    .done(function (res) {
      // Reload page in order to apply auto-login after the registration.
      window.location = res.redirect_url;
    })
    .fail(function (err) {
      // Update classes and messages on all input fields.
      _.forEach(view, function (field, name) {
        field.css(_.has(err.data, name) ? 'has-error' : '');
        field.message(err.data[name]);
      });

      // Update ReCaptcha words if there is a ReCaptcha error.
      if (_.has(err.data, 'recaptcha_response_field')) {
        N.wire.emit('common.blocks.recaptcha.update');
      }
    });
});
