'use strict'

casper.test.begin "Testing localForage driver selection", (test) ->
  casper.start "#{casper.TEST_URL}test.html", ->
    test.info "Testing using global scope (window.localForage)"

    test.assertEval ->
      typeof localForage.setDriver is 'function'
    , "localForage API includes option to set a driver explicitly"

    test.assertEval ->
      localForage.driver is "webSQLStorage"
    , "webSQLStorage should be loaded by default"

    test.assertEval ->
      localForage.setDriver "localStorageWrapper"

      localForage.driver is "localStorageWrapper"
    , "localStorageWrapper should be loaded after calling setDriver()"

  casper.thenOpen "#{casper.TEST_URL}test.require.html"

  casper.then ->
    test.info "Testing using require.js"

    test.assertEval ->
      window.localForage is undefined
    , 'localForage should not be available in the global context'

    @evaluate ->
      require ['localforage'], (localForage) ->
        window._localForageDriver = localForage.driver
        __utils__.findOne('.status').id = 'driver-found'

    @waitForSelector '#driver-found', ->
      test.assertEval ->
        window._localForageDriver is "webSQLStorage"
      , 'webSQLStorage should be loaded by default'

  casper.then ->
    @evaluate ->
      require ['localforage'], (localForage) ->
        localForage.setDriver 'localStorageWrapper', (localForage) ->
          window._localForageDriver = localForage.driver
          __utils__.findOne('.status').id = 'driver-set'

    @waitForSelector '#driver-set', ->
      test.assertEval ->
        window._localForageDriver is "localStorageWrapper"
      , "localStorage driver should be loaded after it's set"

  casper.run ->
    test.done()
