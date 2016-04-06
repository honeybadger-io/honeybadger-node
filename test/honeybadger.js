var assert = require('assert'),
    sinon  = require('sinon'),
    nock   = require('nock'),
    Singleton = require('../lib/honeybadger'),
    Honeybadger;

describe('Honeybadger', function () {
  var api, payloadCount, payloads = [];

  setup(function () {
    Honeybadger = Singleton.factory();

    payloadCount = 0;
    payloads = [];

    // Don't send actual requests to honeybadger.io from the test suite
    nock.cleanAll();
    var api = nock("https://api.honeybadger.io")
      .post("/v1/notices")
      .reply(function(uri, requestBody) {
        payloads.push(requestBody);
        return [201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}'];
      });
  });

  describe('#once()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.once('sent', function() {}), Honeybadger);
    });
  });

  describe('#on()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.on('sent', function() {}), Honeybadger);
    });
  });

  describe('#configure()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.configure({}), Honeybadger);
    });
  });

  describe('#setContext()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.setContext({}), Honeybadger);
    });
  });

  describe('#resetContext()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.resetContext({}), Honeybadger);
    });
  });

  describe('#wrap()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.wrap(function(){}), Honeybadger);
    });
  });

  describe('#notify()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.notify(new Error('test error 1')), Honeybadger);
    });

    context('when not configured', function () {
      it('skips notification', function (done) {
        var payloadCount = payloads.length;
        Honeybadger.once('sent', function () {
          throw new Error('This event should not fire!');
        });
        Honeybadger.notify(new Error('test error 1'));
        setTimeout(function () {
          assert.equal(payloads.length, payloadCount);
          done();
        }, 10);
      });
    });

    context('when configured', function () {
      it('sends notification', function (done) {
        var payloadCount = payloads.length;
        Honeybadger.apiKey = 'foo';

        Honeybadger.once('sent', function () {
          var p;
          assert.equal(payloads.length, payloadCount + 1);
          p = payloads[payloads.length - 1];
          assert.equal(p.error.message, 'Badgers!');
          assert.strictEqual(p.error.backtrace[0].file, __filename)
          done();
        });

        Honeybadger.notify(new Error('Badgers!'));
      });

      context('with a string as first arg', function () {
        it('generates a backtrace', function (done) {
          var payloadCount = payloads.length;
          Honeybadger.apiKey = 'foo';

          Honeybadger.once('sent', function () {
            var p;
            assert.equal(payloads.length, payloadCount + 1);
            p = payloads[payloads.length - 1];
            assert.equal(p.error.message, 'Badgers!');
            assert.strictEqual(p.error.backtrace[0].file, __filename)
            done();
          });

          Honeybadger.notify('Badgers!');
        });
      });
    });
  });
});
