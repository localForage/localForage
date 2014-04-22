'use strict'

casper.test.begin "Testing localforage configuration for #{casper.DRIVER_NAME}", (test) ->
  casper.start "#{casper.TEST_URL}test.config.html", ->
    test.info "Trying to set config values that are respected across drivers"

    test.assertEval ->
      localforage.config("name") is "localforage"
    , "config('name') returns a default config value"

    if casper.DRIVER_NAME is "IndexedDB"
      @evaluate ->
        localforage.setDriver "asyncStorage"

    if casper.DRIVER_NAME is "localStorage"
      @evaluate ->
        localforage.setDriver "localStorageWrapper"

    if casper.DRIVER_NAME is "WebSQL"
      @evaluate ->
        localforage.setDriver "webSQLStorage"

  casper.wait 250 # Lazy, whatever

  casper.then ->
    @evaluate ->
      localforage.config
        name: "myCoolApp"
        storeName: "storefront"
        version: 2.0

  casper.wait 250 # Lazy, whatever

  casper.then ->
    @evaluate ->
      localforage.setItem 'some key', 'some value', ->
        __utils__.findOne('.status').id = "key-is-set-in-db"

    @waitForSelector "#key-is-set-in-db", ->
      if casper.DRIVER_NAME is "IndexedDB"
        @evaluate ->
          localforage.setItem 'some key', 'some value', ->
            indexedDB = (indexedDB || window.indexedDB ||
                         window.webkitIndexedDB || window.mozIndexedDB ||
                         window.OIndexedDB || window.msIndexedDB)
            openreq = indexedDB.open("myCoolApp", 2.0)

            openreq.onsuccess = ->
              store = openreq.result.transaction("storefront", 'readonly').objectStore("storefront")

              req = store.get('some key')

              req.onsuccess = ->
                window._value = req.result
                __utils__.findOne('.status').id = "check-key"

        @waitForSelector "#check-key", ->
          test.assertEval ->
            window._value is "some value"
          , "asyncStorage places data in the proper database"

      if casper.DRIVER_NAME is "localStorage"
        test.assertEval ->
          JSON.parse(localStorage["myCoolApp/some key"]) is "some value"
        , "localStorageWrapper namespaces keys from config"

      if casper.DRIVER_NAME is "WebSQL"
        @evaluate ->
          window.openDatabase("myCoolApp", (2.0).toString(), "", 4980736).transaction (t) ->
            t.executeSql "SELECT * FROM storefront WHERE key = ? LIMIT 1", ['some key'], (t, results) ->
              window._result = JSON.parse(results.rows.item(0).value)
              __utils__.findOne('.status').id = "check-key"

        @waitForSelector "#check-key", ->
          test.assertEval ->
            window._result is 'some value'
          , "WebSQL database and table exists when config is set"

  casper.wait 150

  casper.then ->
    test.assertEval ->
      typeof localforage.config() is 'object'
    , "config() returns all config values"

    test.assertEval ->
      localforage.config("name") is "myCoolApp"
    , "config('name') returns a single config value"

    test.assertEval ->
      (localforage.config {name: "myNewApp"}).toString() is "Error: Can't call config() after localforage has been used."
    , "Config should return an Error after API calls have been made"

  casper.run ->
    test.done()
