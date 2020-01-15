'use strict'
var meta = require('jsforce-metadata-tools')
var PluginError = require('plugin-error')
var decompress = require('decompress')
var fancyLog = require('fancy-log')
var through = require('through2')
var parser = require('xml2js')
var Vinyl = require('vinyl')

var deploy = function deploy (options) {
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

deploy.deploy = function deploy (options) {
  return this.apply(this, options)
}

deploy.retrieve = function retrieve (options) {
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

    parser
      .parseStringPromise(file.contents.toString('utf8'))
      .then(function (dom) {
        delete dom.Package.$
        options.unpackaged = dom.Package
        return meta.retrieve(options)
      })
      .then(function (res) {
        meta.reportRetrieveResult(res, options.logger, options.verbose)

        if (!res.success) {
          return callback(
            new PluginError('gulp-jsforce-deploy', 'Retrieve Failed.')
          )
        }

        callback(
          null,
          new Vinyl({
            cwd: file.cwd,
            base: file.base,
            path: file.base + '/' + (options.filename || 'package.zip'),
            contents: new Buffer(res.zipFile, 'base64')
          })
        )
      })
      .catch(function (err) {
        callback(err)
      })
  })
}

deploy.extract = function extract (options = {}) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file)
    }

    if (file.isStream()) {
      return callback(
        new PluginError('gulp-jsforce-deploy', 'Stream input is not supported')
      )
    }

    // options.logger = Object.assign({ log: fancyLog }, fancyLog)
    var extractFactory = this

    decompress(file.contents)
      .then(function (files) {
        files.forEach(file => {
          var path = file.path.replace(/^unpackaged\//, '')

          extractFactory.push(
            new Vinyl({
              cwd: './',
              path,
              contents: file.data
            })
          )

          if (options.verbose) fancyLog(`Extracted file '${path}'`)
        })

        fancyLog(`Finished extracting ${files.length} files.`)
        callback()
      })
      .catch(function (err) {
        callback(err)
      })
  })
}

module.exports = deploy
