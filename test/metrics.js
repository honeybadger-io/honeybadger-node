var assert = require('assert'),
  sinon = require('sinon'),
  nock = require('nock'),
  metricsFactory = require('../lib/metrics'),
  Singleton = require('../lib/honeybadger');

describe('Honeybadger metrics', function () {
  describe('#timing', function () {
    it('sends metrics', function(done) {
      var payloads = [];
      var api = nock("https://api.honeybadger.io")
        .post("/v1/metrics")
        .reply(function(uri, requestBody) {
          payloads.push(requestBody);
          return [201, '{}'];
        });

      var client = Singleton.factory({ apiKey: 'fake api key', environment: 'test environment', hostname: 'test hostname' });
      var metrics = metricsFactory.call(client);

      for (var i = 0; i < 100; i++) {
        metrics.timing('app.request.200', i);
        metrics.counter('foo', i);
      }

      metrics.collect(function() {
        api.done();
        assert.equal(payloads.length, 1);
        assert.equal(payloads[0].hostname, 'test hostname');
        assert.equal(payloads[0].environment_name, 'test environment');
        assert.deepEqual(payloads[0].metrics, [
          'foo 4950',
          'app.request.200:mean 49.5',
          'app.request.200:median 49.5',
          'app.request.200:percentile_90 90',
          'app.request.200:min 0',
          'app.request.200:max 99',
          'app.request.200:stddev 29.011491975882016',
          'app.request.200 100'
        ]);
        done();
      });
    });
  });
});
