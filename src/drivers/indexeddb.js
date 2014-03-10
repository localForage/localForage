(function() {
    'use strict';

    // Originally found in https://github.com/mozilla-b2g/gaia/blob/e8f624e4cc9ea945727278039b3bc9bcb9f8667a/shared/js/async_storage.js

    var DB_NAME = 'localforage';
    var DB_VERSION = 1;
    var STORE_NAME = 'keyvaluepairs';
    var Promise = window.Promise;
    var db = null;
    var defaultInfos = { dbName: DB_NAME, storeName: STORE_NAME, dbVersion: DB_VERSION };

    window.db = db;

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // If IndexedDB isn't available, we get outta here!
    if (!indexedDB) {
        return;
    }

    function _initStorage() {
        return new Promise(function(resolve, reject) {
            var openreq = indexedDB.open(DBNAME, DBVERSION);
            openreq.onerror = function withStoreOnError() {
                reject(openreq.error.name);
            };
            openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
                // First time setup: create an empty object store
                openreq.result.createObjectStore(STORE_NAME);
            };
            openreq.onsuccess = function withStoreOnSuccess() {
                db = openreq.result;
                resolve();
            };
        });
    }

    function getItem(key, callback) {
        return new Promise(function(resolve, reject) {
            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readonly').objectStore(STORENAME);

                var req = store.get(key);
                req.onsuccess = function getItemOnSuccess() {
                    var value = req.result;
                    if (value === undefined) {
                        value = null;
                    }

                    if (callback) {
                        callback(value);
                    }

                    resolve(value);
                };
                req.onerror = function getItemOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readwrite').objectStore(STORENAME);

                // Cast to undefined so the value passed to callback/promise is
                // the same as what one would get out of `getItem()` later.
                // This leads to some weirdness (setItem('foo', undefined) will
                // return "null"), but it's not my fault localStorage is our
                // baseline and that it's weird.
                if (value === undefined) {
                    value = null;
                }

                var req = store.put(value, key);
                req.onsuccess = function setItemOnSuccess() {
                    if (callback) {
                        callback(value);
                    }

                    resolve(value);
                };
                req.onerror = function setItemOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readwrite').objectStore(STORENAME);

                // We use `['delete']` instead of `.delete` because IE 8 will
                // throw a fit if it sees the reserved word "delete" in this
                // scenario. See: https://github.com/mozilla/localForage/pull/67
                //
                // This can be removed once we no longer care about IE 8, for
                // what that's worth.
                // TODO: Write a test against this? Maybe IE in general? Also,
                // make sure the minify step doesn't optimise this to `.delete`,
                // though it currently doesn't.
                var req = store['delete'](key);
                req.onsuccess = function removeItemOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function removeItemOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function clear(callback) {
        return new Promise(function(resolve, reject) {
            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readwrite').objectStore(STORENAME);

                var req = store.clear();
                req.onsuccess = function clearOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function clearOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function length(callback) {
        return new Promise(function(resolve, reject) {
            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readonly').objectStore(STORENAME);

                var req = store.count();
                req.onsuccess = function lengthOnSuccess() {
                    if (callback) {
                        callback(req.result);
                    }

                    resolve(req.result);
                };
                req.onerror = function lengthOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            if (n < 0) {
                if (callback) {
                    callback(null);
                }

                resolve(null);

                return;
            }

            localforage.ready().then(function() {
                var store = db.transaction(STORENAME, 'readonly').objectStore(STORENAME);

                var advanced = false;
                var req = store.openCursor();
                req.onsuccess = function keyOnSuccess() {
                    var cursor = req.result;
                    if (!cursor) {
                        // this means there weren't enough keys
                        if (callback) {
                            callback(null);
                        }

                        resolve(null);

                        return;
                    }
                    if (n === 0) {
                        // We have the first key, return it if that's what they wanted
                        if (callback) {
                            callback(cursor.key);
                        }

                        resolve(cursor.key);
                    } else {
                        if (!advanced) {
                            // Otherwise, ask the cursor to skip ahead n records
                            advanced = true;
                            cursor.advance(n);
                        } else {
                            // When we get here, we've got the nth key.
                            if (callback) {
                                callback(cursor.key);
                            }

                            resolve(cursor.key);
                        }
                    }
                };

                req.onerror = function keyOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    var asyncStorage = {
        _driver: 'asyncStorage',
        _initStorage: _initStorage,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('asyncStorage', function() {
            return asyncStorage;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = asyncStorage;
    } else {
        this.asyncStorage = asyncStorage;
    }
}).call(this);
