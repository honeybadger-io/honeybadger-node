var url = require('url');
var domain = require('domain');

function fullUrl(req) {
  var connection = req.connection;
  var address = connection && connection.address();
  var port = address ? address.port : undefined;
  return url.format({
    protocol: req.protocol,
    hostname: req.hostname,
    port: port,
    pathname: req.path,
    query: req.query
  });
}

function requestHandler(req, res, next) {
  var dom = domain.create();
  dom.on('error', next);
  dom.run(next);
}

function errorHandler(err, req, res, next) {
  this.notify(err, {
    url:     fullUrl(req),
    params:  req.body,    // http://expressjs.com/en/api.html#req.body
    session: req.session, // https://github.com/expressjs/session#reqsession
    headers: req.headers, // https://nodejs.org/api/http.html#http_message_headers
    cgiData: {
      REQUEST_METHOD: req.method
    }
  });
  return next(err);
}

function lambdaHandler(handler) {
  return function lambdaHandler(event, context) {
    var args = arguments;
    var dom = require('domain').create();

    dom.on('error', function(err) {
      this.notify(err, function() {
        context.fail(err);
      });
    }.bind(this));

    dom.run(function() {
      process.nextTick(function() {
        handler.apply(this, args);
      });
    });
  }.bind(this);
}

// Deprecated.
function metricsHandler(req, res, next) {
  this.logger.error('DEPRECATION WARNING: Honeybadger.metricsHandler has no effect and will be removed.');
  return next();
}

module.exports = {
  errorHandler: errorHandler,
  requestHandler: requestHandler,
  metricsHandler: metricsHandler,
  lambdaHandler: lambdaHandler
};
