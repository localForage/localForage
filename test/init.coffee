'use strict'

# Assign our test URL; it should be running a simple express server with our
# test HTML pages.
casper.TEST_URL = 'http://localhost:8181/'

casper.test.begin "Test setup", 1, (test) ->
  casper.start casper.TEST_URL, ->
    # Test that localStorage is empty to prevent any weird existing state bugs.
    # Seemingly, either CasperJS or PhantomJS persist localStorage
    # state across tests, so this makes sure things are clean when we start.
    test.assertEval ->
      window.localStorage.clear()

      window.localStorage.length == 0
    , "localStorage should be empty when we begin"

  casper.run ->
    test.done()
