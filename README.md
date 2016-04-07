# Honeybadger for NodeJS

[![Build Status](https://travis-ci.org/honeybadger-io/honeybadger-node.svg?branch=master)](https://travis-ci.org/honeybadger-io/honeybadger-node)
[![npm version](https://badge.fury.io/js/honeybadger.svg)](https://badge.fury.io/js/honeybadger)

This is the Node.js module for integrating apps with the :zap: [Honeybadger Exception Notifier for JavaScript and Node](http://honeybadger.io).

When an uncaught exception occurs, Honeybadger will POST the relevant data to the Honeybadger service, and we'll alert you to the problem.

## Getting Started

In this section, we'll cover the basics. More advanced installations are covered later.

### 1. Install the npm package

```javascript
npm install honeybadger --save
```

### 2. Require the honeybadger module

```javascript
var Honeybadger = require('honeybadger');
```

### 3. Set your API key

```javascript
Honeybadger.configure({
  apiKey: '[ YOUR API KEY HERE ]'
});
```

You can also place your API key in the `HONEYBADGER_API_KEY` environment variable if you prefer the 12-factor app configuration style.

### 4. Set up your code

#### Express or Connect Framework

Errors which happen in [Express](http://expressjs.com/) or [Connect](https://github.com/senchalabs/connect#readme) apps can be automatically reported to Honeybadger by installing our middleware.

In order to function properly our middleware must be added after your normal app middleware but before any error handling middleware:

```node
app.use(Honeybadger.errorHandler);
```

#### Manually reporting exceptions

To catch exceptions and report them manually:

```javascript
try {
  throw(new Error('Badgers!'));
} catch(err) {
  Honeybadger.notify(err);
  throw(err);
}
```

You can also use the `#wrap()` function to simplify the previous example:

```javascript
Honeybadger.wrap(function(){
  throw(new Error('Badgers!'));
})();
```

Note that re-throwing the exceptions will cause them to be reported by any additional error handlers that may catch them.

## Sample Application

If you'd like to see the library in action before you integrate it with your apps, check out our [sample Node.js/Express application](https://github.com/honeybadger-io/crywolf-node).

You can deploy the sample app to your Heroku account by clicking this button:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/honeybadger-io/crywolf-node)

Don't forget to destroy the Heroku app after you're done so that you aren't charged for usage.

The code for the sample app is [available on Github](https://github.com/honeybadger-io/crywolf-node), in case you'd like to read through it, or run it locally.

## Advanced Configuration

There are a few ways to configure the Honeybadger module. You can use `#configure()` at runtime. You can use environment variables. Or you can use a combination of the two.

Note that the only configuration option you *have* to provide is `apiKey`.

```javascript
HoneyBadger.configure({
  // The API key of your Honeybadger project. (env: HONEYBADGER_API_KEY)
  apiKey: 'your api key goes here',

  // The API endpoint to use. Must be a valid URL with no trailing slash. (env: HONEYBADGER_ENDPOINT)
  endpoint: 'https://api.honeybadger.io',

  // Defaults to the server's hostname. (env: HONEYBADGER_HOSTNAME)
  hostname: 'badger01',

  // Defaults to the current node environment. (env: HONEYBADGER_ENVIRONMENT)
  environment: 'staging',

  // Defaults to the node process's current working directory. (env: HONEYBADGER_PROJECT_ROOT)
  projectRoot: '/var/www',

  // An object with `info` and `error` methods.
  logger: console,

  // Environments which will not report data.
  developmentEnvironments: ['dev', 'development', 'test'],

  // Key values to filter from request data. Matches are partial, so "password"
  // and "password_confirmation" will both be filtered.
  filters: ['creditcard', 'password']
});
```

### Configuring the default logger

Honeybadger provides a default logger which reports info and error level logs to
stdout/stderr (basically a proxy to `console`). The default level is "error"
("info" logs will be silenced). To configure the log level you can set
`Honeybadger.logger.level = 'info'` or set the `HONEYBADGER_LOG_LEVEL=info`
environment variable before executing your program.

## Public Interface

### `Honeybadger.notify()`: Report an error to Honeybadger

This is the only function you need. Give it an `Error` object, and some optional metadata and it reports the error to Honeybadger.

#### Examples:

```javascript
// You can report an error without any metadata
Honeybadger.notify(error);

// Metadata is provided via a second argument.
Honeybadger.notify(error, {
  context: {
    user: 'jane',
    email: 'a@b.net'
  },
  session: { user_token: "asdf" },
  headers: req.headers,
  params: {},
  cgiData: {
    'server-software': 'Node ' + process.version
  }
});
```

You can send the following metadata:

Key | Description
---- | ----
`name` | (`String`) The error's type/class name.
`message` | (`String`) The error message.
`context` | (`Object`) The context object is for app-specific data that will make error followup easier, like user ids
`session` | (`Object`) The session data as defined by whatever session manager you use
`headers` | (`Object`) HTTP headers for the current request
`params` | (`Object`) GET or POST params for the current request
`cgiData` | (`Object`) Information about the application environment.
`url` | (`String`) The URL associated with the request, if any.
`component` | (`String`) The software component (displayed in Honeybadger as: component#action).
`action` | (`String`) The action within the component.
`fingerprint` | (`String`) An optional grouping fingerprint.

---

### `Honeybadger.wrap()`: Wrap the given function in try/catch and report any exceptions

It can be a pain to include try/catch blocks everywhere in your app. A slightly nicer option is to use `Honeybadger.wrap`. You pass it a function. It returns a new function which wraps your existing function in a try/catch block. Errors will be re-thrown after they are reported.

#### Examples:

```javascript
Honeybadger.wrap(function(){
  throw "oops";
})();
```

Note that `wrap` returns a function. This makes it easy to use with async callbacks, as in the example below:

```javascript
myEventEmitter.on('event', Honeybadger.wrap(function(){ throw "oops"; }));
```

---

### `Honeybadger.setContext()`: Set metadata to be sent if an exception occurs

Javascript exceptions are pretty bare-bones. You probably have some additional data that could make them a lot easier to understand - perhaps the name of the current controller/view, or the id of the current user. This function lets you set context data that will be sent if an error should occur.

You can call `setContext` as many times as you like. New context data will be merged with the existing data.

#### Examples:

```javascript
// On load
Honeybadger.setContext({
  user_id: 123
});

// Later
Honeybadger.setContext({
  controller_name: 'posts'
});

// The context now contains { user_id: 123, controller_name: 'posts' }
```

---

### `Honeybadger.resetContext()`: Clear context metadata

If you've used `Honeybadger.setContext` to store context data, you can clear it with `Honeybadger.resetContext`.

#### Example:

```javascript
// Set the context to {}
Honeybadger.resetContext();

// Clear the context, then set it to `{ user_id: 123 }`
Honeybadger.resetContext({
  user_id: 123
});
```

---

### `Honeybadger.configure()`: Set configuration values

The `configure` method takes an object containing config values. Its return value is unspecified.

#### Examples:

```javascript
Honeybadger.configure({apiKey: "adlkjfljk"});
```

---

### `Honeybadger.factory()`: create a new client instance.

The `factory` method returns a new instance of Honeybadger which can be configured differently than the global/singleton instance.

#### Examples:

```javascript
var other_hb = Honeybadger.factory({apiKey: "zxcvbnm"});
other_hb.notify("This will go to an alternate project.");
```

---

### `Honeybadger.errorHandler()`: middleware for Express and Connect.

The `errorHandler` method is an error reporting middleware for [Express](http://expressjs.com/) and [Connect](https://github.com/senchalabs/connect#readme) apps. Use the middleware in your app to report all errors which happen during the request. Request data such as params, session, and cookies will be automatically reported.

#### Examples:

```node
app.use(Honeybadger.errorHandler);
```

---

### Events

Instances of `honeybadger-node` can emit the following events:

Event         | Description
----          | ----
`sent`        | This is emitted when honeybadger.io returns a 201 successfully. The response body, containing metadata about the submitted error, is emitted as data.
`error`       | Emitted in the case of local node errors while trying to connect to honeybadger.io.  *Will not be emitted unless a listener is present*.
`remoteError` | Emitted when a non-201 status code is returned by Honeybadger.  Emits the response body, if one is present.

## Changelog

See https://github.com/honeybadger-io/honeybadger-node/blob/master/CHANGELOG.md

## Contributing

If you're adding a new feature, please [submit an issue](https://github.com/honeybadger-io/honeybadger-node/issues/new) as a preliminary step; that way you can be (moderately) sure that your pull request will be accepted.

### To contribute your code:

1. Fork it.
2. Create a topic branch `git checkout -b my_branch`
3. Commit your changes `git commit -am "Boom"`
3. Push to your branch `git push origin my_branch`
4. Send a [pull request](https://github.com/honeybadger-io/honeybadger-node/pulls)

### Development

Clone the repo, and then `npm install`. Now you should be able to run `npm test`.

### License

The Honeybadger gem is MIT licensed. See the [LICENSE](https://raw.github.com/honeybadger-io/honeybadger-node/master/LICENSE) file in this repository for details.
