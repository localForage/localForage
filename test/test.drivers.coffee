'use strict'

casper.test.begin "Testing localforage driver selection", (test) ->
  casper.start "#{casper.TEST_URL}test.html", ->
    test.info "Testing using global scope (window.localforage)"

    test.assertEval ->
      typeof localforage.setDriver is 'function'
    , "localforage API includes option to set a driver explicitly"

    test.assertEval ->
      localforage.driver is "webSQLStorage"
    , "webSQLStorage should be loaded by default"

    test.assertEval ->
      localforage.setDriver "localStorageWrapper"

      localforage.driver is "localStorageWrapper"
    , "localStorageWrapper should be loaded after calling setDriver()"

  casper.thenOpen "#{casper.TEST_URL}test.require.html"

  casper.then ->
    test.info "Testing using require.js"

    test.assertEval ->
      window.localforage is undefined
    , 'localforage should not be available in the global context'

  casper.then ->
    @evaluate ->
      require ['localforage'], (localforage) ->
        window._localforageDriver = localforage.driver
        __utils__.findOne('.status').id = 'driver-found'

    @waitForSelector '#driver-found', ->
      test.assertEval ->
        window._localforageDriver is "webSQLStorage"
      , 'webSQLStorage should be loaded by default'

  casper.then ->
    @evaluate ->
      require ['localforage'], (localforage) ->
        localforage.setDriver 'localStorageWrapper', (localforage) ->
          window._localforageDriver = localforage.driver
          __utils__.findOne('.status').id = 'driver-set'

    @waitForSelector '#driver-set', ->
      test.assertEval ->
        window._localforageDriver is "localStorageWrapper"
      , "localStorage driver should be loaded after it's set"

  casper.then ->
    @evaluate ->
      require ['localforage'], (localforage) ->
        localforage.setDriver 'asyncStorage', (localforage) ->
          window._localforageDriver = localforage.driver
          __utils__.findOne('.status').id = 'driver-attempt'

    @waitForSelector '#driver-attempt', ->
      test.assertEval ->
        window._localforageDriver isnt "asyncStorage"
      , "asyncStorage should not be loaded in WebKit"

  casper.run ->
    test.done()
