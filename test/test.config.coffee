'use strict'

casper.test.begin "Testing localforage configuration for #{casper.DRIVER_NAME}", (test) ->
  casper.start "#{casper.TEST_URL}test.config.html", ->
    test.info "Trying to set config values that are respected across drivers"

    if casper.DRIVER_NAME is "IndexedDB"
      @evaluate ->
        localforage.setDriver "asyncStorage"

    if casper.DRIVER_NAME is "localStorage"
      @evaluate ->
        localforage.setDriver "localStorageWrapper"

    if casper.DRIVER_NAME is "WebSQL"
      @evaluate ->
        localforage.setDriver "webSQLStorage"

  casper.wait 350 # Lazy, whatever

  casper.then ->
    @evaluate ->
      localforage.setItem 'some key', 'some value', ->
        __utils__.findOne('.status').id = "key-is-set-in-db"

    @waitForSelector "#key-is-set-in-db", ->
      if casper.DRIVER_NAME is "IndexedDB"
        @evaluate ->
          localforage.setItem 'some key', 'some value', ->
            indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
            openreq = indexedDB.open(window.localForageConfig.name, window.localForageConfig.version)

            openreq.onsuccess = ->
              store = openreq.result.transaction(window.localForageConfig.storeName, 'readonly').objectStore(window.localForageConfig.storeName)

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
          JSON.parse(localStorage["#{window.localForageConfig.name}/some key"]) is "some value"
        , "localStorageWrapper namespaces keys from config"

      if casper.DRIVER_NAME is "WebSQL"
        @evaluate ->
          window.openDatabase(window.localForageConfig.name, window.localForageConfig.version.toString(), "", 4980736).transaction (t) ->
            t.executeSql "SELECT * FROM #{window.localForageConfig.storeName} WHERE key = ? LIMIT 1", ['some key'], (t, results) ->
              window._result = results.rows.item(0).value
              __utils__.findOne('.status').id = "check-key"

        @waitForSelector "#check-key", ->
          test.assertEval ->
            window._result is 'some value'
          , "WebSQL database and table exists when config is set"

  casper.run ->
    test.done()
