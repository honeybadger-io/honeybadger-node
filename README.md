# Honeybadger for NodeJS

![Node.js CI](https://github.com/honeybadger-io/honeybadger-node/workflows/Node.js%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/honeybadger.svg)](https://badge.fury.io/js/honeybadger)

This is the Node.js module for integrating apps with the :zap: [Honeybadger Exception Notifier for JavaScript and Node](http://honeybadger.io).

When an uncaught exception occurs, Honeybadger will POST the relevant data to the Honeybadger service, and we'll alert you to the problem.

## Upgrading from 0.x

We made some breaking changes in 1.0, so if you currently use 0.x, you will need to update your usage. In most cases you should be able to replace the old `hb.send()` function with `hb.notify()`. Instead of configuring the client as an instance, you can require the global singleton instead:

```javascript
var hb = require('honeybadger');

hb.configure({
  apiKey: '[ YOUR API KEY HERE ]'
});

# Change:
# hb.send(err, opts);
# To:
hb.notify(err, opts);
```

We also stopped emitting the `remoteError` event and now emit `error` for all failures to notify Honeybadger.

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

By default Honeybadger will be notified automatically of all unhandled errors which crash your node processes. Many applications catch errors, however, so you may want to set up some additional framework integrations:

#### Express or Connect Framework

Errors which happen in [Express](http://expressjs.com/) or [Connect](https://github.com/senchalabs/connect#readme) apps can be automatically reported to Honeybadger by installing our middleware.

In order to function properly our middleware must be added before and after your normal app middleware, but before any other error handling middleware:

```javascript
app.use(Honeybadger.requestHandler); // Use *before* all other app middleware.
// app.use(myMiddleware);
app.use(Honeybadger.errorHandler);  // Use *after* all other app middleware.
// app.use(myErrorMiddleware);
```

Note: If you use the [connect-domain](https://www.npmjs.com/package/connect-domain) middleware, you do *not* need to use `Honeybadger.requestHandler` because they are essentially the same.

#### AWS Lambda

Honeybadger can automatically report errors which happen on [AWS Lambda](https://aws.amazon.com/lambda/):

```javascript
// Your handler function.
function handler(event, context) {
  console.log('Event:', event);
  console.log('Context:', context);
  throw(new Error('Something went wrong.'));
  console.log("Shouldn't make it here.");
}

// Build and export the function.
exports.handler = Honeybadger.lambdaHandler(handler);
```

Check out our [example Lambda project](https://github.com/honeybadger-io/honeybadger-lambda-node) for a complete example.

Note: [Async Handlers](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html#nodejs-handler-async) are not supported by `Honeybadger.lambdaHandler`. See [this issue](https://github.com/honeybadger-io/honeybadger-node/issues/54) for status.

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
Honeybadger.configure({
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

// Metadata is provided via a second or third argument.
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

JavaScript often uses generic class names -- such as `Error` -- which are uninformative and also cause unrelated errors to be grouped together. To get around this issue it's a good practice to send a custom error class when notifying Honeybadger:

```javascript
Honeybadger.notify(error, 'DescriptiveClass');
Honeybadger.notify(error, 'DescriptiveClass', { ... });
```

You can notify Honeybadger of anything, even if you don't have an error object. We'll automatically generate a stacktrace for you:

```javascript
Honeybadger.notify('Badgers!');
Honeybadger.notify('Badgers!', { ... });
Honeybadger.notify('Badgers!', 'CustomClass');
Honeybadger.notify('Badgers!', 'CustomClass', { ... });
Honeybadger.notify({
  message: 'Badgers!',
  name: 'CustomClass',
  ...
});
```

Finally, you can provide an optional callback as the last argument to any call to `Honeybadger.notify()`. The callback will always be called regardless of the result of the notification:

```javascript
Honeybadger.notify(err, function notifyCallback(err, notice) {
  if (err) {
    return console.error(err);
  }
  // If there was no error, log the notice:
  console.log(notice); // { id: 'uuid' }
});
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

### `Honeybadger.factory()`: create a new client instance

The `factory` method returns a new instance of Honeybadger which can be configured differently than the global/singleton instance.

#### Examples:

```javascript
var other_hb = Honeybadger.factory({apiKey: "zxcvbnm"});
other_hb.notify("This will go to an alternate project.");
```

---

### `Honeybadger.errorHandler()`: error handling middleware for Express and Connect

The `errorHandler` method is an error reporting middleware for [Express](http://expressjs.com/) and [Connect](https://github.com/senchalabs/connect#readme) apps. Use the middleware in your app to report all errors which happen during the request. Request data such as params, session, and cookies will be automatically reported.

#### Examples:

```javascript
app.use(Honeybadger.errorHandler);
```

---

### `Honeybadger.lambdaHandler()`: handler for AWS Lambda

The `lambdaHandler` method is a wrapper for [AWS Lambda](https://aws.amazon.com/lambda/). You pass it your Lambda function and it returns a new function which reports errors to Honeybadger.

#### Examples:

```javascript
// Your handler function.
function handler(event, context) {
  console.log('Event:', event);
  console.log('Context:', context);
  throw(new Error('Something went wrong.'));
  console.log("Shouldn't make it here.");
}

// Build and export the function.
exports.handler = Honeybadger.lambdaHandler(handler);
```

Note: [Async Handlers](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html#nodejs-handler-async) are not supported by `Honeybadger.lambdaHandler`. See [this issue](https://github.com/honeybadger-io/honeybadger-node/issues/54) for status.

---

### `Honeybadger.onUncaughtException()`: configure the uncaught exception handler

Honeybadger's default uncaught exception handler logs the error and exits the
process after notifying Honeybadger of the uncaught exception. You can change
the default handler by calling `Honeybadger.onUncaughtException()` with a new
handler function. Honeybadger will still be notified before your handler is
invoked. Note that it's important to exit the process cleanly if you replace the
handler; see [Warning: using 'uncaughtException'
correctly](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly)
for additional information.

#### Examples:

```javascript
Honeybadger.onUncaughtException(function(err) {
  doSomethingWith(err);
  process.exit(1);
});
```

---

### Events

Instances of `honeybadger-node` can emit the following events:

Event         | Description
----          | ----
`sent`        | This is emitted when honeybadger.io returns a 201 successfully. The response body, containing metadata about the submitted error, is emitted as data.
`error`       | Emitted in the case of any error while trying to connect to honeybadger.io.  *Will not be emitted unless a listener is present*.

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

## Releasing

Releasing is done with two commands: `npm version` and `npm publish`. **Both
commands should be used with care.** The `npm publish` command publishes to NPM.

To perform a full release:

1. With a clean working tree, use `npm version [new version]` to bump the
   version, commit the changes, tag the release, and push to GitHub. See `npm
   help version` for documentation.

2. To publish the release, use `npm publish`. See `npm help publish` for
   documentation.

### License

The Honeybadger gem is MIT licensed. See the [LICENSE](https://raw.github.com/honeybadger-io/honeybadger-node/master/LICENSE) file in this repository for details.
