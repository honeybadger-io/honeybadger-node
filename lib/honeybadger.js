const EventEmitter = require('events');
const request = require('request');

var factory = function(opts) {
  var event = new EventEmitter();

  function notify() {
    if (!this.apiKey) { return this; }

    var headers = {
      'content-type':'application/json',
      'X-API-Key': this.apiKey,
      'Accept':'application/json'
    };

    var data = {
      error: {
        class: 'TestError',
        message: 'Badgers!',
        backtrace: []
      },
      server: {}
    };

    request.post({
      url: 'https://api.honeybadger.io/v1/notices',
      headers: headers,
      json: data
    }, function (err, res, body) {
      if (err) {
        logError(err);
        // Don't emit unless there's a listener.
        // Otherwise, we'll end up crashing some poor stranger's server.
        if (event.listeners('error').length) { event.emit('error', err); }
        return;
      }
      if (res.statusCode !== 201) {
        logError(body, res.statusCode);
        event.emit('remoteError', body);
        return;
      }
      log('POST to honeybadger successful');
      event.emit('sent', body);
    });

    return this;
  }

  function once() {
    event.once.apply(event, arguments);
    return this;
  }

  function on() {
    event.on.apply(event, arguments);
    return this;
  }

  function log() {
    if (self.logger) {
      self.logger.info.apply(null, arguments);
    }
  }

  function logError() {
    if (self.logger) {
      self.logger.error.apply(null, arguments);
    }
  }

  var self = {
    notify,
    once,
    on,
    logger: console
  };

  return self;
};

var singleton = factory();
singleton.factory = factory;

module.exports = singleton;
