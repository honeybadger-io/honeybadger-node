'use strict';

var stackTrace = require('stack-trace');
var util = require('./util');
var notifier = {
  name: 'honeybadger-node',
  url: 'https://github.com/honeybadger-io/honeybadger-node',
  version: require('../package.json').version
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

function makeNotice(err, cb) {
  var stack;
  if (!cb) cb = function(f) { return f; };
  if (!err.stackShift) { err.stackShift = 0; }

  stack = stackTrace.parse(err);
  if (stack.length === 0) {
    stack = stackTrace.parse(new Error());
    for (var i = 0; i < err.stackShift; i++) {
      stack.shift();
    }
  }

  var payload = {
    notifier: notifier,
    error: {
      class: err.name || 'Error',
      message: err.message,
      backtrace: makeBacktrace(stack, err.stackFilter),
      fingerprint: err.fingerprint
    },
    request: {
      context: err.context,
      params: err.params,
      session: err.session,
      component: err.component,
      action: err.action,
      url: err.url
    },
    server: {
      hostname: err.hostname,
      environment_name: err.environment,
      project_root: err.projectRoot,
    }
  };

  if (err.cgiData) {
    payload.request.cgi_data = util.formatCGIData(err.cgiData);
  } else {
    payload.request.cgi_data = {};
  }

  if (err.headers) {
    payload.request.cgi_data = util.merge(payload.request.cgi_data, util.formatCGIData(err.headers, 'HTTP_'));
  }

  util.getStats(function(stats) {
    payload.server.stats = stats;
    return cb(payload);
  });
}

module.exports = makeNotice;
