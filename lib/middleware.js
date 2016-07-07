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

function metricsHandler(req, res, next) {
  var startAt = process.hrtime();

  var end = res.end;
  res.end = function () {
    var diff = process.hrtime(startAt);
    var time = diff[0] * 1e3 + diff[1] * 1e-6;

    end.apply(res, arguments);

    var code = res.statusCode;
    if (!code) { return; }
    this.timing("app.request." + code, time)
  }.bind(this);

  return next();
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
  return function lambdaHandler(event, context, callback) {
    if (!callback) {
      // Deprecated: Pre-nodejs4.3 runtime.
      this.wrap(handler, {stackShift: 4}, function(_backendErr, err, body) {
        context.fail(err);
      }).apply(this, arguments);
    } else {
      this.wrap(handler, {stackShift: 4}).apply(this, arguments);
    }
  }.bind(this);
}

module.exports = {
  errorHandler: errorHandler,
  requestHandler: requestHandler,
  metricsHandler: metricsHandler,
  lambdaHandler: lambdaHandler
};
