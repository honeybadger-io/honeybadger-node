# Honeybadger for NodeJS

[![Build Status](https://travis-ci.org/honeybadger-io/honeybadger-node.svg?branch=master)](https://travis-ci.org/honeybadger-io/honeybadger-node)

This is the node.js module for integrating apps with the :zap: [Honeybadger Exception Notifier for Ruby and Rails](http://honeybadger.io).

When an uncaught exception occurs, Honeybadger will POST the relevant data to the Honeybadger service, and we'll alert you to the problem.

This library is intended to be is small and lightweight. It depends on the `stack-trace` module.

## Getting Started
 
### 1. Require the honeybadger module

```javascript
var Honeybadger = require('honeybadger');
```

### 2. Set your API key 

```javascript
var hb = new Honeybadger({
  apiKey: '[ YOUR API KEY HERE ]',
});
```

### 3. Start reporting errors

```javascript
var err = new Error('FLAGRANT ERROR!');
err.name = 'FlagrantError'

hb.send(err);
```

## Advanced Configuration

All configuration options are passed into the constructor. The example below includes all available configuration options. 

Note that the only configuration option you *have* to provide is `apiKey`.

```javascript
var hb = new HoneyBadger({
  apiKey: 'your api key goes here',
  server: { 
    hostname: 'steve',             // Defaults to the server's hostname
    environment_name: 'production' // Defaults to the current node environment
    project_root: '/var/www'       // Defaults to the node process's current working directory
  },

  logger: console, // an object with `info`, `warn` and `error` methods, or null. 
  developmentEnvironments: ['development', 'test'] // Environments which will not report data
});
```

## Public Interface

### `Honeybadger#send()`: Report an error to Honeybadger

This is the only function you need. Give it an `Error` object, and some optional metadata and it reports the error to Honeybadger. 

#### Examples:

```javascript
// You can report an error without any metadata
hb.send(error) 

// Metadata is provided via a second argument. 
hb.send(error, {
  context: { 
    user: 'jane', 
    email: 'a@b.net'
  },
  session: { user_token: "asdf" },  
  headers: req.headers,           
  params: {},
  cgi_data: {               
    'server-software': 'Node ' + process.version
  }
});
```

You can send the following metadata:

Key | Description
---- | ----
`context` | The context object is for app-specific data that will make error followup easier, like user ids 
`session` | The session data as defined by whatever session manager you use
`headers` | HTTP headers for the current request
`params` | GET or POST params for the current request
`cgi_data` | Information about the application environment. 


---

### Events

Instances of `honeybadger-node` can emit the following events:

Event         | Description
----          | ----
`sent`        | This is emitted when honeybadger.io returns a 201 successfully. The response body, containing metadata about the submitted error, is emitted as data.
`error`       | Emitted in the case of local node errors while trying to connect to honeybadger.io.  *Will not be emitted unless a listener is present*.
`remoteError` | Emitted when a non-201 status code is returned by Honeybadger.  Emits the response body, if one is present.



## Contributing

If you're adding a new feature, please [submit an issue](https://github.com/honeybadger-io/honeybadger-node/issues/new) as a preliminary step; that way you can be (moderately) sure that your pull request will be accepted.

### To contribute your code:

1. Fork it.
2. Create a topic branch `git checkout -b my_branch`
3. Commit your changes `git commit -am "Boom"`
3. Push to your branch `git push origin my_branch`
4. Send a [pull request](https://github.com/honeybadger-io/honeybadger-node/pulls)


### License

The Honeybadger gem is MIT licensed. See the [LICENSE](https://raw.github.com/honeybadger-io/honeybadger-node/master/LICENSE) file in this repository for details.
