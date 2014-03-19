'use strict'

express = require 'express'
app = express()

app_folder = process.cwd()

# Configuration.
app.configure ->
  app.use express.bodyParser()
  app.use express.methodOverride()

  app.use app.router

  app.use express.static("#{app_folder}")

  app.use express.logger('dev') unless process.env.NODE_ENV

app.configure ->
  app.use express.errorHandler
    dumpExceptions: true
    showStack: true

console.log ''
console.log 'Serving folder:'
console.log " * #{app_folder}"

module.exports = app
