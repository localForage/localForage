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
#
# Note the number of tests constant: we run this to make sure all async tests
# are run and also that we're keeping track of skipped tests. Be sure to
# increment the number when you add tests.
NUMBER_OF_TESTS = 42

casper.test.begin "Testing #{casper.DRIVER_NAME} driver", NUMBER_OF_TESTS, (test) ->
  casper.start "#{casper.TEST_URL}#{casper.URL}.html", ->
    test.info "Test API using callbacks"

    # If this test is failing, you are likely missing the Promises polyfill,
    # installed via bower. Read more here:
    # https://github.com/mozilla/localForage#working-on-localforage
    test.assertEval ->
      typeof window.Promise is 'function'
    , "Promise API is available (if missing, run `bower install`)"

    test.assertEval ->
      typeof localforage.driver is 'function' and
      typeof localforage._initStorage is 'function' and
      typeof localforage.getItem is 'function' and
      typeof localforage.setItem is 'function' and
      typeof localforage.clear is 'function' and
      typeof localforage.length is 'function' and
      typeof localforage.removeItem is 'function' and
      typeof localforage.key is 'function'
    , "localforage API is consistent between drivers"

    test.assertEvalEquals ->
      localforage.driver()
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

  # Test against https://github.com/mozilla/localForage/issues/63
  casper.then ->
    @evaluate ->
      localforage.setItem 'naughtyValue', "'__lfsc__:hello world", ->
        __utils__.findOne('.status').id = 'serialized-key-set'

    @waitForSelector "#serialized-key-set", ->
      @evaluate ->
        localforage.getItem 'naughtyValue', (naughtyValue) ->
          window._badValue = naughtyValue
          __utils__.findOne('.status').id = 'serialized-key-get'

    @waitForSelector "#serialized-key-get", ->
      test.assertEval ->
        window._badValue is "'__lfsc__:hello world"
      , "Values with the serialized key marker should be saved and retrieved properly."

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
        __utils__.findOne('.status').id = 'undefined-test-callback'

    @waitForSelector '#undefined-test-callback', ->
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
      localforage.setItem('officeName', 'Initech').then (value) ->
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

  # ArrayBuffer
  casper.then ->
    # Test that all types of binary data are saved and retrieved properly.
    test.info "Testing binary data types"

    @evaluate ->
      request = new XMLHttpRequest()

      # Let's get the first user's photo.
      request.open "GET", "photo.jpg", true
      request.responseType = "arraybuffer"

      # When the AJAX state changes, save the photo locally.
      request.addEventListener "readystatechange", ->
        if request.readyState == 4 # readyState DONE
          # Reference ArrayBuffer and Blob data.
          window._ab = request.response

          localforage.setItem "arrayBuffer", request.response, ->
            localforage.getItem "arrayBuffer", (ab) ->
              window._abFromLF = ab
              __utils__.findOne('.status').id = 'arraybuffer'

      request.send()

    @waitForSelector '#arraybuffer', ->
      test.assertEval ->
        window._abFromLF.toString() is '[object ArrayBuffer]'
      , 'getItem() for ArrayBuffer returns value of type ArrayBuffer'

      test.assertEval ->
        window._abFromLF.byteLength is window._ab.byteLength
      , 'ArrayBuffer can be saved and retrieved properly'

  # Blob Data (these tests fail very specifically in PhantomJS, but not in
  # Safari).
  #
  # TODO: Find out why.
  casper.then ->
    unless casper.ENGINE is 'phantomjs'
      @evaluate ->
        request = new XMLHttpRequest()

        # Let's get the first user's photo.
        request.open "GET", "photo.jpg", true
        request.responseType = "arraybuffer"

        # When the AJAX state changes, save the photo locally.
        request.addEventListener "readystatechange", ->
          if request.readyState == 4 # readyState DONE
            # Refernce ArrayBuffer and Blob data.
            window._blob = new Blob([request.response])

            localforage.setItem "blob", window._blob, ->
              localforage.getItem "blob", (blob) ->
                window._blobFromLF = blob
                __utils__.findOne('.status').id = 'blob'

        request.send()

      @waitForSelector '#blob', ->
        test.assertEval ->
          window._blob.toString() is '[object Blob]'
        , 'getItem() for Blob returns value of type Blob'

        test.assertEval ->
          window._blob.size is window._blobFromLF.size
        , 'Blob can be saved and retrieved properly'
    else
      test.skip 2, "Skipping Blob tests in PhantomJS"

  # Int8Array
  casper.then ->
    @evaluate ->
      array = new Int8Array(8)
      array[2] = 65
      array[4] = 0
      localforage.setItem('Int8Array', array).then (writeValue) ->
        localforage.getItem('Int8Array').then (readValue) ->
          window._testValue = readValue
          __utils__.findOne('.status').id = 'Int8Array'

    @waitForSelector '#Int8Array', ->
      test.assertEval ->
        window._testValue.toString() is '[object Int8Array]'
      , 'setItem() and getItem() for Int8Array returns value of type Int8Array'

      test.assertEval ->
        window._testValue[2] is 65 and
        window._testValue[4] is 0
      , 'Int8Array can be saved and retrieved properly'

  # Uint8Array
  casper.then ->
    @evaluate ->
      array = new Uint8Array(8)
      array[0] = 65
      array[4] = 0
      localforage.setItem('Uint8Array', array).then (writeValue) ->
        localforage.getItem('Uint8Array').then (readValue) ->
          window._testValue = readValue
          __utils__.findOne('.status').id = 'Uint8Array'

    @waitForSelector '#Uint8Array', ->
      test.assertEval ->
        window._testValue.toString() is '[object Uint8Array]'
      , 'setItem() and getItem() for Uint8Array returns value of type Uint8Array'

      test.assertEval ->
        window._testValue[0] is 65 and
        window._testValue[4] is 0
      , 'Uinit8Array can be saved and retrieved properly'

  # Uint8ClampedArray
  # phantomjs/casperjs seems to see the Uint8ClampedArray as an Uint8Array,
  # not sure why.
  # casper.then ->
  #   @evaluate ->
  #     array = new Uint8ClampedArray(3)
  #     array[0] = -17
  #     array[1] = 93
  #     array[2] = 350
  #     localforage.setItem('Uint8ClampedArray', array).then (writeValue) ->
  #       localforage.getItem('Uint8ClampedArray').then (readValue) ->
  #         window._testValue = readValue
  #         __utils__.findOne('.status').id = 'Uint8ClampedArray'

  # casper.then ->
  #   test.assertEval ->
  #     window._testValue.toString() is '[object Uint8ClampedArray]'
  #   , 'setItem() and getItem() for Uint8ClampedArray returns value of type Uint8ClampedArray'

  #   test.assertEval ->
  #     window._testValue[0] is 0 and
  #     window._testValue[1] is 93 and
  #     window._testValue[2] is 255
  #   , 'Uinit8Array can be saved and retrieved properly'

  # Int16Array
  casper.then ->
    @evaluate ->
      array = new Int16Array(8)
      array[0] = 65
      array[4] = 0
      localforage.setItem('Int16Array', array).then (writeValue) ->
        localforage.getItem('Int16Array').then (readValue) ->
          window._testValue = readValue
          __utils__.findOne('.status').id = 'Int16Array'

    @waitForSelector '#Int16Array', ->
      test.assertEval ->
        window._testValue.toString() is '[object Int16Array]'
      , 'setItem() and getItem() for Int16Array returns value of type Int16Array'

      test.assertEval ->
        window._testValue[0] is 65 and
        window._testValue[4] is 0
      , 'Int16Array can be saved and retrieved properly'

  # Uint8Array
  casper.then ->
    @evaluate ->
      array = new Uint8Array(8)
      array[0] = 65
      array[4] = 0
      localforage.setItem('Uint8Array', array).then (writeValue) ->
        localforage.getItem('Uint8Array').then (readValue) ->
          window._testValue = readValue
          __utils__.findOne('.status').id = 'Uint8Array'

    @waitForSelector '#Uint8Array', ->
      test.assertEval ->
        window._testValue.toString() is '[object Uint8Array]'
      , 'setItem() and getItem() for Uint8Array returns value of type Uint8Array'

      test.assertEval ->
        window._testValue[0] is 65 and
        window._testValue[4] is 0
      , 'Uinit8Array can be saved and retrieved properly'

  # Uint16Array
  casper.then ->
    @evaluate ->
      array = new Uint16Array(8)
      array[0] = 65
      array[4] = 0
      localforage.setItem('Uint16Array', array).then (writeValue) ->
        localforage.getItem('Uint16Array').then (readValue) ->
          window._testValue = readValue
          __utils__.findOne('.status').id = 'Uint16Array'

    @waitForSelector '#Uint16Array', ->
      test.assertEval ->
        window._testValue.toString() is '[object Uint16Array]'
      , 'setItem() and getItem() for Uint16Array returns value of type Uint16Array'

      test.assertEval ->
        window._testValue[0] is 65 and
        window._testValue[4] is 0
      , 'Uint16Array can be saved and retrieved properly'

  # casper.then ->
  #   @evaluate ->
  #     array = new Uint8Array(8)
  #     array[0] = 65
  #     array[4] = 0
  #     localforage.setItem 'Uint8Array', array, (writeValue) ->
  #       localforage.getItem 'Uint8Array', (readValue) ->
  #         window._testValue = readValue
  #         __utils__.findOne('.status').id = 'Uint8Array-test-callback'

  #   @waitForSelector '#Uint8Array-test-callback', ->
  #     test.assertEval ->
  #       window._testValue.toString() is '[object Uint8Array]'
  #     , 'setItem() and getItem() for Uint8Array returns value of type Uint8Array'

  #     test.assertEval ->
  #       window._testValue[0] is 65 and
  #       window._testValue[4] is 0
  #     , 'setItem() and getItem() for Uint8Array returns same values again'

  casper.thenOpen "#{casper.TEST_URL}test.min.html", ->
    test.info "Test minified version"

    test.assertEval ->
      typeof localforage.driver is 'function' and
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
