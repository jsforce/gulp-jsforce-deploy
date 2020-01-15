# gulp-jsforce-deploy

[![Build Status](https://travis-ci.org/jsforce/gulp-jsforce-deploy.svg?branch=master)](https://travis-ci.org/jsforce/gulp-jsforce-deploy)

A gulp plugin for deploying and retrieving Salesforce package, using JSforce's Metadata API feature.
As it is implemented purely in Node.js, you do not have to setup Force.com Migration Tool (Ant, Java) anymore.

## Setup

```
$ npm init
$ npm install gulp gulp-zip gulp-jsforce-deploy --save-dev
```

## Example

### Project Directory

```
├── gulpfile.js
├── package.json
└── pkg
    ├── classes
    ├── objects
    ├── package.xml
    ├── pages
    └── staticresources
```

### gulpfile.js

```javascript
var gulp = require('gulp')
var zip = require('gulp-zip')
// Backwards compatible with version
var forceDeploy = require('gulp-jsforce-deploy')
// Or new API
var { deploy, retrieve, extract } = require('gulp-jsforce-deploy')

gulp.task('deploy', async function () {
  return new Promise((resolve, reject) => {
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
})

gulp.task('retrieve', async function () {
  return new Promise((resolve, reject) => {
    gulp.src('./package.xml')
      .pipe(retrieve({
        // Filename is optional; uses name 'package.zip' by default.
        filename: 'pkg.zip',
        username: process.env.SF_USERNAME,
        password: process.env.SF_PASSWORD
        //, loginUrl: 'https://test.salesforce.com'
        //, pollTimeout: 120*1000
        //, pollInterval: 10*1000
        //, version: '33.0'
      }))
      // If the extract pipe is omitted, then the zip file will be written to the destination.
      .pipe(extract())
      .pipe(gulp.dest('./pkg'))
      .on('finish', resolve)
      .on('error', reject)
  })
})
```

### Sample commands

```
$ SF_USERNAME=username@example.com SF_PASSWORD=yourpassword gulp deploy
```

or if you have `foreman` installed, create `.env` file with above credential information, and execute :

```
$ foreman run gulp deploy
```
