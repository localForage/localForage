import serializer from '../utils/serializer';
import Promise from '../utils/promise';
import executeCallback from '../utils/executeCallback';

/*
 * Includes code from:
 *
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
// Open the WebSQL database (automatically creates one if one didn't
// previously exist), using any options set in the config.
function _initStorage(options) {
    var self = this;
    var dbInfo = {
        db: null
    };

    if (options) {
        for (var i in options) {
            dbInfo[i] = typeof(options[i]) !== 'string' ?
                        options[i].toString() : options[i];
        }
    }

    var dbInfoPromise = new Promise(function(resolve, reject) {
        // Open the database; the openDatabase API will automatically
        // create it for us if it doesn't exist.
        try {
            dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version),
                                     dbInfo.description, dbInfo.size);
        } catch (e) {
            return reject(e);
        }

        // Create our key/value table if it doesn't exist.
        dbInfo.db.transaction(function(t) {
            t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName +
                         ' (id INTEGER PRIMARY KEY, key unique, value)', [],
                         function() {
                self._dbInfo = dbInfo;
                resolve();
            }, function(t, error) {
                reject(error);
            });
        });
    });

    dbInfo.serializer = serializer;
    return dbInfoPromise;
}

function getItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
                            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                t.executeSql('SELECT * FROM ' + dbInfo.storeName +
                             ' WHERE key = ? LIMIT 1', [key],
                             function(t, results) {
                    var result = results.rows.length ?
                                 results.rows.item(0).value : null;

                    // Check to see if this is serialized content we need to
                    // unpack.
                    if (result) {
                        result = dbInfo.serializer.deserialize(result);
                    }

                    resolve(result);
                }, function(t, error) {

                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function iterate(iterator, callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;

            dbInfo.db.transaction(function(t) {
                t.executeSql('SELECT * FROM ' + dbInfo.storeName, [],
                    function(t, results) {
                        var rows = results.rows;
                        var length = rows.length;

                        for (var i = 0; i < length; i++) {
                            var item = rows.item(i);
                            var result = item.value;

                            // Check to see if this is serialized content
                            // we need to unpack.
                            if (result) {
                                result = dbInfo.serializer.deserialize(result);
                            }

                            result = iterator(result, item.key, i + 1);

                            // void(0) prevents problems with redefinition
                            // of `undefined`.
                            if (result !== void(0)) {
                                resolve(result);
                                return;
                            }
                        }

                        resolve();
                    }, function(t, error) {
                        reject(error);
                    });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function _setItem(key, value, callback, retriesLeft) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
                            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            // The localStorage API doesn't return undefined values in an
            // "expected" way, so undefined is always cast to null in all
            // drivers. See: https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            var dbInfo = self._dbInfo;
            dbInfo.serializer.serialize(value, function(value, error) {
                if (error) {
                    reject(error);
                } else {
                    dbInfo.db.transaction(function(t) {
                        t.executeSql('INSERT OR REPLACE INTO ' +
                                     dbInfo.storeName +
                                     ' (key, value) VALUES (?, ?)',
                                     [key, value], function() {
                            resolve(originalValue);
                        }, function(t, error) {
                            reject(error);
                        });
                    }, function(sqlError) {
                        // The transaction failed; check
                        // to see if it's a quota error.
                        if (sqlError.code === sqlError.QUOTA_ERR) {
                            // We reject the callback outright for now, but
                            // it's worth trying to re-run the transaction.
                            // Even if the user accepts the prompt to use
                            // more storage on Safari, this error will
                            // be called.
                            //
                            // Try to re-run the transaction.
                            if (retriesLeft > 0) {
                                resolve(_setItem.apply(self, [key, originalValue, callback, retriesLeft - 1]));
                                return;
                            }
                            reject(sqlError);
                        }
                    });
                }
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function setItem(key, value, callback) {
    return _setItem.apply(this, [key, value, callback, 1]);
}

function removeItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
                            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                t.executeSql('DELETE FROM ' + dbInfo.storeName +
                             ' WHERE key = ?', [key],
                             function() {
                    resolve();
                }, function(t, error) {

                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Deletes every item in the table.
// TODO: Find out if this resets the AUTO_INCREMENT number.
function clear(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                t.executeSql('DELETE FROM ' + dbInfo.storeName, [],
                             function() {
                    resolve();
                }, function(t, error) {
                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Does a simple `COUNT(key)` to get the number of items stored in
// localForage.
function length(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                // Ahhh, SQL makes this one soooooo easy.
                t.executeSql('SELECT COUNT(key) as c FROM ' +
                             dbInfo.storeName, [], function(t, results) {
                    var result = results.rows.item(0).c;

                    resolve(result);
                }, function(t, error) {

                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Return the key located at key index X; essentially gets the key from a
// `WHERE id = ?`. This is the most efficient way I can think to implement
// this rarely-used (in my experience) part of the API, but it can seem
// inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
// the ID of each key will change every time it's updated. Perhaps a stored
// procedure for the `setItem()` SQL would solve this problem?
// TODO: Don't change ID on `setItem()`.
function key(n, callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                t.executeSql('SELECT key FROM ' + dbInfo.storeName +
                             ' WHERE id = ? LIMIT 1', [n + 1],
                             function(t, results) {
                    var result = results.rows.length ?
                                 results.rows.item(0).key : null;
                    resolve(result);
                }, function(t, error) {
                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function(t) {
                t.executeSql('SELECT key FROM ' + dbInfo.storeName, [],
                             function(t, results) {
                    var keys = [];

                    for (var i = 0; i < results.rows.length; i++) {
                        keys.push(results.rows.item(i).key);
                    }

                    resolve(keys);
                }, function(t, error) {

                    reject(error);
                });
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

var webSQLStorage = {
    _driver: 'webSQLStorage',
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

export default webSQLStorage;
