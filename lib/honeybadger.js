

var stackTrace = require('stack-trace'),
    request = require('request'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    os = require('os'),
    fs = require('fs');

var defaultServer = {
  hostname: os.hostname(),
  environment_name: process.env.NODE_ENV,
  project_root: process.cwd()
};

var defaultNotifier = {
  name: 'honeybadger-node',
  url: 'https://github.com/honeybadger-io/honeybadger-node',
  version: '1.3.0'
};

var defaultDevEnvs = [];

var configureServer = function(opts) {
  var server = opts || {};

  server.hostname = server.hostname || defaultServer.hostname;
  server.environment_name = server.environment_name || defaultServer.environment_name;
  server.project_root = server.project_root || defaultServer.project_root;

  return server;
};

var Badger = function (opts) {
  EventEmitter.call(this);
  this._apiKey = opts.apiKey;
  this._server = configureServer(opts.server);
  this._notifier = opts.notifier || defaultNotifier;
  this._logger = opts.logger || null;
  this._developmentEnvironments = opts.developmentEnvironments || defaultDevEnvs;
};
util.inherits(Badger, EventEmitter);

Badger.prototype._log = function () {
  if (this._logger) {
    this._logger.info.apply(this, arguments);
  }
}

Badger.prototype._logError = function () {
  if (this._logger) {
    this._logger.error.apply(this, arguments);
  }
}

Badger.prototype._post = function (data) {
  if (!this._apiKey) return;

  var headers = {
        'content-type':'application/json',
        'X-API-Key': this._apiKey,
        'Accept':'application/json'
      },
      self = this;

  request.post({
    url:'https://api.honeybadger.io/v1/notices',
    headers: headers,
    json: data
  }, function (err, res, body) {
    if (err) {
      self._logError(err);
      // Don't emit unless there's a listener.
      // Otherwise, we'll end up crashing some poor stranger's server.
      if (self.listeners('error').length) self.emit('error', err);
      return;
    }
    if (res.statusCode !== 201) {
      self._logError(body, res.statusCode);
      self.emit('remoteError', body);
      return;
    }
    self._log('POST to honeybadger successful');
    self.emit('sent', body);
  });
};

Badger.prototype._wrapError = function (err, cb) {
  var trace = stackTrace.parse(err),
      output = {};
  if (!cb) cb = function(f) { return f; };

  output.backtrace = trace.map(function (c) {
    return cb({
      number: c.lineNumber,
      file: c.fileName,
      method: c.methodName || c.functionName
    });
  });

  output.message = err.message || err.code || 'Error!';
  output.class = err.name || 'Error';
  return output;
};

// Creates a new hash with keys formatted according to the RFC 3875
Badger.prototype._formatCGIData = function (vars, prefix) {
  var formattedVars = {},
      prefix = prefix || '';

  Object.keys(vars).forEach(function(key) {
    var formattedKey = prefix + key.replace(/\W/g, '_').toUpperCase();
    formattedVars[formattedKey] = vars[key];
  });

  return formattedVars;
};

Badger.prototype._isDev = function() {
  if (!this._developmentEnvironments) return false;
  var devEnvs = Array.prototype.concat(this._developmentEnvironments);

  return devEnvs.indexOf(this._server.environment_name) !== -1;
};

Badger.prototype.send = function (err, meta) {
  if (!this._apiKey || this._isDev()) return;
  var self = this;

  this.makePayload(err, meta, function (payload) {
    self._post(payload);
  });
};

Badger.prototype.makePayload = function (err, meta, cb) {
  if (!meta) meta = {};

  if (meta.cgi_data) {
    meta.cgi_data = this._formatCGIData(meta.cgi_data);
  } else {
    meta.cgi_data = {};
  }

  if (meta.headers) {
    util._extend(meta.cgi_data, this._formatCGIData(meta.headers, 'HTTP_'));
    delete meta.headers;
  }

  var backtraceFilter = function(f) {
    if (f.file) {
      f.file = f.file.replace(/.*\/node_modules\/(.+)/, '[NODE_MODULES]/$1');
      f.file = f.file.replace(this._server.project_root, '[PROJECT_ROOT]');
    }
    return f;
  }.bind(this);

  var payload = {
    notifier: this._notifier,
    error: this._wrapError(err, backtraceFilter),
    request: meta,
    server: this._server
  };

  this._getStats(function (stats) {
    payload.server.stats = stats;
    return cb(payload);
  });

};

Badger.prototype._getStats = function (cb) {
  var load = os.loadavg(),
      stats = {
        load: {
          one: load[0],
          five: load[1],
          fifteen: load[2]
        }
      };

  if (fs.existsSync('/proc/meminfo')) {
    return fs.readFile('/proc/meminfo', 'utf8', parseStats);
  }
  fallback();

  function parseStats(err, memData) {
    if (err) return fallback();

    // The first four lines, in order, are Total, Free, Buffers, Cached.
    // @TODO: Figure out if there's a way to only read these lines
    var data = memData.split('\n').slice(0,4),
        results;

    results = data.map(function (i) {
      return parseInt(/\s+(\d+)\skB/i.exec(i)[1], 10) / 1024.0;
    });

    stats.mem = {
      total: results[0],
      free: results[1],
      buffers: results[2],
      cached: results[3],
      free_total: results[1] + results[2] + results[3]
    };
    return cb(stats);
  }

  function fallback() {
    stats.mem = {
      free: os.freemem(),
      total: os.totalmem()
    };
    return cb(stats);
  }
};

module.exports = Badger;
