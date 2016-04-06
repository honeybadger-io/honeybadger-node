'use strict';

const EventEmitter = require('events');
const util = require('util');
const backend = require('./backend');
const logger = require('./logger');

function Honeybadger(opts) {
  var self = Object.create(EventEmitter.prototype);

  EventEmitter.call(self);

  self.logger = logger('error');

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
