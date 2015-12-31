'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var meta = require('jsforce-metadata-tools');

var pluginName = 'gulp-jsforce-deploy';

module.exports = function(options) {
  return through.obj(function(file, enc, callback) {
    var err;
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      err = new gutil.PluginError(pluginName, 'Stream input is not supported');
      return callback(err);
    }
    options.logger = gutil;
    meta.deployFromZipStream(file.contents, options)
      .then(function(res) {
        meta.reportDeployResult(res, gutil, options.verbose);
        if (res.success)
          callback();
        else {
          err = new gutil.PluginError(pluginName, 'An error occurred deploying the package.');
          callback(err, res);
        }
      })
      .catch(function(err) {
        callback(err);
      });
  });
};
