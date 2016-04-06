'use strict';

const eventEmitter = require('events');
const util = require('./util');
const backend = require('./backend');
const logger = require('./logger');
const notice = require('./notice');

function Honeybadger(opts) {
  var self = Object.create(eventEmitter.prototype);

  eventEmitter.call(self);

  self.apiKey = process.env.HONEYBADGER_API_KEY;
  self.logger = logger('error');
  self.context = {};

  self.configure = configure;
  self.setContext = setContext;
  self.resetContext = resetContext;
  self.wrap = wrap;
  self.notify = notify;

  self.configure(opts);

  return self;
}

function configure() {
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

function wrap() {
  return this;
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

  err.stackFilter = stackFilter(this);
  err.context = util.merge(this.context, err.context || {});

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
