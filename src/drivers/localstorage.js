// If IndexedDB isn't available, we'll fall back to localStorage.
// Note that this will have considerable performance and storage
// side-effects (all data will be serialized on save and only data that
// can be converted to a string via `JSON.stringify()` will be saved).
(function() {
    'use strict';

    var localStorage;
    var Promise = window.Promise;

    // If the app is running inside a Google Chrome packaged webapp, or some
    // other context where localStorage isn't available, we don't use
    // localStorage. This feature detection is preferred over the old
    // `if (window.chrome && window.chrome.runtime)` code.
    // See: https://github.com/mozilla/localForage/issues/68
    try {
        // Initialize localStorage and create a variable to use throughout
        // the code.
        localStorage = window.localStorage;
    } catch (e) {
        return;
    }

    // Remove all keys from the datastore, effectively destroying all data in
    // the app's key/value store!
    function clear(callback) {
        return new Promise(function(resolve, reject) {
            localStorage.clear();

            if (callback) {
                callback();
            }

            resolve();
        });
    }

    // Retrieve an item from the store. Unlike the original async_storage
    // library in Gaia, we don't modify return values at all. If a key's value
    // is `undefined`, we pass that value to the callback function.
    function getItem(key, callback) {
        return new Promise(function(resolve, reject) {
            try {
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

                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    // Same as localStorage's key() method, except takes a callback.
    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            var result = localStorage.key(n);

            if (callback) {
                callback(result);
            }

            resolve(result);
        });
    }

    // Supply the number of keys in the datastore to the callback function.
    function length(callback) {
        return new Promise(function(resolve, reject) {
            var result = localStorage.length;

            if (callback) {
                callback(result);
            }

            resolve(result);
        });
    }

    // Remove an item from the store, nice and simple.
    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            localStorage.removeItem(key);

            if (callback) {
                callback();
            }

            resolve();
        });
    }

    // Set a key's value and run an optional callback once the value is set.
    // Unlike Gaia's implementation, the callback function is passed the value,
    // in case you want to operate on that value only after you're sure it
    // saved, or something like that.
    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            // Convert undefined values to null.
            // https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            try {
                value = JSON.stringify(value);
            } catch (e) {
                reject(e);
            }

            localStorage.setItem(key, value);

            if (callback) {
                callback(originalValue);
            }

            resolve(originalValue);
        });
    }

    var localStorageWrapper = {
        driver: 'localStorageWrapper',
        // Default API, from Gaia/localStorage.
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('localStorageWrapper', function() {
            return localStorageWrapper;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = localStorageWrapper;
    } else {
        this.localStorageWrapper = localStorageWrapper;
    }
}).call(this);
