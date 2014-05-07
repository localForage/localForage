"use strict"

casper.test.begin "Testing web worker handling", (test) ->
  casper.start "#{casper.TEST_URL}test.webworker.html", ->
    test.info "Ensure localForage works inside web workers"

    test.assertEval ->
      typeof _worker is "object"
    , "Web worker exists"

    test.assertEval ->
      typeof runWith is "function"
    , "Test runner exists"

  casper.then ->
    if casper.ENGINE is "slimerjs"
      test.skip 1, "Skip web worker test in SlimerJS; it's buggy"
      return

    unless casper.DRIVER_NAME is "localStorage"
      @evaluate (driver) ->
        runWith(driver)
      , casper.DRIVER

      @waitForSelector "##{casper.DRIVER}", ->
        test.assertEvalEquals ->
          window._testText
        , "I have been set with #{casper.DRIVER}"
        , "#{casper.DRIVER} can run in web workers"
    else
      @evaluate (driver) ->
        runWith(driver)
      , casper.DRIVER

      @waitForSelector "##{casper.DRIVER}", ->
        test.assertEval ->
          window._testError is true
        , "#{casper.DRIVER_NAME} cannot run in web workers"

  casper.run ->
    test.done()
