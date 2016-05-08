'use strict';

var math = require('mathjs');

function mean(ary) {
  return math.mean(ary);
}

function median(ary) {
  return math.median(ary);
}

function percentile(ary, threshold) {
  if (len(ary) < 1) {
    return 0.0;
  }

  if (len(ary) == 1) {
    return ary[0];
  }

  ary.sort();

  var index = math.floor((threshold/100.00)*len(ary)) + 1

  return ary[index-1];
}

function percentile90(ary) {
  return percentile(ary, 90);
}

function min(ary) {
  return math.min(ary);
}

function max(ary) {
  return math.max(ary);
}

function std(ary) {
  return math.std(ary);
}

function len(ary) {
  return ary.length;
}

module.exports = {
  mean: mean,
  median: median,
  percentile90: percentile90,
  min: min,
  max: max,
  std: std,
  len: len
};
