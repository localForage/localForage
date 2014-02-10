(function() {
    'use strict';

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
     *    asyncStorage.setItem('key', 'newvalue', function() {
     *        console.log('new value stored');
     *    });
     *
     * To read a value, call getItem(), but note that you must supply a callback
     * function that the value will be passed to asynchronously:
     *
     *    asyncStorage.getItem('key', function(value) {
     *        console.log('The value of key is:', value);
     *    });
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
     * store to be strings.    So if you need to save multiple values and want to
     * retrieve them together, in a single asynchronous operation, just group the
     * values into a single object. The properties of this object may not include
     * DOM elements, but they may include things like Blobs and typed arrays.
     */

    var DBNAME = 'asyncStorage';
    var DBVERSION = 1;
    var STORENAME = 'keyvaluepairs';
    var Promise = window.Promise;
    var db = null;

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // If IndexedDB isn't available, we get outta here!
    if (!indexedDB) {
        return;
    }

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
        return new Promise(function(resolve, reject) {
            withStore('readonly', function getItemBody(store) {
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
                    console.error('Error in asyncStorage.getItem(): ', req.error.name);
                };
            });
        });
    }

    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function setItemBody(store) {
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
                    console.error('Error in asyncStorage.setItem(): ', req.error.name);
                };
            });
        });
    }

    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function removeItemBody(store) {
                var req = store.delete(key);
                req.onsuccess = function removeItemOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function removeItemOnError() {
                    console.error('Error in asyncStorage.removeItem(): ', req.error.name);
                };
            });
        });
    }

    function clear(callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function clearBody(store) {
                var req = store.clear();
                req.onsuccess = function clearOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function clearOnError() {
                    console.error('Error in asyncStorage.clear(): ', req.error.name);
                };
            });
        });
    }

    function length(callback) {
        return new Promise(function(resolve, reject) {
            withStore('readonly', function lengthBody(store) {
                var req = store.count();
                req.onsuccess = function lengthOnSuccess() {
                    if (callback) {
                        callback(req.result);
                    }

                    resolve(req.result);
                };
                req.onerror = function lengthOnError() {
                    console.error('Error in asyncStorage.length(): ', req.error.name);
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

            withStore('readonly', function keyBody(store) {
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
                    console.error('Error in asyncStorage.key(): ', req.error.name);
                };
            });
        });
    }

    var asyncStorage = {
        driver: 'asyncStorage',
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
