'use strict'

# Assign our test URL; it should be running a simple express server with our
# test HTML pages.
casper.TEST_URL = 'http://localhost:8181/'

casper.test.begin "Test setup", 1, (test) ->
  casper.start casper.TEST_URL, ->
    # Test that localStorage is empty to prevent any weird existing state bugs.
    # Previous versions of either CasperJS or PhantomJS persisted localStorage
    # state across tests, so this makes sure things are clean when we start.
    test.assertEval ->
      window.localStorage.length == 0
    , "localStorage should be empty" # Please upgrade CasperJS and/or PhantomJS
                                     # if this test fails; CasperJS 1.1.0 and
                                     # PhantomJS 1.9.7 were used to write these
                                     # tests.

  casper.run ->
    test.done()
