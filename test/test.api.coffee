'use strict'

# These tests are run for each possible browser/driver combo. Current, that's:
#
#  * Gecko with IndexedDB
#  * Gecko with localStorage
#  * WebKit with localStorage
#  * WebKit with WebSQL
#
# Because of CasperJS's lack of (to my knowledge) async testing utilies, we do
# some weird stuff with `waitForSelector()` to wait for callbacks/promises to
# be fulfilled. The `__utils__` class seen inside the `assertEval()` and
# `evaluate()` calls is a helper class injected into the test DOM by CasperJS.
# You can read more about it here:
# http://docs.casperjs.org/en/latest/faq.html#what-s-this-mysterious-utils-object
casper.test.begin "Testing #{casper.DRIVER_NAME} driver", (test) ->
  casper.start "#{casper.TEST_URL}#{casper.URL}.html", ->
    test.info "Test API using callbacks"

    test.assertEval ->
      typeof localforage.driver is 'string' and
      typeof localforage._initStorage is 'function' and
      typeof localforage.getItem is 'function' and
      typeof localforage.setItem is 'function' and
      typeof localforage.clear is 'function' and
      typeof localforage.length is 'function' and
      typeof localforage.removeItem is 'function' and
      typeof localforage.key is 'function'
    , "localforage API is consistent between drivers"

    test.assertEvalEquals ->
      localforage.driver
    , casper.DRIVER, "#{casper.DRIVER} driver is active"

    test.assertEval ->
      typeof localforage.getItem is 'function' and
      typeof localforage.setItem is 'function' and
      typeof localforage.clear is 'function' and
      typeof localforage.length is 'function' and
      typeof localforage.removeItem is 'function' and
      typeof localforage.key is 'function'
    , "localStorage API is available using #{casper.DRIVER}"

  casper.then ->
    @evaluate ->
      localforage.clear()

  casper.wait 300

  casper.then ->
    @evaluate ->
      localforage.length (length) ->
        window._testLength = length
        __utils__.findOne('.status').id = 'start-test'

    @waitForSelector '#start-test', ->
      test.assertEval ->
        window._testLength is 0
      , 'Length is zero at start of test'

  casper.then ->
    @evaluate ->
      localforage.clear ->
        localforage.length (length) ->
          window._testLength = length
          __utils__.findOne('.status').id = 'clear-callback'

    @waitForSelector '#clear-callback', ->
      test.assertEval ->
        window._testLength is 0
      , 'clear() runs callback after completed'

  # https://github.com/mozilla/localforage/pull/24#discussion-diff-9389662R158
  # localStorage's method API (`localStorage.getItem('foo')`) returns "null"
  # for undefined keys, even though its getter/setter API (`localStorage.foo`)
  # returns `undefined` for the same key. Gaia's asyncStorage API, which is
  # based on localStorage and upon which localforage is based, ALSO returns
  # `null`. BLARG! So for now, we just return null, because there's no way to
  # know from localStorage if the key is ACTUALLY `null` or undefined but
  # returning `null`. And returning `undefined` here would break compatibility
  # with localStorage fallback. Maybe in the future we won't care...
  casper.then ->
    @evaluate ->
      localforage.getItem 'non-existant', (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'no-key-found-test'

    @waitForSelector '#no-key-found-test', ->
      test.assertEval ->
        window._testValue is null
      , 'getItem() returns null for non-existant key'

  casper.then ->
    @evaluate ->
      localforage.key 0, (value) ->
        window._testKey = value
        __utils__.findOne('.status').id = 'check-for-key-return'

    @waitForSelector '#check-for-key-return', ->
      test.assertEval ->
        window._testKey is null
      , "key() returns null when when key index doesn't exist"

  casper.then ->
    @evaluate ->
      localforage.setItem 'officeName', 'Initech', (value) ->
        window._callbackReturnValue = value
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      test.assertEval ->
        window._callbackReturnValue is "Initech"
      , 'Set a value and pass it to the callback'

  casper.then ->
    @evaluate ->
      localforage.getItem 'officeName', (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is "Initech"
      , 'Get a previously set value'

  casper.then ->
    @evaluate ->
      localforage.key 0, (value) ->
        window._testKey = value
        __utils__.findOne('.status').id = 'check-for-set-key'

    @waitForSelector '#check-for-set-key', ->
      test.assertEval ->
        window._testKey is 'officeName'
      , "key() returns name of key after one is saved"

  casper.then ->
    @evaluate ->
      localforage.removeItem 'officeName', ->
        __utils__.findOne('.status').id = 'value-removed'

    @waitForSelector '#value-removed', ->
      @evaluate ->
        localforage.getItem 'officeName', (value) ->
          window._testValue = value
          __utils__.findOne('.status').id = 'removed-value-obtained'

    @waitForSelector '#removed-value-obtained', ->
      test.assertEval ->
        window._testValue is null
      , 'removeItem() removes a key and its value'

  casper.then ->
    @evaluate ->
      localforage.setItem 'numberOfUnhappyEmployees', 3, ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localforage.getItem 'numberOfUnhappyEmployees', (number) ->
          window._testValue = number
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is 3 and typeof window._testValue isnt 'string'
      , 'Store and retrieve a value that is not of type "String"'

  casper.then ->
    @evaluate ->
      localforage.setItem 'namesOfUnhappyEmployees', ['Peter', 'Michael', 'Samir'], ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localforage.getItem 'namesOfUnhappyEmployees', (array) ->
          window._testValue = array
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue.length is 3 and window._testValue[1] is 'Michael'
      , 'Store and retrieve an array without modification'

  casper.then ->
    @evaluate ->
      localforage.length (length) ->
        window._testLength = length
        __utils__.findOne('.status').id = 'non-zero-length'

    @waitForSelector '#non-zero-length', ->
      test.assertEval ->
        window._testLength > 0
      , 'Length is greater than zero after values are saved'

  casper.then ->
    @evaluate ->
      localforage.clear ->
        localforage.length (length) ->
          window._clearedLength = length
          __utils__.findOne('.status').id = 'cleared'

    @waitForSelector '#cleared', ->
      test.assertEval ->
        window._clearedLength is 0
      , 'clear() erases all values'

  # https://github.com/mozilla/localForage/pull/42
  # Because of limitations of localStorage, we don't allow `undefined` to be
  # saved or returned.
  casper.then ->
    @evaluate ->
      localforage.setItem 'undefined', undefined, (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'undefined-test'

    @waitForSelector '#undefined-test', ->
      test.assertEval ->
        window._testValue is null and
        window._testValue isnt undefined
      , 'setItem() returns null for undefined'

  # Start the Promises testing!
  casper.then ->
    test.info "Test API using Promises"

    @evaluate ->
      localforage.clear()

  casper.wait 300

  casper.then ->
    @evaluate ->
      localforage.clear ->
        localforage.length (length) ->
          window._testLength = length
          __utils__.findOne('.status').id = 'start-test'

    @waitForSelector '#start-test', ->
      test.assertEval ->
        window._testLength is 0
      , 'Length is zero at start of test'

  casper.then ->
    @evaluate ->
      localforage.getItem('non-existant').then (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'no-key-found-test'

    @waitForSelector '#no-key-found-test', ->
      test.assertEval ->
        window._testValue is null
      , 'localStorage returns undefined for non-existant key'

  casper.then ->
    @evaluate ->
      localforage.setItem( 'officeName', 'Initech').then (value) ->
        window._callbackReturnValue = value
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      test.assertEval ->
        window._callbackReturnValue is "Initech"
      , 'Set a value and pass it to the callback'

  casper.then ->
    @evaluate ->
      localforage.getItem('officeName').then (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is "Initech"
      , 'Get a previously set value'

  casper.then ->
    @evaluate ->
      localforage.setItem('numberOfUnhappyEmployees', 3).then ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localforage.getItem('numberOfUnhappyEmployees').then (number) ->
          window._testValue = number
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue is 3 and typeof window._testValue isnt 'string'
      , 'Store and retrieve a value that is not of type "String"'

  casper.then ->
    @evaluate ->
      localforage.setItem('namesOfUnhappyEmployees', ['Peter', 'Michael', 'Samir']).then ->
        window._testValue = null
        __utils__.findOne('.status').id = 'value-set'

    @waitForSelector '#value-set', ->
      @evaluate ->
        localforage.getItem('namesOfUnhappyEmployees').then (array) ->
          window._testValue = array
          __utils__.findOne('.status').id = 'value-obtained'

    @waitForSelector '#value-obtained', ->
      test.assertEval ->
        window._testValue.length is 3 and window._testValue[1] is 'Michael'
      , 'Store and retrieve an array without modification'

  casper.then ->
    @evaluate ->
      localforage.length().then (length) ->
        window._testLength = length
        __utils__.findOne('.status').id = 'non-zero-length'

    @waitForSelector '#non-zero-length', ->
      test.assertEval ->
        window._testLength > 0
      , 'Length is greater than zero after values are saved'

  casper.then ->
    @evaluate ->
      localforage.clear().then localforage.length().then (length) ->
        window._clearedLength = length
        __utils__.findOne('.status').id = 'cleared'

    @waitForSelector '#cleared', ->
      test.assertEval ->
        window._clearedLength is 0
      , 'clear() erases all values'

  # https://github.com/mozilla/localForage/pull/42
  # Because of limitations of localStorage, we don't allow `undefined` to be
  # saved or returned.
  casper.then ->
    @evaluate ->
      localforage.setItem('undefined', undefined).then (value) ->
        window._testValue = value
        __utils__.findOne('.status').id = 'undefined-test'

    @waitForSelector '#undefined-test', ->
      test.assertEval ->
        window._testValue is null and
        window._testValue isnt undefined
      , 'setItem() returns null for undefined'

  casper.thenOpen "#{casper.TEST_URL}test.min.html", ->
    test.info "Test minified version"

    test.assertEval ->
      typeof localforage.driver is 'string' and
      typeof localforage._initStorage is 'function' and
      typeof localforage.getItem is 'function' and
      typeof localforage.setItem is 'function' and
      typeof localforage.clear is 'function' and
      typeof localforage.length is 'function' and
      typeof localforage.removeItem is 'function' and
      typeof localforage.key is 'function'
    , "Minified version has localforage API intact"

  casper.run ->
    test.done()
