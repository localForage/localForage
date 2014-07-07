'use strict'

casper.test.begin "Testing localforage when no driver is available", (test) ->
  casper.start "#{casper.TEST_URL}nodriver.html", ->
    test.info "Test no driver configuration"

    casper.then ->
      test.assertEval ->
        !localforage.supports localforage.INDEXEDDB and
        !localforage.supports localforage.LOCALSTORAGE and
        !localforage.supports localforage.WEBSQL
      , 'supports() should return false for all drivers'

    casper.then ->
      @evaluate ->
        window._localforageDriver = localforage.driver()
        __utils__.findOne('.status').id = 'driver-set'

      @waitForSelector '#driver-set', ->
        test.assertEval ->
          window._localforageDriver is null
        , 'driver() should return null'

    casper.then ->
      @evaluate ->
        localforage.ready (err) ->
          window._callbackReturnValue = err
          __utils__.findOne('.status').id = 'value-set'

      @waitForSelector '#value-set', ->
        test.assertEval ->
          window._callbackReturnValue instanceof Error and
          window._callbackReturnValue.message == 'No available storage method found.'
        , 'the callback provided to ready(), should be called with a rejected promise'

    casper.then ->
      @evaluate ->
        localforage.ready()
          .then null, (err) ->
            window._callbackReturnValue = err
            __utils__.findOne('.status').id = 'value-set'

      @waitForSelector '#value-set', ->
        test.assertEval ->
          window._callbackReturnValue instanceof Error and
          window._callbackReturnValue.message == 'No available storage method found.'
        , 'ready().then() Promise should be rejected'


    casper.then ->
      @evaluate ->
        localforage.ready ->
          window._rejectedCount = 0

          localforage.setDriver(localforage.INDEXEDDB)
            .then null, () ->
              window._rejectedCount += 1
              if window._rejectedCount == 3
                __utils__.findOne('.status').id = 'value-set'

          localforage.setDriver(localforage.LOCALSTORAGE)
            .then null, () ->
              window._rejectedCount += 1
              if window._rejectedCount == 3
                __utils__.findOne('.status').id = 'value-set'

          localforage.setDriver(localforage.WEBSQL)
            .then null, () ->
              window._rejectedCount += 1
              if window._rejectedCount == 3
                __utils__.findOne('.status').id = 'value-set'


      @waitForSelector '#value-set', ->
        test.assertEval ->
          window._rejectedCount is 3
        , 'setDriver() Promise should be rejected'


    casper.then ->
      @evaluate ->
        localforage.ready ->
          window._hasAnyDriverMethodSet = false or
            localforage.getItem isnt undefined or
            localforage.setItem isnt undefined or
            localforage.removeItem isnt undefined or
            localforage.clear isnt undefined or
            localforage.length isnt undefined or
            localforage.key isnt undefined or
            localforage.keys isnt undefined
          __utils__.findOne('.status').id = 'value-set'


      @waitForSelector '#value-set', ->
        test.assertEval ->
          window._hasAnyDriverMethodSet is false
        , 'driver specific methods should be undefined'

  casper.run ->
    test.done()
