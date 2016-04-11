var assert = require('assert'),
    sinon = require('sinon'),
    middleware = require('../lib/middleware');

describe('Express Middleware', function () {
  var subject, client_mock;

  setup(function () {
    var client = { notify: function(){} };
    client_mock = sinon.mock(client);
    subject = middleware.errorHandler(client);
  });

  it('reports the error to Honeybadger', function () {
    var err = new Error('Badgers!');
    client_mock.expects('notify').once().withArgs(err);
    subject(err, {}, {}, function(){});
    client_mock.verify();
  });

  it('calls next', function () {
    var err = new Error('Badgers!');
    next = sinon.spy();
    subject(err, {}, {}, next);
    assert(next.called);
  });
});
