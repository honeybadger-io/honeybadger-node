var assert = require('assert'),
  stats = require('../lib/stats');

describe('Stats', function () {
  describe('#percentile90', function () {
    it('returns zero for no values', function() {
      assert.equal(stats.percentile90([]),  0.0);
    });

    it('returns first value for a single value', function() {
      assert.equal(stats.percentile90([1]),  1.0);
    });

    it('returns 90th percentile for multiple values', function() {
      var values = [];

      // 0..100
      for (var i = 0; i < 100; i++) {
        values.push(i);
      }

      assert(stats.percentile90(values) == 90, "Expected the 90th percentile of 100 to be 90.");
    });
  });

  describe('#mean', function () {
    it('calculates the mean of the collection', function() {
      var values = [1, 2, 3, 4, 5, 6];

      assert.equal(stats.mean(values), 3.5);
    });
  });

  describe('#median', function () {
    it('calculates the median of the collection', function() {
      var values = [1, 2, 3, 4, 5, 6, 7];

      assert.equal(stats.median(values), 4);
    });
  });

  describe('#std', function () {
    it('returns zero for no values', function() {
      assert.equal(stats.std([]),  0.0);
    });

    it('returns zero for a single value', function() {
      assert.equal(stats.std([101]),  0.0);
    });

    it('calculates the standard deviation of the collection', function() {
      var values = [];

      // 0..100
      for (var i = 0; i < 100; i++) {
        values.push(i);
      }

      assert.equal(stats.std(values), 29.011491975882016);
    });
  });

  describe('#min', function () {
    it('returns the minimum value from the collection', function() {
      var values = [1, 2, 3, 4, 5];

      assert.equal(stats.min(values), 1);
    });
  });

  describe('#max', function () {
    it('returns the maximum value from the collection', function() {
      var values = [1, 2, 3, 4, 5];

      assert.equal(stats.max(values), 5);
    });
  });

  describe('#len', function () {
    it('returns the length of values in the collection', function() {
      var values = [2, 4, 6, 8];

      assert.equal(stats.len(values), 4);
    });
  });
});
