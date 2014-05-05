'use strict'

casper.test.begin "Testing web worker handling", (test) ->
  casper.start "#{casper.TEST_URL}test.webworker.html", ->
    test.info "Ensure localForage works inside web workers"

    test.assertEval ->
      typeof _worker is "object"
    , "worker exists"

    test.assertEval ->
      typeof runWith is "function"
    , "test runner exists"

  casper.then ->
    @evaluate ->
      runWith('localStorageWrapper')

    @waitForSelector '#localStorageWrapper', ->
      test.assertEvalEquals ->
        window._testError
      , true, 'localStorageWrapper cannot run in web workers'


  casper.then ->
    @evaluate ->
      runWith('asyncStorage')

    @waitForSelector '#asyncStorage', ->
      test.assertEvalEquals ->
        window._testText
      , 'I have been set with asyncStorage', 'asyncStorage can run in web workers'


  casper.then ->
    @evaluate ->
      runWith('webSQLStorage')

    @waitForSelector '#webSQLStorage', ->
      test.assertEvalEquals ->
        window._testText
      , 'I have been set with webSQLStorage', 'webSQLStorage can run in web workers'


  casper.run ->
    test.done()


