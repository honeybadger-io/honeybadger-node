var assert = require('assert'),
    sinon  = require('sinon'),
    nock   = require('nock'),
    Singleton = require('../lib/honeybadger'),
    Honeybadger;

describe('Honeybadger', function () {
  var api, payloadCount, payloads = [];

  setup(function () {
    Honeybadger = Singleton.factory({ apiKey: 'foo' });

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

  teardown(function() {
    Singleton.configure({
      apiKey: undefined
    });
  });

  describe('#factory()', function () {
    it('creates a new client instance', function () {
      Singleton.configure({
        apiKey: 'foo'
      });
      var subject = Singleton.factory({ apiKey: 'bar' });
      assert.equal(subject.notify, Singleton.notify);
      assert.equal(Singleton.apiKey, 'foo');
      assert.equal(subject.apiKey, 'bar');
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

    it('throws on invalid config options', function () {
      assert.throws(function(){
        Honeybadger.configure({
          notAValidOption: 'badgers'
        });
      }, /invalid/i);
    });

    it('sets valid config options', function () {
      Honeybadger.configure({
        apiKey: 'badgers',
        environment: 'badger_env',
        endpoint: 'https://www.example.com/',
        projectRoot: 'badger_root',
        hostname: 'badger_host',
        logger: console
      });
      assert.equal('badgers', Honeybadger.apiKey);
      assert.equal('badger_env', Honeybadger.environment);
      assert.equal('https://www.example.com/', Honeybadger.endpoint);
      assert.equal('badger_root', Honeybadger.projectRoot);
      assert.equal('badger_host', Honeybadger.hostname);
      assert.equal(console, Honeybadger.logger);
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
    it('returns wrapped function value', function () {
      var fn = function(result) {
        return result;
      };
      assert.equal(Honeybadger.wrap(fn)('result'), 'result');
    });

    it('reports errors via #notify()', function () {
      sinon.spy(Honeybadger, 'notify');
      assert.throws(Honeybadger.wrap(function() {
        throw(new Error('Badgers!'));
      }), /Badgers!/);
      assert(Honeybadger.notify.called);
    });
  });

  describe('#notify()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.notify(new Error('test error 1')), Honeybadger);
    });

    context('when not configured', function () {
      it('skips notification', function (done) {
        var payloadCount = payloads.length;
        Honeybadger.apiKey = undefined;
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
        Honeybadger.once('sent', function () {
          var p;
          assert.equal(payloads.length, payloadCount + 1);
          p = payloads[payloads.length - 1];
          assert.equal(p.error.message, 'Badgers!');
          assert.strictEqual(p.error.backtrace[0].file, "[PROJECT_ROOT]/test/honeybadger.js")
          done();
        });

        Honeybadger.notify(new Error('Badgers!'));
      });

      context('with a string as first arg', function () {
        it('generates a backtrace', function (done) {
          var payloadCount = payloads.length;
          Honeybadger.once('sent', function () {
            var p;
            assert.equal(payloads.length, payloadCount + 1);
            p = payloads[payloads.length - 1];
            assert.equal(p.error.message, 'Badgers!');
            assert.strictEqual(p.error.backtrace[0].file, '[PROJECT_ROOT]/test/honeybadger.js')
            done();
          });

          Honeybadger.notify('Badgers!');
        });
      });
    });
  });

  suite('Stack trace filters', function () {
    var hb = Singleton.factory({
      apiKey: 'fake api key',
			projectRoot: '/path/to/badgers'
    });
    var makePayload;

    beforeEach(function() {
      payloadCount = payloads.length;
    });

    suite('Node modules', function () {
      test('always substitutes node modules', function (done) {
        var err = new Error('Testing');
        err.stack = "Error: Testing\n" +
          // The double node_modules ensures that the regexp is inclusive.
          "  at Badger (/path/to/badgers/node_modules/foo/node_modules/bar/baz.js:1:0)";
        hb.once('sent', function () {
          var p;
          assert(payloads.length === (payloadCount + 1), 'payload not sent');
          p = payloads[payloads.length - 1];
          assert(p.error.backtrace[0].file === "[NODE_MODULES]/bar/baz.js", 'node modules not substituted: ' + p.error.backtrace[0].file);
          done();
        });
        hb.notify(err);
      });
    });

    suite('Outside project root', function () {
      test('does not substitute outside files', function (done) {
        var err = new Error('Testing');
        hb.once('sent', function () {
          var p;
          assert(payloads.length === (payloadCount + 1), 'payload not sent');
          p = payloads[payloads.length - 1];
          assert(!p.error.backtrace[0].file.match(/^\[PROJECT_ROOT\]/), 'project should not be substituted: ' + p.error.backtrace[0].file);
          done();
        });
        hb.notify(err);
      });
    });

    suite('Inside project root', function () {
      test('substitutes files under project root', function (done) {
        var err = new Error('Testing');
        err.stack = "Error: Testing\n" +
          "  at Badger (/path/to/badgers/test/honeybadger.js:258:13)";
        hb.once('sent', function () {
          var p;
          assert(payloads.length === (payloadCount + 1), 'payload not sent');
          p = payloads[payloads.length - 1];
          assert(p.error.backtrace[0].file.match(/^\[PROJECT_ROOT\]/), 'project root not substituted: ' + p.error.backtrace[0].file);
          done();
        });
        hb.notify(err);
      });
    });
  });
});
