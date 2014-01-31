#global casper

#jshint strict:false

utils = require "utils"

if utils.ltVersion(phantom.version, '1.9.0')
  casper.test.skip(6, 'PhantomJS version <1.9.0 does not implement request.abort()')
  casper.test.done()
else
  SERVER = 'http://localhost:54321/'
  ORIGINAL_URL = "tests/site/index.html"
  CHANGED_URL = "tests/site/index.html?foo=bar"

  setToTrueOnResourceRequested = false
  setToTrueOnResourceReceived = false
  requestURLRequested = ''
  requestURLReceived = ''

  onResourceRequested = (casper, requestData, request) ->
    if requestData.url == (SERVER + ORIGINAL_URL)
      setToTrueOnResourceRequested = true
      requestURLRequested = requestData.url

  onResourceRequestedWithAbort = (casper, requestData, request) ->
    if requestData.url == (SERVER + ORIGINAL_URL)
      request.abort()

  onResourceRequestedWithChangeURL = (casper, requestData, request) ->
    if requestData.url == (SERVER + ORIGINAL_URL)
      request.changeUrl(SERVER + CHANGED_URL)

  onResourceReceived = (casper, response) ->
    if response.url == (SERVER + ORIGINAL_URL)
      setToTrueOnResourceReceived = true
      requestURLReceived = response.url

  onResourceReceivedWithChangeURL = (casper, response) ->
    if response.url == (SERVER + CHANGED_URL)
      requestURLReceived = response.url

  setUp = (test) ->
    casper.options.onResourceRequested = onResourceRequested
    casper.options.onResourceReceived = onResourceReceived
    casper.start()

  setUpWithAbort = (test) ->
    casper.options.onResourceRequested = onResourceRequestedWithAbort
    casper.options.onResourceReceived = onResourceReceived
    casper.start()

  setUpWithChangeURL = (test) ->
    casper.options.onResourceRequested = onResourceRequestedWithChangeURL
    casper.options.onResourceReceived = onResourceReceivedWithChangeURL
    casper.start()

  tearDown = (test) ->
    setToTrueOnResourceRequested = false
    setToTrueOnResourceReceived = false
    casper.options.onResourceRequested = null
    casper.options.onResourceReceived = null


  casper.test.begin "onResourceRequested tests without abort/override", 4,
    setUp: setUp
    tearDown: tearDown
    test: (test) ->
      casper.open(ORIGINAL_URL).then ->

      casper.wait 200, ->
        test.assertEquals setToTrueOnResourceRequested, true, "Casper.options.onResourceRequested called successfully"
        test.assertEquals requestURLRequested, SERVER+ORIGINAL_URL, "request url successfully recorded"
        test.assertEquals setToTrueOnResourceReceived, true, "Casper.options.onResourceReceived called successfully"
        test.assertEquals requestURLReceived, SERVER+ORIGINAL_URL, "response url successfully recorded"

      casper.run ->
        test.done()


  casper.test.begin "onResourceRequested tests with request.abort()", 1,
    setUp: setUpWithAbort
    tearDown: tearDown
    test: (test) ->
      casper.open(ORIGINAL_URL).then ->

      casper.wait 200, ->
        test.assertNotEquals setToTrueOnResourceReceived, true, "Casper.options.onResourceReceived correctly never called"

      casper.run ->
        test.done()


  casper.test.begin "onResourceRequested tests with request.changeUrl()", 1,
    setUp: setUpWithChangeURL
    tearDown: tearDown
    test: (test) ->
      casper.open(ORIGINAL_URL).then ->

      casper.wait 200, ->
        test.assertEquals requestURLReceived, SERVER+CHANGED_URL, "response url successfully changed"

      casper.run ->
        test.done()
