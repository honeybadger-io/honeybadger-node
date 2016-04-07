var assert = require('assert'),
    sinon = require('sinon'),
    util = require('../lib/util');

describe('util', function () {
  describe('.filter()', function () {
    it('filters top level keys', function () {
      var obj = { foo: 'foo', bar: 'bar' };
      var subject = util.filter(obj, ['foo']);
      assert.deepEqual(subject, { foo: '[FILTERED]', bar: 'bar' });
    });

    it('filters keys of objects in arrays', function () {
      var obj = { top: 'top', nested: [{ foo: 'foo', bar: 'bar' }] };
      var subject = util.filter(obj, ['foo']);
      assert.deepEqual(subject, { top: 'top', nested: [{ foo: '[FILTERED]', bar: 'bar' }] });
    });

    it('filters partial keys', function () {
      var obj = { foo: 'foo', bar_baz: 'baz' };
      var subject = util.filter(obj, ['baz']);
      assert.deepEqual(subject, { foo: 'foo', bar_baz: '[FILTERED]' });
    });

    it('filters functions', function () {
      var obj = { foo: function(){}, bar: 'bar' };
      var subject = util.filter(obj);
      assert.deepEqual(subject, { foo: '[FUNC]', bar: 'bar' });
    });

    it('filters circular objects', function () {
      var obj = { foo: 'foo' };
      obj.bar = obj;
      var subject = util.filter(obj);
      assert.deepEqual(subject, { foo: 'foo', bar: '[CIRCULAR DATA STRUCTURE]' });
    });

    it('filters circular arrays', function () {
      var bar = [];
      bar.push(bar);
      var obj = { foo: 'foo', bar: bar };
      var subject = util.filter(obj);
      assert.deepEqual(subject, { foo: 'foo', bar: ['[CIRCULAR DATA STRUCTURE]'] });
    });
  });
});
