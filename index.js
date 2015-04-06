'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var jsforce = require('jsforce');

module.exports = function(options) {
  return through.obj(function(file, enc, callback) {
    var err;
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      err = new gutil.PluginError('gulp-jsforce-deploy', 'Stream input is not supported');
      return callback(err);
    }
    if ((!options.username || !options.password) && (!options.accessToken || !options.instanceUrl)) {
      err = new gutil.PluginError('gulp-jsforce-deploy',
        'Credential to salesforce server is not found in options.\n' +
        'Specify "username" and "password" in options.');
      return callback(err);
    }
    var config = {};
    "loginUrl,accessToken,instanceUrl,refreshToken,clientId,clientSecret,redirectUri,logLevel,version".split(',').forEach(function(prop) {
      if (options[prop]) { config[prop] = options[prop]; }
    });
    var conn = new jsforce.Connection(config);
    (
      options.username && options.password ?
      conn.login(options.username, options.password).then(function() { return conn.identity(); }) :
      conn.identity()
    )
    .then(function(identity) {
      gutil.log('Logged in as : ' + identity.username);
      gutil.log('Deploying to Server ...');
      conn.metadata.pollTimeout = options.pollTimeout || 60*1000; // timeout in 60 sec by default
      conn.metadata.pollInterval = options.pollInterval || 5*1000; // polling interval to 5 sec by default
      return conn.metadata.deploy(file.contents).complete({ details: true });
    })
    .then(function(res) {
      if (res.status !== 'Succeeded') {
        var message = 'Deploy failed.';
        if (res.status === 'SucceededPartial') {
          message = 'Deploy partially successful.';
        }
        gutil.log(message);
        if (res.details && res.details.componentFailures) {
          reportFailures(res.details);
        }
        callback(new gutil.PluginError('gulp-jsforce-deploy', message));
      } else {
        gutil.log('Deploy successful.');
        callback();
      }
    })
    .then(null, function(err) {
      gutil.log('Deploy faiiled.');
      err = new gutil.PluginError('test', err, { showStack: true });
      callback(err);
    });
  });

  function reportFailures(details) {
    var failures = details.componentFailures;
    if (!failures) { return; }
    if (!failures.length) { failures = [ failures ]; }
    failures.forEach(function(f) {
      gutil.log(' - ' + f.problemType + ' on ' + f.fileName + ' : ' + f.problem);
    });
  }

};
