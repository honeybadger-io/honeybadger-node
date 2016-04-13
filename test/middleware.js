var assert = require('assert'),
    sinon = require('sinon'),
    express = require('express'),
    request = require('supertest'),
    nock   = require('nock'),
    middleware = require('../lib/middleware');

describe('Express Middleware', function () {
  var subject, client_mock;

  setup(function () {
    var client = { notify: function(){} };
    client_mock = sinon.mock(client);
    subject = middleware.errorHandler(client);
  });

  it('calls next', function() {
    var err = new Error('Badgers!');
    next = sinon.spy();

    subject(err, {}, {}, next);

    assert(next.called);
  });

  it('reports the error to Honeybadger', function(done) {
    var err = new Error('Badgers!');
    var app = express();

    app.use(function(req, res, next) {
      throw(err);
    });
    app.use(subject);

    client_mock.expects('notify').once().withArgs(err);

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      client_mock.verify();
      done();
    });
  });

  it('reports async errors to Honeybadger', function(done) {
    var err = new Error('Badgers!');
    var app = express();

    app.use(middleware.requestHandler({}));
    app.use(function(req, res, next) {
      setTimeout(function asyncThrow() {
        throw(err);
      }, 0);
    });
    app.use(subject);

    client_mock.expects('notify').once().withArgs(err);

    request(app.listen())
    .get('/')
    .end(function(err, res){
      if (err) return done(err);
      client_mock.verify();
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
