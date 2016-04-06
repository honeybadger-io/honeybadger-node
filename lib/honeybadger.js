'use strict';

const eventEmitter = require('events');
const stackTrace = require('stack-trace');
const util = require('./util');
const backend = require('./backend');
const logger = require('./logger');
const notifier = {
  name: 'honeybadger-node',
  url: 'https://github.com/honeybadger-io/honeybadger-node',
  version: '0.10.0'
}
const defaultServer = {
  hostname: require('os').hostname(),
  environment: process.env.NODE_ENV,
  project_root: process.cwd()
}

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

function setContext() {
  return this;
}

function resetContext() {
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
	makePayload(err, function (payload) {
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

function makeBacktrace(stack, cb) {
  return stack.map(function (c) {
    return cb({
      number: c.lineNumber,
      file: c.fileName,
      method: c.methodName || c.functionName
    });
  });
}

function makePayload(err, cb) {
  var stack;
  if (!cb) cb = function(f) { return f; };

	stack = stackTrace.parse(err);
  if (stack.length === 0) {
    stack = stackTrace.parse(new Error());
    stack.shift();
    stack.shift();
  }

  var payload = {
    notifier,
    error: {
      class: err.name || 'Error',
      message: err.message,
      backtrace: makeBacktrace(stack, err.stackFilter)
    },
    request: {
      context: err.context,
      params: err.params,
      session: err.session
    },
    server: {
      hostname: err.hostname || defaultServer.hostname,
      environment_name: err.environment || defaultServer.environment,
      project_root: err.project_root || defaultServer.project_root
    }
  };

  if (err.cgiData) {
    payload.request.cgi_data = util.formatCGIData(err.cgiData);
  } else {
    payload.request.cgi_data = {};
  }

  if (err.headers) {
    util.merge(payload.require.cgi_data, util.formatCGIData(err.headers, 'HTTP_'));
  }

  util.getStats(function(stats) {
    payload.server.stats = stats;
    return cb(payload);
  });
}

var singleton = Honeybadger();
singleton.factory = Honeybadger;
module.exports = singleton;
