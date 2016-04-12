'use strict';

var request = require('request');
var util = require('./util');

function backend(path) {
  return function(client, payload, callback) {
    if (!util.is('Function', callback)) {
      callback = function defaultCallback(err, res, body){};
    }

    if (!client.apiKey) {
      callback(new Error('API key is missing or invalid.'));
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
      json: payload
    }, callback);
  }
}

module.exports = {
  notice: backend('/v1/notices')
}
