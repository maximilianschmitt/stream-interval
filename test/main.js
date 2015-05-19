'use strict';

var expect = require('chai').expect;
var Readable = require('readable-stream').Readable;
var streamInterval = require('../main');

describe('streamInterval', function() {
  it('exposes a function', function() {
    expect(streamInterval).to.be.a('function');
  });

  it('stops when told to stop', function(done) {
    var i = 0;
    var si = threeHellos();

    si.on('data', function() {
      i++;
    });

    si.on('end', function() {
      expect(i).to.equal(3);
      done();
    });
  });

  it('pipes through everything', function(done) {
    var all = '';
    var si = threeHellos();

    si.on('data', function(data) {
      all += data;
    });

    si.on('end', function() {
      expect(all).to.equal('hellohellohello');
      done();
    });
  });

  it('works with streams in object mode', function(done) {
    var all = [];
    var si = threeObjects();

    si.on('data', function(data) {
      all.push(data);
    });

    si.on('end', function() {
      expect(all).to.deep.equal([{ hello: 'world' }, { hello: 'world' }, { hello: 'world' }]);
      done();
    });
  });

  it('calls the stream factory at most every x milliseconds', function(done) {
    var all = '';
    var si = streamInterval(function() {
      return new Readable({
        read: function() {
          this.push('hello');
          this.push(null);
        }
      });
    }, 100);

    si.on('data', function(data) {
      all += data;
    });

    setTimeout(function() {
      expect(all).to.equal('hellohellohellohellohello');
      si.stop();
      done();
    }, 550);
  });

  it('calls the next function only if the current stream has ended', function(done) {
    var all = '';
    var calls = 0;
    var si = streamInterval(function() {
      calls++;

      var s = new Readable({
        read: function(){}
      });

      setTimeout(function() {
        s.push('hello');
        s.push(null);
      }, 100);

      return s;
    });

    si.on('data', function(data) {
      all += data;
    });

    setTimeout(function() {
      expect(calls).to.equal(4);
      expect(all).to.equal('hellohellohello');
      si.stop();
      done();
    }, 350);
  });
});

function threeObjects() {
  var i = 0;
  var si = streamInterval({ objectMode: true }, function() {
    var s = new Readable({
      objectMode: true,
      read: function() {
        this.push({ hello: 'world' });
        this.push(null);
      }
    });
    if (++i > 3) si.stop();
    return s;
  });
  return si;
}

function threeHellos() {
  var i = 0;
  var si = streamInterval(function() {
    var s = new Readable({
      read: function() {
        this.push('hello');
        this.push(null);
      }
    });
    if (++i > 3) si.stop();
    return s;
  });
  return si;
}
