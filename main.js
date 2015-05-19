'use strict';

var Readable = require('readable-stream').Readable;

var streamInterval = function(opts, fn, interval) {
  if (typeof opts === 'function') {
    interval = fn;
    fn = opts;
  }

  var outStream = new Readable(opts);
  outStream.stop = function() {
    this.stopped = true;
    this.push(null);
  };
  outStream._read = function(){};
  scheduleInterval(Date.now());
  
  return outStream;

  function buildStream() {
    var now = Date.now();
    var inStream = fn();

    inStream.on('data', function listen(data) { 
      if (outStream.stopped) {
        inStream.removeListener('data', listen);
        return;
      }

      outStream.push(data);
    });

    inStream.once('end', function onEnd() {
      if (outStream.stopped) {
        return;
      }

      scheduleInterval(now);
    });    

  }

  function scheduleInterval(then) {
    if (outStream.stopWhenPossible) {
      outStream.end();
      return;
    }

    var now = Date.now();
    var scheduled = interval - (now - then);
    setTimeout(buildStream, scheduled > 0 ? scheduled : 0);
  }
};

module.exports = streamInterval;
