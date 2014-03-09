'use strict'

express = require 'express'
app = express()

app_folder = process.cwd()

# Configuration.
app.configure ->
  app.use express.bodyParser()
  app.use express.methodOverride()

  app.use app.router

  # Public/static files directory. If you add more folders here,
  # they'll also be served statically from the root URL.
  app.use express.static("#{app_folder}/dist")
  app.use express.static("#{app_folder}/examples")
  app.use express.static("#{app_folder}/test")
  app.use express.static("#{app_folder}/vendor")

  app.use express.logger('dev') unless process.env.NODE_ENV

app.configure ->
  app.use express.errorHandler
    dumpExceptions: true
    showStack: true

console.log ''
console.log 'Serving folders: '
console.log " * #{app_folder}/dist"
console.log " * #{app_folder}/examples"
console.log " * #{app_folder}/test"
console.log " * #{app_folder}/vendor"

module.exports = app
