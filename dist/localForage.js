(function() {
/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database.  It creates a global asyncStorage object that has
 * methods like the localStorage object.
 *
 * To store a value use setItem:
 *
 *   asyncStorage.setItem('key', 'value');
 *
 * If you want confirmation that the value has been stored, pass a callback
 * function as the third argument:
 *
 *  asyncStorage.setItem('key', 'newvalue', function() {
 *    console.log('new value stored');
 *  });
 *
 * To read a value, call getItem(), but note that you must supply a callback
 * function that the value will be passed to asynchronously:
 *
 *  asyncStorage.getItem('key', function(value) {
 *    console.log('The value of key is:', value);
 *  });
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
 * store to be strings.  So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 *
 * Unit tests are in apps/gallery/test/unit/asyncStorage_test.js
 */

// this.asyncStorage = (function() {

  var DBNAME = 'asyncStorage';
  var DBVERSION = 1;
  var STORENAME = 'keyvaluepairs';
  var db = null;

  function withStore(type, f) {
    if (db) {
      f(db.transaction(STORENAME, type).objectStore(STORENAME));
    } else {
      var openreq = indexedDB.open(DBNAME, DBVERSION);
      openreq.onerror = function withStoreOnError() {
        console.error("asyncStorage: can't open database:", openreq.error.name);
      };
      openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
        // First time setup: create an empty object store
        openreq.result.createObjectStore(STORENAME);
      };
      openreq.onsuccess = function withStoreOnSuccess() {
        db = openreq.result;
        f(db.transaction(STORENAME, type).objectStore(STORENAME));
      };
    }
  }

  function getItem(key, callback) {
    withStore('readonly', function getItemBody(store) {
      var req = store.get(key);
      req.onsuccess = function getItemOnSuccess() {
        var value = req.result;
        if (value === undefined)
          value = null;
        callback(value);
      };
      req.onerror = function getItemOnError() {
        console.error('Error in asyncStorage.getItem(): ', req.error.name);
      };
    });
  }

  function setItem(key, value, callback) {
    withStore('readwrite', function setItemBody(store) {
      var req = store.put(value, key);
      if (callback) {
        req.onsuccess = function setItemOnSuccess() {
          callback();
        };
      }
      req.onerror = function setItemOnError() {
        console.error('Error in asyncStorage.setItem(): ', req.error.name);
      };
    });
  }

  function removeItem(key, callback) {
    withStore('readwrite', function removeItemBody(store) {
      var req = store.delete(key);
      if (callback) {
        req.onsuccess = function removeItemOnSuccess() {
          callback();
        };
      }
      req.onerror = function removeItemOnError() {
        console.error('Error in asyncStorage.removeItem(): ', req.error.name);
      };
    });
  }

  function clear(callback) {
    withStore('readwrite', function clearBody(store) {
      var req = store.clear();
      if (callback) {
        req.onsuccess = function clearOnSuccess() {
          callback();
        };
      }
      req.onerror = function clearOnError() {
        console.error('Error in asyncStorage.clear(): ', req.error.name);
      };
    });
  }

  function length(callback) {
    withStore('readonly', function lengthBody(store) {
      var req = store.count();
      req.onsuccess = function lengthOnSuccess() {
        callback(req.result);
      };
      req.onerror = function lengthOnError() {
        console.error('Error in asyncStorage.length(): ', req.error.name);
      };
    });
  }

  function key(n, callback) {
    if (n < 0) {
      callback(null);
      return;
    }

    withStore('readonly', function keyBody(store) {
      var advanced = false;
      var req = store.openCursor();
      req.onsuccess = function keyOnSuccess() {
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
      req.onerror = function keyOnError() {
        console.error('Error in asyncStorage.key(): ', req.error.name);
      };
    });
  }

  var asyncStorage = {
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key
  };

  if(typeof define === 'function' && define.amd) {
    define(function() { return asyncStorage; });
  } else if(typeof module !== 'undefined' && module.exports) {
    module.exports = asyncStorage;
  } else {
    this.asyncStorage = asyncStorage;
  }


}).call(this);
(function() {

    'use strict';

    // Initialize localStorage and create a variable to use throughout the code.
    var localStorage = window.localStorage;

    
    // If IndexedDB isn't available, we'll fall back to localStorage.
    // Note that this will have considerable performance and storage
    // side-effects (all data will be serialized on save and only data that
    // can be converted to a string via `JSON.stringify()` will be saved).
    // Remove all keys from the datastore, effectively destroying all data in
    // the app's key/value store!
    function clear(callback) {
        localStorage.clear();
        if (callback) {
            callback();
        }
    }

    // Retrieve an item from the store. Unlike the original async_storage
    // library in Gaia, we don't modify return values at all. If a key's value
    // is `undefined`, we pass that value to the callback function.
    function getItem(key, callback) {
        var result = localStorage.getItem(key);

        // If a result was found, parse it from serialized JSON into a
        // JS object. If result isn't truthy, the key is likely
        // undefined and we'll pass it straight to the callback.
        if (result) {
            result = JSON.parse(result);
        }

        if (callback) {
            callback(result);
        }
    }

    // Same as localStorage's key() method, except takes a callback.
    function key(n, callback) {
        if (callback) {
            callback(localStorage.key(n));
        }
    }

    // Supply the number of keys in the datastore to the callback function.
    function length(callback) {
        if (callback) {
            callback(localStorage.length);
        }
    }

    // Remove an item from the store, nice and simple.
    function removeItem(key, callback) {
        localStorage.removeItem(key);
        if (callback) {
            callback();
        }
    }

    // Set a key's value and run an optional callback once the value is set.
    // Unlike Gaia's implementation, the callback function is passed the value,
    // in case you want to operate on that value only after you're sure it
    // saved, or something like that.
    function setItem(key, value, callback) {
        try {
            value = JSON.stringify(value);
        } catch (e) {
            console.error("Couldn't convert value into a JSON string: ",
                          value);
        }

        localStorage.setItem(key, value);
        if (callback) {
            callback(value);
        }
    }

    // Standard error handler for all IndexedDB transactions. Simply logs the
    // error to the console.
    function _errorHandler(request, errorText) {
        console.error((errorText || 'storage error') + ': ',
                      request.error.name);
    }


    var localStorageWrapper = {
        // Default API, from Gaia/localStorage.
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


    if(typeof define === 'function' && define.amd) {
        define(function() { return localStorageWrapper; });
    } else if(typeof module !== 'undefined' && module.exports) {
        module.exports = localStorageWrapper;
    } else {
        this.localStorageWrapper = localStorageWrapper;
    }

}).call(this);

// localForage is a library that allows users to create offline Backbone models
// and use IndexedDB to store large pieces of data.
// TODO: update ^^^ to reflect this is not only for Backbone

(function() {

    'use strict';

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;


    var storageLibrary;

    if(indexedDB) {
        storageLibrary = 'asyncStorage';
    } else {
        storageLibrary = 'localStorageWrapper';
    }


    if(typeof define === 'function' && define.amd) {
        define([storageLibrary], function(lib) { return lib; });
    } else if(typeof module !== 'undefined' && module.exports) {
        var lib = require('./' + storageLibrary);
        module.exports = lib;
    } else {
        this.localForage = this[storageLibrary];
    }

}).call(this); 
