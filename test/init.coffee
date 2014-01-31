'use strict'

casper.TEST_URL = 'http://localhost:8181/'

casper.test.begin "Pre-test setup", 1, (test) ->
  casper.start casper.TEST_URL, ->
    casper.test.info 'Clearing out localStorage'

    # Clear localStorage from any previous test runs.
    @evaluate ->
      window.localStorage.clear()

    # Test that localStorage is empty to prevent any weird existing state bugs.
    test.assertEval ->
      window.localStorage.length == 0
    , 'localStorage should be empty'

  casper.run ->
    test.done()
