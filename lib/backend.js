'use strict';

var request = require('request');

function callback(cb, err, res, body) {
  if (typeof cb === 'function') {
    cb(err, res, body);
  }
}

function backend(path) {
  return function(client, data, cb) {
    if (!client.apiKey) {
      callback(cb, new Error('API key is missing or invalid.'));
      return;
    }

    var headers = {
      'content-type':'application/json',
      'X-API-Key': client.apiKey,
      'Accept':'application/json'
    };

    request.post({
      url: client.endpoint + path,
      headers: headers,
      json: data
    }, function (err, res, body) {
      if (err) {
        client.logger.error(err);
        // Don't emit unless there's a listener.
        // Otherwise, we'll end up crashing some poor stranger's server.
        if (client.listeners('error').length) { client.emit('error', err); }
        callback(cb, err, res, body);
        return;
      }
      if (res.statusCode !== 201) {
        client.logger.error(body, res.statusCode);
        client.emit('remoteError', body);
        callback(cb, new Error('Bad HTTP response from ' + path), res, body);
        return;
      }
      client.logger.info('POST to honeybadger successful', body);
      client.emit('sent', body);
      callback(cb, null, res, body);
    });
  }
}

module.exports = {
  notice: backend('/v1/notices')
}
