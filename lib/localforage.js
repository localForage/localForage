'use strict';

// localForage is a library that allows users to create offline Backbone models
// and use IndexedDB to store large pieces of data.
define(['async_storage'], function(asyncStorage) {
    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // Because indexedDB is available, we'll use it to store data.
    if (indexedDB) {
        return asyncStorage;
    }

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

    return {
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
});
