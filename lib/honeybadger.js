

var stackTrace = require('stack-trace'),
    request = require('request'),
    Writable = require('stream').Writable,
    util = require('util'),
    os = require('os');

var notifier = {
  name: 'node-honeybadger',
  url: 'https://github.com/AvianFlu/node-honeybadger',
  version: '1.3.0'
};

var Badger = function (opts) {
  Writable.call(this, { objectMode: true });

  this._apiKey = opts.apiKey;
  this._server = opts.server;
  this._logger = opts.logger || null;
};
util.inherits(Badger, Writable);

Badger.prototype._write = function (data) {
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
    if (self._logger) {
      if (err) return self._logger.error(err);
      if (res.statusCode !== 201) {
        return self._logger.error(body, res.statusCode);
      }
      self._logger.info('POST to honeybadger successful');
    }
  });
};

Badger.prototype._wrapError = function (err) {
  var trace = stackTrace.parse(err),
      output = {};

  output.backtrace = trace.map(function (c) {
    return {
      number: c.lineNumber,
      file: c.fileName,
      method: c.methodName || c.functionName
    };
  });

  output.message = err.message || err.code || 'Error!';
  output.class = err.name || 'Error';
  return output;
};

Badger.prototype.send = function (err, meta) {
  if (!this._apiKey) return;
  var payload = this.makePayload(err, meta);
  this.write(payload);
};

Badger.prototype.makePayload = function (err, meta) {
  if (!meta) meta = {};
  if (!meta.cgi_data) meta.cgi_data = process.env;

  var server = this._server;

  if (!server.hostname) server.hostname = os.hostname();
  if (!server.environment_name) server.environment_name = process.env.NODE_ENV;
  server.project_root = process.cwd();
  server.stats = {};
  server.stats.mem = os.freemem();
  server.stats.load = os.loadavg();

  var payload = {
    notifier: notifier,
    error: this._wrapError(err),
    request: meta,
    server: server
  };

  return payload;
};

module.exports = Badger;
