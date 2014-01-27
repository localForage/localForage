(function() {
    'use strict';

    var DB_NAME = 'localforage';
    // Default DB size is 5MB, as it's the highest size we can use without
    // a prompt.
    var DB_SIZE = 5 * 1024 * 1024;
    var DB_VERSION = '1.0';
    var STORE_NAME = 'keyvaluepairs';
    var Promise = window.Promise;

    // If WebSQL methods aren't available, we can stop now.
    if (!window.openDatabase) {
        return;
    }

    // Open the database; the openDatabase API will automatically create it for
    // us if it doesn't exist.
    var db = window.openDatabase(DB_NAME, DB_VERSION, STORE_NAME, DB_SIZE);

    // Create our key/value table if it doesn't exist.
    // TODO: Technically I can imagine this being as race condition, as I'm not
    // positive on the WebSQL API enough to be sure that other transactions
    // won't be run before this? But I assume not.
    db.transaction(function (t) {
        t.executeSql('CREATE TABLE IF NOT EXISTS localforage (id INTEGER PRIMARY KEY, key unique, value)');
    });

    function getItem(key, callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('SELECT * FROM localforage LIMIT 1', [], function (t, results) {
                    // var result = results.rows.length ? results.rows.item(i) : undefined;
                    var result = results.rows.item(0);

                    if (callback) {
                        callback(result.value);
                    }

                    resolve(result.value);
                }, null);
            });
        });
    }

    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('INSERT OR REPLACE INTO localforage (key, value) VALUES (?, ?)', [key, value], function() {
                    if (callback) {
                        callback(value);
                    }

                    resolve(value);
                }, null);
            });
        });
    }

    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('DELETE FROM localforage WHERE key = ? LIMIT 1', [key], function() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                }, null);
            });
        });
    }

    // Deletes every item in the table with a TRUNCATE call.
    // TODO: Find out if this resets the AUTO_INCREMENT number.
    function clear(callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('TRUNCATE localforage', [key], function() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                }, null);
            });
        });
    }

    // Does a simple `COUNT(key)` to get the number of items stored in
    // localForage.
    function length(callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                // Ahhh, SQL makes this one soooooo easy.
                t.executeSql('SELECT COUNT(key) FROM localforage', [], function (t, results) {
                    var result = results.rows.length;

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                }, null);
            });
        });
    }

    // Return the value located at key number X; essentially does a
    // `WHERE id = ?`. This is the most efficient way I can think to implement
    // this rarely-used (in my experience) part of the API, but it can seem
    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
    // the ID of each key will change every time it's updated. Perhaps a stored
    // procedure for the `setItem()` SQL would solve this problem?
    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('SELECT * FROM localforage WHERE id = ? LIMIT 1', [n], function (t, results) {
                    var result = results.rows.length ? results.rows.item(0).value : undefined;

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                }, null);
            });
        });
    }

    var webSQLStorage = {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define(function() {
          return webSQLStorage;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = webSQLStorage;
    } else {
        this.webSQLStorage = webSQLStorage;
    }
}).call(this);
