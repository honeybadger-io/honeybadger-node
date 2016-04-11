'use strict';

var os = require('os');
var fs = require('fs');

function is(type, obj) {
  var klass = Object.prototype.toString.call(obj).slice(8, -1);
  return obj !== undefined && obj !== null && klass === type;
}

function merge(obj1, obj2) {
  var k, obj3 = {};
  for (k in obj1) { obj3[k] = obj1[k]; }
  for (k in obj2) { obj3[k] = obj2[k]; }
  return obj3;
}

function getStats(cb) {
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
}

function formatCGIData(vars, prefix) {
  var formattedVars = {},
    prefix = prefix || '';

  Object.keys(vars).forEach(function(key) {
    var formattedKey = prefix + key.replace(/\W/g, '_').toUpperCase();
    formattedVars[formattedKey] = vars[key];
  });

  return formattedVars;
}

function filterMatch(key, filters) {
  var i;
  for (i = 0; i < filters.length; i++) {
    if (key.indexOf(filters[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function filter(obj, filters) {
  var seen;

  if (!is('Object', obj)) {
    return;
  }

  if (!is('Array', filters)) {
    filters = [];
  }

  seen = [];
  function filter(obj) {
    var k, newObj;

    if (is('Object', obj) || is('Array', obj)) {
      if (seen.indexOf(obj) !== -1) {
        return '[CIRCULAR DATA STRUCTURE]';
      }
      seen.push(obj);
    }

    if (is('Object', obj)) {
      newObj = {};
      for (k in obj) {
        if (filterMatch(k, filters)) {
          newObj[k] = '[FILTERED]';
        } else {
          newObj[k] = filter(obj[k]);
        }
      }
      return newObj;
    }

    if (is('Array', obj)) {
      return obj.map(function(v) { return filter(v); });
    }

    if (is('Function', obj)) { return '[FUNC]'; }

    return obj;
  }

  return filter(obj);
}

module.exports = {
  merge: merge,
  getStats: getStats,
  formatCGIData: formatCGIData,
  filter: filter,
  is: is
};
