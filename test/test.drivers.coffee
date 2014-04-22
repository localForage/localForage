'use strict'

# We keep track of these, again, because we skip some tests and like for the
# numbers to add up/make sense.
NUMBER_OF_TESTS = 10

casper.test.begin "Testing localforage driver selection", NUMBER_OF_TESTS, (test) ->
  casper.start "#{casper.TEST_URL}test.html", ->
    test.info "Testing using global scope (window.localforage)"

    test.assertEval ->
      typeof localforage.setDriver is 'function'
    , "localforage API includes option to set a driver explicitly"

    test.assertEval ->
      typeof localforage.ready is 'function'
    , "localforage API includes option to check if driver is initiated"

    test.assertEval ->
      localforage.setDriver "localStorageWrapper"

      localforage.driver() is "localStorageWrapper"
    , "localStorageWrapper should be loaded after calling setDriver()"

  casper.thenOpen "#{casper.TEST_URL}test.require.html"

  casper.then ->
    test.info "Testing using require.js"

    test.assertEval ->
      window.localforage is undefined
    , 'localforage should not be available in the global context'

  casper.wait 1000 # This fixes a Travis CI bug. I hate it, but c'est la vie.

  # Unknown why, but slimerjs errors out here hardcore. It spits out:
  #
  #    FAIL SyntaxError: JSON.parse: unexpected character
  #         type: uncaughtError
  #         file: test/test.drivers.coffee
  #    [...]
  #
  # TODO: Fix and report this.
  unless casper.ENGINE is 'slimerjs'
    casper.then ->
      @evaluate ->
        require ['localforage'], (lf) ->
          window._localforage = lf

          lf.ready ->
            window._readyCallback = true

          lf.ready().then ->
            window._readyPromise = true
            __utils__.findOne('.status').id = 'lib-ready'

      @waitForSelector '#lib-ready', ->
        test.assertEval ->
          window._localforage isnt undefined
        , 'localforage should be available inside a define call'

        test.assertEval ->
          window._readyCallback is true
        , 'localforage ready() should accept a callback (for RequireJS context)'

        test.assertEval ->
          window._readyPromise is true
        , 'localforage ready() should return a Promise (for RequireJS context)'

    casper.then ->
      @evaluate ->
        require ['localforage'], (localforage) ->
          localforage.setDriver 'localStorageWrapper', (localforage) ->
            window._localforageDriver = localforage.driver()
            __utils__.findOne('.status').id = 'driver-set'

      @waitForSelector '#driver-set', ->
        test.assertEval ->
          window._localforageDriver is "localStorageWrapper"
        , "localStorage driver should be loaded after it's set"

    casper.then ->
      @evaluate ->
        require ['localforage'], (localforage) ->
          localforage.setDriver 'asyncStorage', (localforage) ->
            window._localforageDriver = localforage.driver()
            __utils__.findOne('.status').id = 'driver-attempt'

      @waitForSelector '#driver-attempt', ->
        test.assertEval ->
          window._localforageDriver isnt "asyncStorage"
        , "asyncStorage should not be loaded in WebKit"

    casper.thenOpen "#{casper.TEST_URL}test.requiremin.html"

    casper.wait 1000

    casper.then ->
      @evaluate ->
        require ['../dist/localforage.min'], (localforage) ->
          window._lf = localforage

    casper.wait 300

    casper.then ->
      test.assertEval ->
        typeof window._lf.driver is 'function' and
        typeof window._lf._initStorage is 'function' and
        typeof window._lf.getItem is 'function' and
        typeof window._lf.setItem is 'function' and
        typeof window._lf.clear is 'function' and
        typeof window._lf.length is 'function' and
        typeof window._lf.removeItem is 'function' and
        typeof window._lf.key is 'function'
      , "localforage API is available in localforage.min"
  else
    test.skip 6, "Skipping RequireJS tests in SlimerJS"

  casper.run ->
    test.done()
