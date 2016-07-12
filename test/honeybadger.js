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

  describe('#timing()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.timing('app.request.200', 1.0), Honeybadger);
    });
  });

  describe('#increment()', function () {
    it('is chainable', function () {
      assert.equal(Honeybadger.increment('foo', 1), Honeybadger);
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
    it('is chainable', function (done) {
      var returnValue = Honeybadger.notify(new Error('test error 1'), function() {
        done();
      });
      assert.equal(returnValue, Honeybadger);
    });

    context('when not configured', function () {
      beforeEach(function (done) {
        Honeybadger.apiKey = undefined;
        payloadCount = payloads.length;
        Honeybadger.notify(new Error('test error that should not be sent'), function(err, notice) {
          done();
        });
      });

      it('skips notification', function () {
        assert.equal(payloads.length, payloadCount);
      });
    });

    context('when configured', function () {
      beforeEach(function (done) {
        payloadCount = payloads.length;
        Honeybadger.notify(new Error('test error that should be sent'), function(err, notice) {
          done();
        });
      });

      it('sends notification', function () {
        var p;
        assert.equal(payloads.length, payloadCount + 1);
        p = payloads[payloads.length - 1];
        assert.equal(p.error.message, 'test error that should be sent');
        assert.strictEqual(p.error.backtrace[0].file, "[PROJECT_ROOT]/test/honeybadger.js")
      });
    });

    context('when in a development environment', function () {
      beforeEach(function (done) {
        payloadCount = payloads.length;
        Honeybadger.environment = 'development';
        Honeybadger.notify(new Error('test error that should not be sent'), function(err, notice) {
          done();
        });
      });

      it('skips notification', function () {
        assert.equal(payloads.length, payloadCount);
      });
    });

    context('without a stack trace', function () {
      beforeEach(function (done) {
        payloadCount = payloads.length;
        Honeybadger.notify('test error (string) with no stack trace', function(err, notice) {
          done();
        });
      });

      it('generates a stack trace', function () {
        assert.equal(payloads.length, payloadCount + 1);
        var p = payloads[payloads.length - 1];
        assert(p.error.message.match(/no stack trace/));
        assert.strictEqual(p.error.backtrace[0].file, '[PROJECT_ROOT]/test/honeybadger.js')
      });
    });
  });

  // The following suites test other areas of the lib through
  // `Honeybadger.notify` and could be better integrated in the future (they
  // are from an earlier version).

  suite('backend logging', function () {
    test('logs info on success', function (done) {
      var spy = sinon.spy(),
          hb = Singleton.factory({
            apiKey: 'faked',
            logger: {info: spy}
          });

      hb.notify(new Error('test error'), function() {
        sinon.assert.calledOnce(spy);
        done();
      });
    });

    test('logs error on remote failure', function (done) {
      var spy = sinon.spy(),
          hb = Singleton.factory({
            apiKey: 'faked',
            logger: {error: spy}
          });

      nock.cleanAll();
      nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .reply([403, '']);

      hb.notify(new Error('test error'), function() {
        sinon.assert.calledOnce(spy);
        done();
      });
    });

    test('logs error on exception', function (done) {
      var spy = sinon.spy(),
          hb = Singleton.factory({
            apiKey: 'faked',
            logger: {error: spy}
          });

      nock.cleanAll();
      nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .replyWithError("boom");

      hb.notify(new Error('test error'), function () {
        sinon.assert.calledOnce(spy);
        done();
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


 suite('Passing contextual metadata with an error', function () {
    var hb = new Singleton.factory({ apiKey: 'fake api key' });

    var meta = {
      context: {
        uid: '0xdeadbeef',
        email: 'test@testing.biz'
      },
      session: {
        id: '1234567890',
        data: {a: 1, b: 2, c: 3}
      },
      params: {
        arg1: 'hello'
      },
      cookies: {
        omnom: 'nom'
      }
    };

    test('successfully sends the payload', function (done) {
      payloadCount = payloads.length;
      hb.once('sent', function () {
        var p;
        assert(payloads.length === (payloadCount + 1), 'payload not sent');
        p = payloads[payloads.length - 1];
        assert(p.error.message === 'test error 4', 'payload incorrect');
        done();
      });
      hb.notify(new Error('test error 4'), meta);
    });

    test('The contextual metadata is passed correctly', function () {
      hb.once('sent', function () {
        var p = payloads[payloads.length - 1];
        assert.deepEqual(p.request, meta, 'Metadata incorrect');
        done();
      });
    });
  });

  suite('Creating a notice with cgi_data meta', function () {
    var hb = Singleton.factory({
      apiKey: 'fake api key'
    });

    var sampleCGIData = {
      'server-software': 'Whatever server',
      'custom': 'custom fields with custom DATA, !#&*'
    };

    test('successfully sends the payload', function (done) {
      payloadCount = payloads.length;
      hb.once('sent', function () {
        var p;
        assert(payloads.length === (payloadCount + 1), 'payload not sent');
        p = payloads[payloads.length - 1];
        assert(p.error.message === 'test error 5', 'payload incorrect');
        done();
      });
      hb.notify(new Error('test error 5'), { cgi_data: sampleCGIData });
    });

    test('transforms data keys according to the RFC 3875', function () {
      hb.once('sent', function () {
        var n;
        n = payloads[payloads.length - 1].request.cgi_data;
        assert(n['SERVER_SOFTWARE'] === sampleCGIData['server-software'], 'server-software not set');
        assert(n['CUSTOM'] === sampleCGIData['custom'], 'custom not set');
        assert(('custom' in n) === false, 'untransformed keys present in payload');
      });
    });
  });

  suite('Creating a notice with headers meta', function () {
    var hb = Singleton.factory({
      apiKey: 'fake api key'
    });

    var sampleHeaders = {
      'x-forwarded-for': '1.2.3.4',
      'user-agent': 'Mozilla 5.0',
      'cookie': 'a=b'
    };

    test('successfully sends the payload', function (done) {
      payloadCount = payloads.length;
      hb.once('sent', function () {
        var p;
        assert(payloads.length === (payloadCount + 1), 'payload not sent');
        p = payloads[payloads.length - 1];
        assert(p.error.message === 'test error 6', 'payload incorrect');
        done();
      });
      hb.notify(new Error('test error 6'), { headers: sampleHeaders });
    });

    test('correctly sets the headers field in the payload', function () {
      hb.once('sent', function () {
        var n;
        n = payloads[payloads.length - 1].request;
        assert(n.cgi_data['HTTP_X_FORWARDED_FOR'] === sampleHeaders['x-forwarded-for'], 'x-forwarded-for not set');
        assert(n.cgi_data['HTTP_USER_AGENT'] === sampleHeaders['user-agent'], 'user-agent not set');
        assert(n.cgi_data['HTTP_COOKIE'] === sampleHeaders['cookie'], 'cookie not set');
        assert(('headers' in n) === false, 'headers field is not removed from the payload');
        done();
      });
    });
  });

  suite('Creating a notice with both cgi_data and headers meta', function () {
    var hb = Singleton.factory({
      apiKey: 'fake api key'
    });

    var sampleCGIData = {
      'server-software': 'Whatever server',
      'custom': 'custom fields with custom DATA, !#&*'
    };

    var sampleHeaders = {
      'user-agent': 'Mozilla 5.0',
      'cookie': 'a=b'
    };

    test('successfully sends the payload', function (done) {
      payloadCount = payloads.length;
      hb.once('sent', function () {
        var p;
        assert(payloads.length === (payloadCount + 1), 'payload not sent');
        p = payloads[payloads.length - 1];
        assert(p.error.message === 'test error 6', 'payload incorrect');
        done();
      });
      hb.notify(new Error('test error 6'), {
        headers: sampleHeaders,
        cgi_data: sampleCGIData
      });
    });

    test('resultig payload has combined data from headers and cgi_data', function () {
      hb.once('sent', function () {
        var n;
        n = payloads[payloads.length - 1].request;
        assert(n.cgi_data['SERVER_SOFTWARE'] === sampleCGIData['server-software'], 'server-software not set');
        assert(n.cgi_data['CUSTOM'] === sampleCGIData['custom'], 'custom  not set');
        assert(n.cgi_data['HTTP_USER_AGENT'] === sampleHeaders['user-agent'], 'user-agent not set');
        assert(n.cgi_data['HTTP_COOKIE'] === sampleHeaders['cookie'], 'cookie not set');
        assert(('custom' in n) === false, 'untransformed keys from cgi_data present in payload');
        assert(('user-agent' in n) === false, 'untransformed keys from headers present in payload');
        assert(('headers' in n) === false, 'headers field is not removed from the payload');
        done();
      });
    });
  });
});
