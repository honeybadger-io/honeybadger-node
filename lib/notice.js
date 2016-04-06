'use strict';

const stackTrace = require('stack-trace');
const util = require('./util');
const notifier = {
  name: 'honeybadger-node',
  url: 'https://github.com/honeybadger-io/honeybadger-node',
  version: require('../package.json').version
}
const defaultServer = {
  hostname: require('os').hostname(),
  environment: process.env.NODE_ENV,
  project_root: process.cwd()
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

module.exports = makeNotice;
