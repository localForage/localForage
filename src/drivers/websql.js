(function() {
    'use strict';

    // Default DB size is _JUST UNDER_ 5MB, as it's the highest size we can use
    // without a prompt.
    //
    // TODO: Add a way to increase this size programmatically?
    var DB_SIZE = 4980736;
    var SERIALIZED_MARKER = '__lfsc__:';
    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;
    var Promise = window.Promise;
    var db = null;
    var dbInfo = {
        description: '',
        name: 'localforage',
        storeName: 'keyvaluepairs',
        version: '1.0'
    };

    // If WebSQL methods aren't available, we can stop now.
    if (!window.openDatabase) {
        return;
    }

    // Open the WebSQL database (automatically creates one if one didn't
    // previously exist), using any options set in window.localForageConfig.
    function _initStorage(options) {
        if (options) {
            for (var i in dbInfo) {
                if (options[i] !== undefined) {
                    dbInfo[i] = typeof(options[i]) !== 'string' ? options[i].toString() : options[i];
                }
            }
        }

        return new Promise(function(resolve, reject) {
            // Open the database; the openDatabase API will automatically
            // create it for us if it doesn't exist.
            db = window.openDatabase(dbInfo.name, dbInfo.version,
                                     dbInfo.description, DB_SIZE);

            // Create our key/value table if it doesn't exist.
            db.transaction(function (t) {
                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function() {
                    resolve();
                }, null);
            });
        });
    }

    function getItem(key, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                db.transaction(function (t) {
                    t.executeSql('SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
                        var result = results.rows.length ? results.rows.item(0).value : null;

                        // Check to see if this is serialized content we need to
                        // unpack.
                        if (result && result.substr(0, SERIALIZED_MARKER_LENGTH) === SERIALIZED_MARKER) {
                            try {
                                result = JSON.parse(result.slice(SERIALIZED_MARKER_LENGTH));
                            } catch (e) {
                                reject(e);
                            }
                        }

                        if (callback) {
                            callback(result);
                        }

                        resolve(result);
                    }, null);
                });
            });
        });
    }

    function setItem(key, value, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                // The localStorage API doesn't return undefined values in an
                // "expected" way, so undefined is always cast to null in all
                // drivers. See: https://github.com/mozilla/localForage/pull/42
                if (value === undefined) {
                    value = null;
                }

                // We need to serialize certain types of objects using WebSQL;
                // otherwise they'll get stored as strings as be useless when we
                // use getItem() later.
                var valueToSave;
                if (typeof(value) === 'boolean' || typeof(value) === 'number' || typeof(value) === 'object') {
                    // Mark the content as "localForage serialized content" so we
                    // know to run JSON.parse() on it when we get it back out from
                    // the database.
                    valueToSave = SERIALIZED_MARKER + JSON.stringify(value);
                } else {
                    valueToSave = value;
                }

                db.transaction(function (t) {
                    t.executeSql('INSERT OR REPLACE INTO ' + dbInfo.storeName + ' (key, value) VALUES (?, ?)', [key, valueToSave], function() {
                        if (callback) {
                            callback(value);
                        }

                        resolve(value);
                    }, null);
                });
            });
        });
    }

    function removeItem(key, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                db.transaction(function (t) {
                    t.executeSql('DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function() {
                        if (callback) {
                            callback();
                        }

                        resolve();
                    }, null);
                });
            });
        });
    }

    // Deletes every item in the table.
    // TODO: Find out if this resets the AUTO_INCREMENT number.
    function clear(callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                db.transaction(function (t) {
                    t.executeSql('DELETE FROM ' + dbInfo.storeName, [], function(t, results) {
                        if (callback) {
                            callback();
                        }

                        resolve();
                    }, null);
                });
            });
        });
    }

    // Does a simple `COUNT(key)` to get the number of items stored in
    // localForage.
    function length(callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                db.transaction(function (t) {
                    // Ahhh, SQL makes this one soooooo easy.
                    t.executeSql('SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
                        var result = results.rows.item(0).c;

                        if (callback) {
                            callback(result);
                        }

                        resolve(result);
                    }, null);
                });
            });
        });
    }

    // Return the key located at key index X; essentially gets the key from a
    // `WHERE id = ?`. This is the most efficient way I can think to implement
    // this rarely-used (in my experience) part of the API, but it can seem
    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
    // the ID of each key will change every time it's updated. Perhaps a stored
    // procedure for the `setItem()` SQL would solve this problem?
    // TODO: Don't change ID on `setItem()`.
    function key(n, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                db.transaction(function (t) {
                    t.executeSql('SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
                        var result = results.rows.length ? results.rows.item(0).key : null;

                        if (callback) {
                            callback(result);
                        }

                        resolve(result);
                    }, null);
                });
            });
        });
    }

    var webSQLStorage = {
        _driver: 'webSQLStorage',
        _initStorage: _initStorage,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('webSQLStorage', function() {
            return webSQLStorage;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = webSQLStorage;
    } else {
        this.webSQLStorage = webSQLStorage;
    }
}).call(this);
