var assert = require('assert'),
  stats = require('../lib/stats');

describe('Stats', function () {
  describe('#percentile90', function () {
    it('calls next', function() {
      var values = [];

      // 0..100
      for (var i = 0; i < 100; i++) {
        values.push(i);
      }

      assert(stats.percentile90(values) == 90, "Expected the 90th percentile of 100 to be 90.");
    });
  });
});
