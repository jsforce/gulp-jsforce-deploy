/* global process, describe, it, Buffer, __dirname */
'use strict'
var fs = require('fs')
var jsforce = require('jsforce')
var assert = require('power-assert')

/**
 *
 */
describe('jsforce-deploy', function () {
  this.timeout(20000)

  it("should match deployed static file's content to the local one", function () {
    var conn = new jsforce.Connection()
    return conn
      .login(process.env.SF_USERNAME, process.env.SF_PASSWORD)
      .then(function () {
        return conn.identity()
      })
      .then(function (identity) {
        return conn.metadata.read('StaticResource', 'GulpJSforceTestResource')
      })
      .then(function (res) {
        var data = fs.readFileSync(
          __dirname + '/pkg/staticresources/GulpJSforceTestResource.resource',
          'utf8'
        )
        assert(new Buffer(res.content, 'base64').toString('utf8') === data)
      })
  })
})
