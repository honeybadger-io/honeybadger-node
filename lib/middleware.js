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

function requestHandler(client) {
  return function requestHandler(req, res, next) {
    var dom = domain.create();
    dom.on('error', next);
    dom.run(next);
  };
}

function errorHandler(client) {
  return function errorHandler(err, req, res, next) {
    client.notify(err, {
      url:     fullUrl(req),
      params:  req.body,    // http://expressjs.com/en/api.html#req.body
      session: req.session, // https://github.com/expressjs/session#reqsession
      headers: req.headers, // https://nodejs.org/api/http.html#http_message_headers
      cgiData: {
        REQUEST_METHOD: req.method
      }
    });
    return next(err);
  };
}

function lambdaHandler(client) {
  return function lambdaWrapper(handler) {
    return function lambdaHandler(event, context) {
      var dom = require('domain').create();

      dom.on('error', function(err) {
        client.notify(err, function() {
          context.fail(err);
        });
      });

      handler = dom.bind(handler);

      process.nextTick(function() {
        handler.apply(this, arguments);
      });
    }
  };
}

module.exports = {
  errorHandler: errorHandler,
  requestHandler: requestHandler,
  lambdaHandler: lambdaHandler
};
