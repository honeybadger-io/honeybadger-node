# Change Log
All notable changes to this project will be documented in this file. See [Keep a
CHANGELOG](http://keepachangelog.com/) for how to update this file. This project
adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Fixed
- `setTimeout` is now called when metrics are recorded instead of recursively.
  This fixes an issue in environments like AWS Lambda where the execution waits
  for the event loop to empty.
- `Honeybadger.lambdaHandler()` now re-throws errors as would be expected on the
  nodejs 0.10.42 runtime.
- Fixed a bug in `Honeybadger.lambdaHandler()` where callback was called without
  original arguments (the new implementation uses `Honeybadger.wrap`).

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
