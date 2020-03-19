var assert = require('assert'),
    sinon = require('sinon'),
    express = require('express'),
    request = require('supertest'),
    nock   = require('nock'),
    Singleton = require('../lib/honeybadger');

describe('Express Middleware', function () {
  let subject, client_mock, client;
  const error = new Error('Badgers!');

  beforeEach(function() {
    client = Singleton.factory({ apiKey: 'fake api key' });
    subject = client.errorHandler;
    client_mock = sinon.mock(client);
  });

  it('is sane', function(done) {
    const app = express();

    app.get('/user', function(req, res) {
      res.status(200).json({ name: 'john' });
    });

    request(app)
      .get('/user')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('reports the error to Honeybadger and calls next error handler', function(done) {
    const app = express();
    const expected = sinon.spy();

    app.use(client.requestHandler);

    app.get('/', function(req, res) {
      throw(error);
    });

    app.use(subject);

    app.use(function(err, req, res, next) {
      expected();
      next();
    });

    client_mock.expects('notify').once().withArgs(error);

    request(app)
      .get('/')
      .expect(500, function() {
        client_mock.verify();
        assert(expected.calledOnce);
        done();
    });
  });

  it('reports async errors to Honeybadger and calls next error handler', function(done) {
    const app = express();
    const expected = sinon.spy();

    app.use(client.requestHandler);

    app.get('/', function(req, res) {
      setTimeout(function asyncThrow() {
        throw(error);
      }, 0);
    });

    app.use(subject);

    app.use(function(err, req, res, next) {
      expected();
      next();
    });

    client_mock.expects('notify').once().withArgs(error);

    request(app)
      .get('/')
      .expect(500, function() {
        client_mock.verify();
        assert(expected.calledOnce);
        done();
      });
  });

  it('provides a noop metricsHandler', function(done) {
    const app = express();
    const expected = sinon.spy();

    app.use(client.metricsHandler);
    app.use(function(req, res, next) {
      expected();
      next();
    });

    request(app)
      .get('/')
      .expect(200, function() {
        assert(expected.calledOnce);
        done();
      });
  });
});

describe('Lambda Handler', function () {
  var Honeybadger = require('../lib/honeybadger').factory({ apiKey: 'fake api key' });

  context('with arguments', function() {
    var handlerFunc;

    beforeEach(function(done) {
      handlerFunc = sinon.spy();
      var handler = Honeybadger.lambdaHandler(handlerFunc);
      handler(1, 2, 3);
      process.nextTick(function() {
        done();
      });
    });

    it('calls original handler with arguments', function() {
      assert(handlerFunc.calledWith(1, 2, 3));
    });
  });

  context('async handlers', function() {
    it('reports errors to Honeybadger', function(done) {
      nock.cleanAll();
      const api = nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .reply(201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}')
      const callback = function(err) {
        api.done();
        done();
      };

      var handler = Honeybadger.lambdaHandler(async function(event) {
        throw new Error("Badgers!");
      });

      handler({}, {}, callback);
    });

    it('reports async errors to Honeybadger', function(done) {
      nock.cleanAll();
      const api = nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .reply(201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}')
      const callback = function(err) {
        api.done();
        done();
      };

      var handler = Honeybadger.lambdaHandler(async function(event) {
        setTimeout(function() {
          throw new Error("Badgers!");
        }, 0);
      });

      handler({}, {}, callback);
    });
  });

  context('non-async handlers', function() {
    it('reports errors to Honeybadger', function(done) {
      nock.cleanAll();
      const api = nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .reply(201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}')
      const callback = function(err) {
        api.done();
        done();
      };

      var handler = Honeybadger.lambdaHandler(function(_event, _context, _callback) {
        throw new Error("Badgers!");
      });

      handler({}, {}, callback);
    });

    it('reports async errors to Honeybadger', function(done) {
      nock.cleanAll();
      const api = nock("https://api.honeybadger.io")
        .post("/v1/notices")
        .reply(201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}')
      const callback = function(err) {
        api.done();
        done();
      };

      var handler = Honeybadger.lambdaHandler(function(_event, _context, _callback) {
        setTimeout(function() {
          throw new Error("Badgers!");
        }, 0);
      });

      handler({}, {}, callback);
    });
  });
});
