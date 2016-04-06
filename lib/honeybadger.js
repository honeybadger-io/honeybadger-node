const EventEmitter = require('events').EventEmitter;

var factory = function(opts) {
  var events = new EventEmitter();

  function notify() {
    return this;
  }

  var hb = {
    notify
  };

  EventEmitter.call(hb);
  Object.assign(hb, EventEmitter.prototype);

  return hb;
};

var singleton = factory();
singleton.factory = factory;

module.exports = singleton;
