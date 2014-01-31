'use strict'

casper.test.begin "Testing localStorage driver", 9, (test) ->
  casper.start "#{casper.TEST_URL}localstorage.html", ->
    test.info "Test API using callbacks"

    test.assertEval ->
      localForage.driver is 'localStorageWrapper'
    , 'localStorage driver is active (forcing localStorage works)'

    test.assertEval ->
      typeof localForage.getItem is 'function' and
      typeof localForage.setItem is 'function' and
      typeof localForage.clear is 'function' and
      typeof localForage.length is 'function' and
      typeof localForage.removeItem is 'function' and
      typeof localForage.key is 'function'
    , 'localStorage API is available'

  casper.then ->
    @evaluate ->
      localForage.length (length) ->
        window._testLength = length
        __utils__.findOne('.status').id = 'zero-length'

    @waitForSelector '#zero-length', ->
      test.assertEval ->
        window._testLength is 0
      , 'Length is zero at start of test'

  casper.then ->
    @evaluate ->
      localForage.getItem 'non-existant', (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'no-key-found-test'

    @waitForSelector '#no-key-found-test', ->
      test.assertEval ->
        window._testValue is null
      , 'localStorage returns undefined for non-existant key'

  casper.then ->
    @evaluate ->
      localForage.setItem 'officeName', 'Initech', (value) ->
        window._callbackReturnValue = value
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      test.assertEval ->
        window._callbackReturnValue is "Initech"
      , 'Set a value and passes it to the callback'

  casper.then ->
    @evaluate ->
      localForage.getItem 'officeName', (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is "Initech"
      , 'Get a previously set value'

  casper.then ->
    @evaluate ->
      localForage.length (length) ->
        window._testLength = length
        __utils__.findOne('.status').id = 'non-zero-length'

    @waitForSelector '#non-zero-length', ->
      test.assertEval ->
        window._testLength > 0
      , 'Length is greater than zero after values are saved'

  casper.then ->
    @evaluate ->
      localForage.setItem 'numberOfUnhappyEmployees', 3, ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localForage.getItem 'numberOfUnhappyEmployees', (number) ->
          window._testValue = number
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is 3 and typeof window._testValue isnt 'string'
      , 'Store and retrieve a value that is not of type "String"'

  casper.then ->
    @evaluate ->
      localForage.setItem 'namesOfUnhappyEmployees', ['Peter', 'Michael', 'Samir'], ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localForage.getItem 'namesOfUnhappyEmployees', (array) ->
          window._testValue = array
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue.length is 3 and window._testValue[1] is 'Michael'
      , 'Store and retrieve an array without modification'

  casper.run ->
    test.done()
