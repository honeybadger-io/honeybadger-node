var assert = require('assert'),
    sinon = require('sinon'),
    logger = require('../lib/logger');

describe('logger', function () {
  var subject;

  setup(function () {
    sinon.spy(console, 'log');
    sinon.spy(console, 'error');
  });

  teardown(function () {
    console.log.restore();
    console.error.restore();
  });

  context('log level is info', function () {
    it('logs info', function () {
      subject = logger('info');
      subject.info('Should be logged');
      assert(console.log.called);
    });

    it('logs error', function () {
      subject = logger('info');
      subject.error('Should be logged');
      assert(console.error.called);
    });
  });

  context('log level is error', function () {
    it('silences info', function () {
      subject = logger('error');
      subject.info('Should NOT be logged');
      assert(!console.log.called);
    });

    it('logs error', function () {
      subject = logger('error');
      subject.error('Should be logged');
      assert(console.error.called);
    });
  });
});
