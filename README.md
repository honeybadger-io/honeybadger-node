honeybadger-node
================

[![Build Status](https://travis-ci.org/honeybadger-io/honeybadger-node.svg?branch=master)](https://travis-ci.org/honeybadger-io/honeybadger-node)

`honeybadger-node` is a node.js module for sending errors and related metadata to
[honeybadger.io](http://honeybadger.io).

It is small, lightweight, and uses the `stack-trace` module to give honeybadger
the stack trace format it expects, allowing node.js stack traces to show up
properly in the honeybadger UI.

Usage is simple:

```js
var Badger = require('honeybadger');

var hb = new Badger({
  apiKey: 'your api key goes here',
  server: { hostname: 'steve' },
  // Any object with info, warn, and error methods can be used as the logger.
  // If nothing is provided, nothing will be logged.
  logger: console,
  // Environments which will not report data (optional).
  developmentEnvironments: ['development', 'test']
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
  headers: req.headers,
  params: {},
  cgi_data: {
    'server-software': 'Node ' + process.version
  }
});

```

The `cgi_data` metadata field is important - this is what populates the
"Environment" section of the Honeybadger error UI.  It usually contains HTTP
headers and other server info, in the Ruby frameworks that Honeybadger mainly
supports - since there is no sensible default in node for this, populating this
field effectively is left as an exercise to the user.

Instances of `honeybadger-node` can also emit the following events:
 - `sent`: This is emitted when honeybadger.io returns a 201 successfully. The
   response body, containing metadata about the submitted error, is emitted as
data.
 - `error`: Emitted in the case of local node errors while trying to connect to
   honeybadger.io.  *Will not be emitted unless a listener is present*.
 - `remoteError`: Emitted when a non-201 status code is returned by
   honeybadger.io.  Emits the response body, if one is present.

Prior to version 0.4.0, `honeybadger-node` was a Writable Stream.  This
interface has been removed, since it was only wishful thinking in the first
place, and did not make a lot of sense in practice.

