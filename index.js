'use strict'
var PluginError = require('plugin-error')
var fancyLog = require('fancy-log')
var through = require('through2')
var meta = require('jsforce-metadata-tools')

module.exports = function (options) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file)
    }
    if (file.isStream()) {
      return callback(
        new PluginError('gulp-jsforce-deploy', 'Stream input is not supported')
      )
    }
    options.logger = Object.assign({ log: fancyLog }, fancyLog)
    meta
      .deployFromZipStream(file.contents, options)
      .then(function (res) {
        meta.reportDeployResult(res, options.logger, options.verbose)
        if (!res.success) {
          return callback(
            new PluginError('gulp-jsforce-deploy', 'Deploy Failed.')
          )
        }
        callback(null, file)
      })
      .catch(function (err) {
        callback(err)
      })
  })
}
