'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var backend = require('./backend');
var logger = require('./logger');
var notice = require('./notice');
var middleware = require('./middleware');
var configOpts = ['apiKey', 'endpoint', 'projectRoot', 'environment',
  'hostname', 'developmentEnvironments', 'logger'];
var uncaughtExceptionInstalled;

function Honeybadger(opts) {
  var self = Object.create(EventEmitter.prototype);

  EventEmitter.call(self);

  self.configure = configure;
  self.setContext = setContext;
  self.resetContext = resetContext;
  self.wrap = wrap;
  self.notify = notify;

  self.errorHandler = middleware.errorHandler(self);

  self.apiKey = process.env.HONEYBADGER_API_KEY;
  self.endpoint = process.env.HONEYBADGER_ENDPOINT || 'https://api.honeybadger.io';
  self.projectRoot = process.env.HONEYBADGER_PROJECT_ROOT || process.cwd();
  self.environment = process.env.HONEYBADGER_ENVIRONMENT || process.env.NODE_ENV;
  self.hostname = process.env.HONEYBADGER_HOSTNAME || require('os').hostname();
  self.developmentEnvironments = ['dev', 'development', 'test'];
  self.filters = ['creditcard', 'password'];
  self.onUncaughtException = function(err) {
    self.logger.error(err.stack || err);
    process.exit(1);
  }

  self.logger = logger(process.env.HONEYBADGER_LOG_LEVEL || 'error');
  self.context = {};

  self.configure(opts);

  withUncaught.call(self);

  return self;
}

function withUncaught() {
  if (!uncaughtExceptionInstalled) {
    var self = this;
    process.on('uncaughtException', function(err) {
      self.notify(err, function() {
        self.onUncaughtException(err);
      });
    });
    uncaughtExceptionInstalled = true;
  }
  return this;
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

function notify(err, name, extra, callback) {
  if (!err) { err = {}; }

  if (util.is('Error', err)) {
    var e = err;
    err = {name: e.name, message: e.message, stack: e.stack};
  }
  if (!util.is('Object', err)) {
    var m = String(err);
    err = {message: m};
  }

  if (!callback && name && util.is('Function', name)) {
    callback = name;
    name = {};
  }
  if (!callback && extra && util.is('Function', extra)) {
    callback = extra;
    extra = undefined;
  }
  if (!util.is('Function', callback)) {
    callback = function(){};
  }

  if (name && !util.is('Object', name)) {
    var n = String(name);
    name = {name: n};
  }
  if (name) {
    err = util.merge(err, name);
  }

  if (util.is('Object', extra)) {
    err = util.merge(err, extra);
  }

  if (!err.environment) { err.environment = this.environment; }
  if (this.developmentEnvironments.indexOf(err.environment) !== -1) { return this; }

  if (!err.projectRoot) { err.projectRoot = this.projectRoot; }
  if (!err.hostname) { err.hostname = this.hostname; }
  if (!err.filters) { err.filters = this.filters; }

  err.context = util.merge(this.context, err.context || {});
  err.stackFilter = stackFilter(err.projectRoot);
  if (!err.stackShift) { err.stackShift = 2; }

  var self = this;
  notice(err, function (payload) {
    backend.notice(self, payload, function(err) {
      if (err) {
        self.logger.error('Unable to notify Honeybadger: ' + err);
      }
      callback.apply(this, arguments);
    });
  });

  return this;
}

function stackFilter(projectRoot) {
  return function(f) {
    if (f.file) {
      f.file = f.file.replace(/.*\/node_modules\/(.+)/, '[NODE_MODULES]/$1');
      f.file = f.file.replace(projectRoot, '[PROJECT_ROOT]');
    }
    return f;
  }
}

var singleton = Honeybadger();
singleton.factory = Honeybadger;
module.exports = singleton;
