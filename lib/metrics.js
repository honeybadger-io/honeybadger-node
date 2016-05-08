'use strict';

var backend = require('./backend').metrics;
var stats = require('./stats');

function metrics(opts) {
  if (!opts) { var opts = {}; }

  var collector;
  var counters = {};
  var timings = {};

  function collect() {
    var metrics = [];
    var name;

    for (name in counters) {
      metrics.push(name + " " + counts[name]);
    }

    for (name in timings) {
      metrics.push(name + ":mean " + stats.mean(timings[name]));
      metrics.push(name + ":median " + stats.median(timings[name]));
      metrics.push(name + ":percentile_90 " + stats.percentile90(timings[name]));
      metrics.push(name + ":min " + stats.min(timings[name]));
      metrics.push(name + ":max " + stats.max(timings[name]));
      metrics.push(name + ":stddev " + stats.std(timings[name]));
      metrics.push(name + " " + stats.len(timings[name]));
    }

    // Reset collectors.
    counters = {};
    timings = {};

    if (metrics.length < 1) { return; }
    if (this.developmentEnvironments.indexOf(this.environment) !== -1) { return; }

    var payload = {
      metrics: metrics,
      environment_name: this.environment,
      hostname: this.hostname
    };

    backend(this, payload, function(backendErr, res, body) {
      if (!backendErr && res.statusCode !== 201) {
        backendErr = new Error('Bad HTTP response: ' + res.statusCode);
      }

      if (backendErr) {
        this.logger.error('Unable to notify Honeybadger: ' + backendErr);
        return;
      }

      this.logger.info('POST to /v1/metrics successful', body);
    }.bind(this));
  }

  function counter(name, increment) {
    if (!counters[name]) { counters[name] = 0; }
    counters[name] += increment;
  }

  function timing(name, duration) {
    if (!timings[name]) { timings[name] = []; }
    timings[name].push(duration);
  }

  function startCollector(interval) {
    if (collector) { clearInterval(collector); }
    collector = setInterval(collect.bind(this), opts.interval || 60000);
  }

  startCollector.call(this, opts);

  return {
    counter: counter.bind(this),
    timing: timing.bind(this)
  };
}

module.exports = metrics;
