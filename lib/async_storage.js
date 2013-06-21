/*jshint es5: true */
/**
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database. It creates a global asyncStorage object that has
 * methods like the localStorage object.
 *
 * To store a value use setItem:
 *
 *     asyncStorage.setItem('key', 'value');
 *
 * If you want confirmation that the value has been stored, pass a callback
 * function as the third argument:
 *
 *     asyncStorage.setItem('key', 'newvalue', function() {
 *         console.log('new value stored');
 *     });
 *
 * To read a value, call getItem(), but note that you must supply a callback
 * function that the value will be passed to asynchronously:
 *
 *     asyncStorage.getItem('key', function(value) {
 *         console.log('The value of key is:', value);
 *     });
 *
 * Note that unlike localStorage, asyncStorage does not allow you to store and
 * retrieve values by setting and querying properties directly. You cannot just
 * write asyncStorage.key; you have to explicitly call setItem() or getItem().
 *
 * removeItem(), clear(), length(), and key() are like the same-named methods of
 * localStorage, but, like getItem() and setItem() they take a callback
 * argument.
 *
 * The asynchronous nature of getItem() makes it tricky to retrieve multiple
 * values. But unlike localStorage, asyncStorage does not require the values you
 * store to be strings. So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 *
 * Unit tests are in apps/gallery/test/unit/asyncStorage_test.js
 */

define(function(require) {
    'use strict';

    // Constants for database types.
    var DB_TYPE_INDEXEDDB = 1;
    var DB_TYPE_LOCALSTORAGE = 2;
    var DB_TYPE_WEBSQL = 3; // Reserved for future use.
                            // We used the IndexedDB polyfill for now.

    // IndexedDB requires a database name, version, and store name (
    // analogous to a table name in an RDBMS like MySQL), so we set them as
    // constants here and never expose them to the developer.
    var DB_NAME = 'asyncStorage';
    var DB_VERSION = 1;
    var STORE_NAME = 'keyvaluepairs';

    // Initialize our db variable. We also create a global pointer to the DB
    // to keep it around and usable from the command-line.
    // TODO: Offer a way to disable the global variable.
    var db = window._asyncStorage;

    // Check for the database backend we're using. We prefer IndexedDB, then
    // localStorage. Default to using IndexedDB as our backend.
    var dbBackend = DB_TYPE_INDEXEDDB;

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // Initialize localStorage and create a variable to use throughout the code.
    var localStorage = window.localStorage;

    // If IndexedDB isn't supported on this platform, but there's WebSQL
    // support, try using that.
    //
    // Note: If you are building a packaged app for Firefox OS, or using a
    // CSP similar to the one mandated by Firefox OS packaged apps, you must
    // comment out/remove the `indexedDB = require('indexedDB');` line or
    // prevent your require build toolchain from including that file. It
    // contains CSP violations that will prevent your app from running on
    // Firefox OS.
    //
    // Packaged apps CSP can be found here:
    // https://developer.mozilla.org/docs/Web/Apps/CSP
    if (!indexedDB && (openDatabase || window.openDatabase)) {
        // indexedDB = require('indexeddb_shim');
        console.warn('Using WebSQL polyfill for IndexedDB transactions.');
    }

    // If IndexedDB _still_ isn't available, we'll fall back to localStorage.
    // Note that this will have considerable performance and storage
    // side-effects (all data will be serialized on save and only data that
    // can be converted to a string via `JSON.stringify()` will be saved).
    if (!indexedDB) {
        dbBackend = DB_TYPE_LOCALSTORAGE;
    }

    // Abstraction used to run any IndexedDB transaction. The type argument
    // is the type of IndexedDB transaction ("readonly" or "readwrite"), while
    // the `f` argument is the function to run using our IndexedDB database and
    // objectStore.
    function indexedTransaction(type, f) {
        // If the database already exists, just run the code!
        if (db) {
            f(db.transaction(STORE_NAME, type).objectStore(STORE_NAME));
        } else {
            // The database hasn't been initialized yet, so we'll load it now.
            var request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = _errorHandler(request, "Couldn't open database");

            // Handle the first time the database is accessed.
            request.onupgradeneeded = function withStoreOnUpgradeNeeded() {
                // First time setup: create an empty object store. This is only
                // done once, on first page load; afterward the database
                // already exists.
                request.result.createObjectStore(STORE_NAME);
            };

            // Once the database is opened, create a pointer to the database
            // and run the transaction.
            request.onsuccess = function withStoreOnSuccess() {
                db = request.result;
                indexedTransaction(type, f);
            };
        }
    }

    // Remove all keys from the datastore, effectively destroying all data in
    // the app's key/value store!
    function clear(callback) {
        switch (dbBackend) {
            case DB_TYPE_INDEXEDDB:
                indexedTransaction('readwrite', function clearBody(store) {
                    var request = store.clear();
                    if (callback) {
                        request.onsuccess = function clearOnSuccess() {
                            callback();
                        };
                    }
                    request.onerror = _errorHandler(request);
                });
                break;
            case DB_TYPE_LOCALSTORAGE:
                localStorage.clear();
                callback();
                break;
        }
    }

    // Retrieve an item from the store. Unlike the original async_storage
    // library in Gaia, we don't modify return values at all. If a key's value
    // is `undefined`, we pass that value to the callback function.
    function getItem(key, callback) {
        switch (dbBackend) {
            // Find the value for this key directly from IndexedDB and pass the
            // value to a callback function.
            case DB_TYPE_INDEXEDDB:
                indexedTransaction('readonly', function getItemBody(store) {
                    var request = store.get(key);

                    request.onsuccess = function getItemOnSuccess() {
                        callback(request.result);
                    };

                    request.onerror = _errorHandler(request);
                });
                break;
            // If we're using localStorage, we have to load the value from
            // localStorage, parse the JSON, and then send that value to the
            // callback function.
            case DB_TYPE_LOCALSTORAGE:
                var result = localStorage.getItem(key);

                // If a result was found, parse it from serialized JSON into a
                // JS object. If result isn't truthy, the key is likely
                // undefined and we'll pass it straight to the callback.
                if (result) {
                    result = JSON.parse(result);
                }

                callback(result);
                break;
        }
    }

    // Same as localStorage's key() method, except takes a callback.
    function key(n, callback) {
        switch (dbBackend) {
            case DB_TYPE_INDEXEDDB:
                if (n < 0) {
                    callback(null);
                    return;
                }

                indexedTransaction('readonly', function keyBody(store) {
                    var advanced = false;
                    var request = store.openCursor();
                    request.onsuccess = function keyOnSuccess() {
                        var cursor = req.result;
                        if (!cursor) {
                            // this means there weren't enough keys
                            callback(null);
                            return;
                        }
                        if (n === 0) {
                            // We have the first key, return it if that's what they wanted
                            callback(cursor.key);
                        } else {
                            if (!advanced) {
                                // Otherwise, ask the cursor to skip ahead n records
                                advanced = true;
                                cursor.advance(n);
                            } else {
                                // When we get here, we've got the nth key.
                                callback(cursor.key);
                            }
                        }
                    };

                    request.onerror = _errorHandler(request);
                });
                break;
            case DB_TYPE_LOCALSTORAGE:
                callback(localStorage.key(n));
                break;
        }
    }

    // Supply the number of keys in the datastore to the callback function.
    function length(callback) {
        switch (dbBackend) {
            case DB_TYPE_INDEXEDDB:
                indexedTransaction('readonly', function lengthBody(store) {
                    var request = store.count();
                    request.onsuccess = function lengthOnSuccess() {
                        callback(request.result);
                    };
                    request.onerror = _errorHandler(request);
                });
                break;
            case DB_TYPE_LOCALSTORAGE:
                callback(localStorage.length);
                break;
        }
    }

    // Remove an item from the store, nice and simple.
    function removeItem(key, callback) {
        switch (dbBackend) {
            case DB_TYPE_INDEXEDDB:
                indexedTransaction('readwrite', function removeItemBody(store) {
                    var request = store.delete(key);
                    if (callback) {
                        request.onsuccess = function removeItemOnSuccess() {
                            callback();
                        };
                    }
                    request.onerror = _errorHandler(request);
                });
                break;
            case DB_TYPE_LOCALSTORAGE:
                localStorage.removeItem(key);
                callback();
                break;
        }
    }

    // Set a key's value and run an optional callback once the value is set.
    // Unlike Gaia's implementation, the callback function is passed the value,
    // in case you want to operate on that value only after you're sure it
    // saved, or something like that.
    function setItem(key, value, callback) {
        switch (dbBackend) {
            case DB_TYPE_INDEXEDDB:
                indexedTransaction('readwrite', function setItemBody(store) {
                    var request = store.put(value, key);
                    if (callback) {
                        request.onsuccess = function setItemOnSuccess() {
                            callback(value);
                        };
                    }
                    request.onerror = _errorHandler(request);
                });
                break;
            case DB_TYPE_LOCALSTORAGE:
                try {
                    value = JSON.stringify(value);
                } catch (e) {
                    console.error("Couldn't convert value into a JSON string: ",
                                  value);
                }

                localStorage.setItem(key, value);
                callback(value);
                break;
        }
    }

    // Standard error handler for all IndexedDB transactions. Simply logs the
    // error to the console.
    function _errorHandler(request, errorText) {
        console.error((errorText || 'asyncStorage error') + ': ',
                      request.error.name);
    }

    return {
        // Default API, from Gaia.
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key,

        // Pretty, less-verbose API.
        get: getItem,
        set: setItem,
        remove: removeItem,
        removeAll: clear
    };
});
