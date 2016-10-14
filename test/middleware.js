var assert = require('assert'),
    sinon = require('sinon'),
    express = require('express'),
    request = require('supertest'),
    nock   = require('nock'),
    Singleton = require('../lib/honeybadger');

describe('Express Middleware', function () {
  var subject, client_mock, client;
  var error = new Error('Badgers!');

  setup(function() {
    client = Singleton.factory({ apiKey: 'fake api key' });
    subject = client.errorHandler;

    client_mock = sinon.mock(client);
  });

  it('calls next', function() {
    var app = express();
    var expected = sinon.spy();

    app.use(function(req, res, next) {
      throw(error);
    });
    app.use(subject);
    app.use(function(err, req, res, next) {
      expected();
    });

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      assert(expected.called);
      done();
    });
  });

  it('reports the error to Honeybadger', function(done) {
    var app = express();

    app.use(function(req, res, next) {
      throw(error);
    });
    app.use(subject);

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      client_mock.verify();
      done();
    });
  });

  it('reports async errors to Honeybadger', function(done) {
    var app = express();

    app.use(client.requestHandler);
    app.use(function(req, res, next) {
      setTimeout(function asyncThrow() {
        throw(error);
      }, 0);
    });
    app.use(subject);

    client_mock.expects('notify').once().withArgs(error);

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      client_mock.verify();
      done();
    });
  });

  it('provides a noop metricsHandler', function(done) {
    var app = express();
    var spy = sinon.spy();

    app.use(client.metricsHandler);
    app.use(function(req, res, next) {
      spy();
      next();
    });

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      assert(spy.calledOnce);
      done();
    });
  });
});

describe('Lambda Handler', function () {
  var api;
  var Honeybadger = require('../lib/honeybadger').factory({ apiKey: 'fake api key' });

  setup(function() {
    api = nock("https://api.honeybadger.io")
      .post("/v1/notices")
      .reply(201, '{"id":"1a327bf6-e17a-40c1-ad79-404ea1489c7a"}')
  });

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

  it('reports errors to Honeybadger', function(done) {
    var context = {
      fail: function() {
        done("should never succeed.");
      },
      fail: function(err) {
        api.done();
        done();
      }
    };

    var handler = Honeybadger.lambdaHandler(function(event, context) {
      throw new Error("Badgers!");
    });

    handler({}, context);
  });

  it('reports async errors to Honeybadger', function(done) {
    var context = {
      fail: function() {
        done("should never succeed.");
      },
      fail: function(err) {
        api.done();
        done();
      }
    };

    var handler = Honeybadger.lambdaHandler(function(event, context) {
      setTimeout(function() {
        throw new Error("Badgers!");
      }, 0);
    });

    handler({}, context);
  });
});
