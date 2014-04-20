

var assert = require('assert'),
    Badger = require('../lib/honeybadger');

suite('node.js honeybadger.io notifier', function () {
  var hb1, hb2, payloads = [], payloadCount = 0;

  setup(function () {
    // Don't send actual requests to honeybadger.io from the test suite
    Badger.prototype._post = function (data) { payloads.push(data); };
  });

  suite('Creating a Badger without an API key', function () {
    var hb = new Badger({
      apiKey: null,
      server: { testmeta: 'data' }
    });

    setup(function (done) {
      payloadCount = payloads.length;
      hb.send(new Error('test error 1'));
      setImmediate(done);
    });

    test('makes it a no-op when used', function () {
      assert(payloads.length === payloadCount, 'Payload was sent without API key');
    });
  });

  suite('Creating a Badger with server metadata', function () {
    var hb = new Badger({
      // Because we've mocked the POST, the API key here only needs to be
      // non-falsy.
      apiKey: 'fake api key',
      server: {
        name: 'honeybadge',
        role: 'testing'
      },
    });

    setup(function (done) {
      payloadCount = payloads.length;
      hb.send(new Error('test error 2'));
      setImmediate(done);
    });

    test('successfully sends the payload', function () {
      var p;
      assert(payloads.length === (payloadCount + 1), 'payload not sent');
      p = payloads[payloads.length - 1];
      assert(p.error.message = 'test error 2', 'payload incorrect');
    });

    test('the server metadata is added to the payload', function () {
      var s = payloads[payloads.length - 1];
      assert(s.server.name === 'honeybadge', 'Server name not set.');
      assert(s.server.role === 'testing', 'Server role not set.');
    });
  });

  suite('Creating a Badger with a custom notifier', function () {
    var hb = new Badger({
      apiKey: 'fake api key',
      server: { name: 'honeybadger' },
      notifier: {
        name: 'honeybadger test suite',
        url: 'https://notarealsite.net/page14.php',
        version: '0.4.18'
      }
    });

    setup(function (done) {
      payloadCount = payloads.length;
      hb.send(new Error('test error 3'));
      setImmediate(done);
    });

    test('successfully sends the payload', function () {
      var p;
      assert(payloads.length === (payloadCount + 1), 'payload not sent');
      p = payloads[payloads.length - 1];
      assert(p.error.message === 'test error 3', 'payload incorrect');
    });
    
    test('correctly sets the notifier field in the payload', function () {
      var n;
      n = payloads[payloads.length - 1].notifier;
      assert(n.name === 'honeybadger test suite', 'name not set');
      assert(n.url === 'https://notarealsite.net/page14.php', 'url not set');
      assert(n.version === '0.4.18', 'version not set');
    });
  });

  suite('Passing contextual metadata with an error', function () {
    var hb = new Badger({ apiKey: 'fake api key' });

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

    setup(function (done) {
      payloadCount = payloads.length;
      hb.send(new Error('test error 4'), meta);
      setImmediate(done);
    });

    test('successfully sends the payload', function () {
      var p;
      assert(payloads.length === (payloadCount + 1), 'payload not sent');
      p = payloads[payloads.length - 1];
      assert(p.error.message === 'test error 4', 'payload incorrect');
    });

    test('The contextual metadata is passed correctly', function () {
      var p = payloads[payloads.length - 1];
      assert.deepEqual(p.request, meta, 'Metadata incorrect');
    });
  });
});
