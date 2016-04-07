'use strict';

const eventEmitter = require('events');
const util = require('./util');
const backend = require('./backend');
const logger = require('./logger');
const notice = require('./notice');
const configOpts = ['apiKey', 'endpoint', 'projectRoot', 'environment',
  'hostname', 'developmentEnvironments'];

function Honeybadger(opts) {
  var self = Object.create(eventEmitter.prototype);

  eventEmitter.call(self);

  self.configure = configure;
  self.setContext = setContext;
  self.resetContext = resetContext;
  self.wrap = wrap;
  self.notify = notify;

  self.apiKey = process.env.HONEYBADGER_API_KEY;
  self.endpoint = process.env.HONEYBADGER_ENDPOINT
  self.projectRoot = process.env.HONEYBADGER_PROJECT_ROOT
  self.environment = process.env.HONEYBADGER_ENVIRONMENT

  self.logger = logger('error');
  self.context = {};
  self.developmentEnvironments = [];

  self.configure(opts);

  return self;
}

function configure(opts) {
  var opt;
  if (!(opts instanceof Object)) { return this; }
  for (opt in opts) {
    if (configOpts.indexOf(opt) < 0) { throw new Error('Invalid config option: ' + opt); }
    this[opt] = opts[opt];
  }
  return this;
}

function setContext(context) {
  if (context instanceof Object) {
    this.context = util.merge(this.context, context);
  }
  return this;
}

function resetContext(context) {
  if (context instanceof Object) {
    this.context = util.merge({}, context);
  } else {
    this.context = {};
  }
  return this;
}

function wrap(cb) {
  var self = this;
  return function() {
    try {
      return cb.apply(this, arguments);
    } catch(e) {
      self.notify(e, {stackShift: 3});
      throw(e);
    }
  }
}

function notify(err, name, extra) {
  if (!this.apiKey) { return this; }

  if (!err) { err = {}; }

  if (err instanceof Error) {
    var e = err;
    err = {name: e.name, message: e.message, stack: e.stack};
  }

  if (!(err instanceof Object)) {
    var m = String(err);
    err = {message: m};
  }

  if (name && !(name instanceof Object)) {
    var n = String(name);
    name = {name: n};
  }

  if (name) {
    err = util.merge(err, name);
  }

  if (extra instanceof Object) {
    err = util.merge(err, extra);
  }

  if (!err.projectRoot) { err.projectRoot = this.projectRoot; }
  if (!err.hostname) { err.hostname = this.hostname; }
  if (!err.environment) { err.environment = this.environment; }
  if (this.developmentEnvironments.indexOf(err.environment) !== -1) { return this; }

  err.context = util.merge(this.context, err.context || {});
  err.stackFilter = stackFilter(this);
  if (!err.stackShift) { err.stackShift = 2; }

  var self = this;
  notice(err, function (payload) {
    backend.notice(self, payload);
  });

  return this;
}

function stackFilter(client) {
  return function(f) {
    if (f.file) {
      f.file = f.file.replace(/.*\/node_modules\/(.+)/, '[NODE_MODULES]/$1');
      f.file = f.file.replace(client.project_root, '[PROJECT_ROOT]');
    }
    return f;
  }
}

var singleton = Honeybadger();
singleton.factory = Honeybadger;
module.exports = singleton;
