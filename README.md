node-honeybadger
================

`node-honeybadger` is a node.js module for sending errors and related metadata to
[honeybadger.io](http://honeybadger.io).

It is small, lightweight, and uses the `stack-trace` module to give honeybadger
the stack trace format it expects, allowing node.js stack traces to show up
properly in the honeybadger UI.

Usage is simple:

```js
var Badger = require('node-honeybadger');

var hb = new Badger({
  apiKey: 'your api key goes here',
  server { hostname: 'steve', otherMetadata: 'goes here' },
  // Any object with info, warn, and error methods can be used as the logger.
  // If nothing is provided, nothing will be logged.
  logger: console
});

var err = new Error('FLAGRANT ERROR!');

err.name = 'FlagrantError'

// The second argument is error tracking metadata, like user/session id
hb.send(err, {
  context: {
    user: 'jane',
    email: 'a@b.net'
  },
  session: {},
  cookies: {},
  params: {}
});

```

`node-honeybadger` is also a Writable Stream.

```js
var payload = hb.makePayload(err, meta);
hb.write(payload);

// Or...

yourPayloadStream.pipe(hb);

```
