// If no driver is available, we'll fall back to simple in memory storage.
// Note that this will have considerable performance and storage
// side-effects and data will be lost when the user reloads the page

import serializer from '../utils/serializer';
import Promise from '../utils/promise';
import executeCallback from '../utils/executeCallback';

var storageRepository = {};

// Config the backend, using options set in the config.
function _initStorage(options) {
    var self = this;

    var dbInfo = {};
    if (options) {
        for (var i in options) {
            dbInfo[i] = options[i];
        }
    }

    var database = storageRepository[dbInfo.name] = storageRepository[dbInfo.name] || {};
    var table = database[dbInfo.storeName] = database[dbInfo.storeName] || {};
    dbInfo.db = table;

    self._dbInfo = dbInfo;
    dbInfo.serializer = serializer;

    return Promise.resolve();
}

// Remove all keys from the datastore, effectively destroying all data in
// the app's key/value store!
function clear(callback) {
    var self = this;
    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;

        for (var key in db) {
            if (db.hasOwnProperty(key)) {
                delete db[key];
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Retrieve an item from the store. Unlike the original async_storage
// library in Gaia, we don't modify return values at all. If a key's value
// is `undefined`, we pass that value to the callback function.
function getItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;
        var result = db[key];

        if (result === undefined) {
            return null;
        }

        if (result) {
            result = self._dbInfo.serializer.deserialize(result);
        }

        return result;
    });

    executeCallback(promise, callback);
    return promise;
}

// Iterate over all items in the store.
function iterate(iterator, callback) {
    var self = this;

    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;

        var iterationNumber = 1;
        for (var key in db) {
            if (db.hasOwnProperty(key)) {
                var value = db[key];

                if (value) {
                    value = self._dbInfo.serializer.deserialize(value);
                }

                value = iterator(value, key, iterationNumber++);

                if (value !== void(0)) {
                    return value;
                }
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Same as localStorage's key() method, except takes a callback.
function key(n, callback) {
    var self = this;
    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;
        var result = null;
        var index = 0;

        for (var key in db) {
            if (db.hasOwnProperty(key)) {
                if (n === index) {
                    result = key;
                    break;
                }
                index++;
            }
        }

        return result;
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    var self = this;
    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;
        var keys = [];

        for (var key in db) {
            if (db.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        return keys;
    });

    executeCallback(promise, callback);
    return promise;
}

// Supply the number of keys in the datastore to the callback function.
function length(callback) {
    var self = this;
    var promise = self.keys().then(function(keys) {
        return keys.length;
    });

    executeCallback(promise, callback);
    return promise;
}

// Remove an item from the store, nice and simple.
function removeItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = self.ready().then(function() {
        var db = self._dbInfo.db;
        if (db.hasOwnProperty(key)) {
            delete db[key];
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Set a key's value and run an optional callback once the value is set.
// Unlike Gaia's implementation, the callback function is passed the value,
// in case you want to operate on that value only after you're sure it
// saved, or something like that.
function setItem(key, value, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = self.ready().then(function() {
        // Convert undefined values to null.
        // https://github.com/mozilla/localForage/pull/42
        if (value === undefined) {
            value = null;
        }

        // Save the original value to pass to the callback.
        var originalValue = value;

        function serializeAsync(value) {
            return new Promise(function(resolve, reject) {
                self._dbInfo.serializer.serialize(value, function(value, error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(value);
                    }
                });
            });
        }

        return serializeAsync(value).then(function(value) {
            var db = self._dbInfo.db;
            db[key] = value;
            return originalValue;
        });
    });

    executeCallback(promise, callback);
    return promise;
}

var memoryStorage = {
    _driver: 'memoryStorage',
    _initStorage: _initStorage,
    iterate: iterate,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key,
    keys: keys
};

export default memoryStorage;
