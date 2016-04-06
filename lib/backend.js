'use strict';

const request = require('request');

function cb(callback, err, res, body) {
  if (typeof callback === 'function') {
    callback(err, res, body);
  }
}

function backend(endpoint) {
  return function(client, data, callback) {
    if (!client.apiKey) {
      cb(callback, new Error('API key is missing or invalid.'));
      return;
    }

    var headers = {
      'content-type':'application/json',
      'X-API-Key': client.apiKey,
      'Accept':'application/json'
    };

    request.post({
      url: 'https://api.honeybadger.io' + endpoint,
      headers: headers,
      json: data
    }, function (err, res, body) {
      if (err) {
        client.logger.error(err);
        // Don't emit unless there's a listener.
        // Otherwise, we'll end up crashing some poor stranger's server.
        if (client.listeners('error').length) { self.emit('error', err); }
        cb(callback, err, res, body);
        return;
      }
      if (res.statusCode !== 201) {
        client.logger.error(body, res.statusCode);
        client.emit('remoteError', body);
        cb(callback, new Error('Bad HTTP response from ' + endpoint), res, body);
        return;
      }
      client.logger.info('POST to honeybadger successful', body);
      client.emit('sent', body);
      cb(callback, null, res, body);
    });
  }
}

module.exports = {
  notice: backend('/v1/notices')
}
