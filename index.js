'use strict'
var meta = require('jsforce-metadata-tools')
var PluginError = require('plugin-error')
var decompress = require('decompress')
var fancyLog = require('fancy-log')
var through = require('through2')
var parser = require('xml2js')
var Vinyl = require('vinyl')

var forceDeploy = function deploy (options) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file)
    }

    if (file.isStream()) {
      return callback(
        new PluginError('gulp-jsforce-deploy', 'Stream input is not supported')
      )
    }

    var deployFactory = this
    options.logger =
      options.logger === undefined
        ? Object.assign({ log: fancyLog }, fancyLog)
        : options.logger

    meta
      .deployFromZipStream(file.contents, options)
      .then(function (res) {
        var resultFile
        meta.reportDeployResult(res, options.logger, options.verbose)

        if (!res.success) {
          if (options.checkOnly && options.checkOnlyNoFail) {
            fancyLog(
              'Deploy Failed. Error suppressed by option; check output for reason.'
            )
          } else {
            return callback(
              new PluginError('gulp-jsforce-deploy', 'Deploy Failed.')
            )
          }
        }

        if (options.resultPassThrough || options.resultOnly) {
          resultFile = new Vinyl({
            cwd: './',
            base: './',
            path: './deploy-result.json',
            contents: new Buffer(JSON.stringify(res, null, 2), 'utf8')
          })
        }

        if (options.resultPassThrough && !options.resultOnly) {
          deployFactory.push(resultFile)
        }

        if (options.resultOnly && !options.resultPassThrough) {
          file = resultFile
        }

        callback(null, file)
      })
      .catch(function (err) {
        callback(err)
      })
  })
}

forceDeploy.deploy = function deploy (options) {
  return forceDeploy(options)
}

forceDeploy.retrieve = function retrieve (options) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file)
    }

    if (file.isStream()) {
      return callback(
        new PluginError('gulp-jsforce-deploy', 'Stream input is not supported')
      )
    }

    options.logger =
      options.logger === undefined
        ? Object.assign({ log: fancyLog }, fancyLog)
        : options.logger

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

        if (options.resultPassThrough) {
          deployFactory.push(
            new Vinyl({
              cwd: './',
              base: './',
              path: './retrieve-result.json',
              contents: new Buffer(JSON.stringify(res, null, 2), 'utf8')
            })
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

forceDeploy.extract = function extract (options = {}) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file)
    }

    if (file.isStream()) {
      return callback(
        new PluginError('gulp-jsforce-deploy', 'Stream input is not supported')
      )
    }

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

module.exports = forceDeploy
