# Change Log
All notable changes to this project will be documented in this file. See [Keep a
CHANGELOG](http://keepachangelog.com/) for how to update this file. This project
adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.4.0] - 2020-03-19
### Fixed
- Support async functions in lambdaHandler (#54, #82)

## [1.3.0] - 2018-06-19
### Added
- Add an option to report uncaught exceptions. -@aryehischechter/#31

## [1.2.1] - 2016-10-14
### Fixed
- Update request package to ~2.79.0

## [1.2.0] - 2016-10-14
### Changed
- Sunset performance metrics. See
  http://blog.honeybadger.io/sunsetting-performance-metrics/

## [1.1.3] - 2016-08-15
### Changed
- Deprecate `Honeybadger.wrap()`
- Updated dependency for request package.

### Fixed
- Add missing filters configuration option.

## [1.1.2] - 2016-07-12
### Fixed
- `setTimeout` is now called when metrics are recorded instead of recursively.
  This fixes an issue in environments like AWS Lambda where the execution waits
  for the event loop to empty.
- Fixed a bug where uncaught exception handler wasn't called in development
  environment (see #14).
- Call original handler with arguments in `Honeybadger.lambdaHandler()`.

### Added
- Use `Honeybadger.flushMetrics()` to clear the timeout interval and flush
  metrics immediately.

## [1.1.1] - 2016-06-16
### Fixed
- Bump *request* package to `~2.72.0` to fix security vulnerabilities. -@gazay

## [1.1.0] - 2016-05-12
### Added
- Use `Honeybadger.metricsHandler` to send us request metrics!

## [1.0.0] - 2016-04-21
### Changed
- Entirely new API. See the [README](README.md) for details!
