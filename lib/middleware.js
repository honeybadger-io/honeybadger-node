var url = require('url');

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

function errorHandler(err, req, res, next) {
  Honeybadger.notify(err, {
    url:     fullUrl(req),
    params:  req.body,    // http://expressjs.com/en/api.html#req.body
    session: req.session, // https://github.com/expressjs/session#reqsession
    headers: req.headers  // https://nodejs.org/api/http.html#http_message_headers
  });
  return next(err);
}

module.exports = {
  errorHandler: errorHandler
};
