'use strict';

const defaultLevel = 'info';

function info() {
  if (this.level === 'info') {
    try {
      console.log.apply(console, arguments);
    } catch(_) {}
  }
}

function error() {
  if (this.level) {
    try {
      console.error.apply(console, arguments);
    } catch(_) {}
  }
}

module.exports = function(level) {
  if (!level) { level = defaultLevel; }
  return {
    level,
    info,
    error
  };
};
