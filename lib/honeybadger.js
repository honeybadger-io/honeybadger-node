'use strict';

const EventEmitter = require('events');
const util = require('util');
const backend = require('./backend');
const debuglog = util.debuglog('honeybadger');

function Honeybadger(opts) {
  var self = Object.create(EventEmitter.prototype);

  EventEmitter.call(self);

  self.logger = console;
  self.notify = notify;

  return self;
}

function notify() {
  if (!this.apiKey) { return this; }

  var data = {
    error: {
      class: 'TestError',
      message: 'Badgers!',
      backtrace: []
    },
    server: {}
  };

  backend.notice(this, data);

  return this;
}

var singleton = Honeybadger();
singleton.factory = Honeybadger;
module.exports = singleton;
