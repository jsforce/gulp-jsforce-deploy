/* global process, __dirname */
'use strict'
var fs = require('fs')
var gulp = require('gulp')
var zip = require('gulp-zip')
var prettier = require('prettier-standard')
var forceDeploy = require('./')

gulp.task('forceDeploy', function () {
  gulp
    .src('./pkg/**', { base: '.' })
    .pipe(zip('pkg.zip'))
    .pipe(
      forceDeploy({
        username: process.env.SF_USERNAME,
        password: process.env.SF_PASSWORD
        //, loginUrl: 'https://test.salesforce.com'
        //, pollTimeout: 120*1000
        //, pollInterval: 10*1000
        //, version: '33.0'
      })
    )
})

gulp.task('build', function (cb) {
  var data = 'Random: ' + Math.random()
  fs.writeFile(
    __dirname + '/pkg/staticresources/GulpJSforceTestResource.resource',
    data,
    cb
  )
})

gulp.task('deploy', gulp.series('build', 'forceDeploy'))

gulp.task('format', async () => {
  await prettier.run('./', {})
})

gulp.task('lint', async () => {
  await prettier.run('./', { check: true, lint: true })
})
