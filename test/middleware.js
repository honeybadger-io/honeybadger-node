var assert = require('assert'),
    sinon = require('sinon'),
    express = require('express'),
    request = require('supertest'),
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

    app.use(function(req, res, next){
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
});
