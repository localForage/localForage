(function() {
    'use strict';

    // Promises!
    var Promise = (typeof module !== 'undefined' && module.exports) ?
                  require('promise') : this.Promise;

    // Avoid those magic constants!
    var MODULE_TYPE_DEFINE = 1;
    var MODULE_TYPE_EXPORT = 2;
    var MODULE_TYPE_WINDOW = 3;

    // Attaching to window (i.e. no module loader) is the assumed,
    // simple default.
    var moduleType = MODULE_TYPE_WINDOW;

    // Find out what kind of module setup we have; if none, we'll just attach
    // localForage to the main window.
    if (typeof define === 'function' && define.amd) {
        moduleType = MODULE_TYPE_DEFINE;
    } else if (typeof module !== 'undefined' && module.exports) {
        moduleType = MODULE_TYPE_EXPORT;
    }

    // The actual localForage object that we expose as a module or via a
    // global. It's extended by pulling in one of our other libraries.
    var _this = this;
    var localForage = {
        INDEXEDDB: 'asyncStorage',
        LOCALSTORAGE: 'localStorageWrapper',
        WEBSQL: 'webSQLStorage',

        _config: {
            description: '',
            name: 'localforage',
            // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
            // we can use without a prompt.
            size: 4980736,
            storeName: 'keyvaluepairs',
            version: 1.0
        },

        // Set any config values for localForage; can be called anytime before
        // the first API call (e.g. `getItem`, `setItem`).
        // We loop through options so we don't overwrite existing config
        // values.
        config: function(options) {
            // If the options argument is an object, we use it to set values.
            // Otherwise, we return either a specified config value or all
            // config values.
            if (typeof(options) === 'object') {
                // If localforage is ready and fully initialized, we can't set
                // any new configuration values. Instead, we return an error.
                if (this._ready) {
                    return new Error("Can't call config() after localforage " +
                                     "has been used.");
                }

                for (var i in options) {
                    this._config[i] = options[i];
                }

                return true;
            } else if (typeof(options) === 'string') {
                return this._config[options];
            } else {
                return this._config;
            }
        },

        driver: function() {
            return this._driver || null;
        },

        _ready: false,

        _driverSet: null,

        setDriver: function(drivers, callback, errorCallback) {
            var self = this;

            var isArray = Array.isArray || function(arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };

            if (!isArray(drivers) && typeof drivers === 'string') {
                drivers = [drivers];
            }

            this._driverSet = new Promise(function(resolve, reject) {
                localForage._driverSupportSet.then(function() {
                    var driverName = self._getFirstSupportedDriver(drivers);

                    if (!driverName) {
                        var error = new Error('No available storage method found.');
                        self._driverSet = Promise.reject(error);

                        if (errorCallback) {
                            errorCallback(error);
                        }

                        reject(error);

                        return;
                    }

                    self._ready = null;

                    // We allow localForage to be declared as a module or as a
                    // library available without AMD/require.js.
                    if (moduleType === MODULE_TYPE_DEFINE) {
                        require([driverName], function(lib) {
                            self._extend(lib);

                            if (callback) {
                                callback();
                            }
                            resolve();
                        });

                        return;
                    } else if (moduleType === MODULE_TYPE_EXPORT) {
                        // Making it browserify friendly
                        var driver;
                        switch (driverName) {
                            case self.INDEXEDDB:
                                driver = require('./drivers/indexeddb');
                                break;
                            case self.LOCALSTORAGE:
                                driver = require('./drivers/localstorage');
                                break;
                            case self.WEBSQL:
                                driver = require('./drivers/websql');
                        }

                        self._extend(driver);
                    } else {
                        self._extend(_this[driverName]);
                    }

                    if (callback) {
                        callback();
                    }

                    resolve();
                }, reject);
            });

            return this._driverSet;
        },

        _getFirstSupportedDriver: function(drivers) {
            if (drivers) {
                for (var i = 0; i < drivers.length; i++) {
                    var driver = drivers[i];

                    if (this.supports(driver)) {
                        return driver;
                    }
                }
            }

            return null;
        },

        supports: function(driverName) {
            return !!driverSupport[driverName];
        },

        ready: function(callback) {
            return localForage._driverSupportSet.then(function() {
                return localForage._driverSet.then(function() {
                    if (localForage._ready === null) {
                        localForage._ready = localForage._initStorage(
                            localForage._config);
                    }
                    return localForage._ready;
                });
            }).then(callback, callback);
        },

        _extend: function(libraryMethodsAndProperties) {
            for (var i in libraryMethodsAndProperties) {
                if (libraryMethodsAndProperties.hasOwnProperty(i)) {
                    this[i] = libraryMethodsAndProperties[i];
                }
            }
        }
    };

    var libraryMethods = [
        'clear',
        'getItem',
        'key',
        'keys',
        'length',
        'removeItem',
        'setItem'
    ];

    var callWhenReady = function(libraryMethod) {
        localForage[libraryMethod] = function() {
            var args = arguments;
            return localForage.ready().then(function() {
                return localForage[libraryMethod].apply(localForage, args);
            });
        };
    };

    // Add a stub for each driver API method that delays the call to the
    // corresponding driver method till localForage is ready. These stubs will
    // be replaced by the driver methods as soon as the driver is loaded, hence
    // there is no performance impact.
    for (var i = 0; i < libraryMethods.length; i++) {
        callWhenReady(libraryMethods[i]);
    }

    // Check to see if IndexedDB is available and if it is the latest
    // implementation; it's our preferred backend library. We use "_spec_test"
    // as the name of the database because it's not the one we'll operate on,
    // but it's useful to make sure its using the right spec.
    // See: https://github.com/mozilla/localForage/issues/128
    var driverSupport = {};
    localForage._driverSupportSet = (function(_this) {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        var indexedDB = indexedDB || _this.indexedDB || _this.webkitIndexedDB ||
                        _this.mozIndexedDB || _this.OIndexedDB ||
                        _this.msIndexedDB;

        var result = {};
        var specTest = '_localforage_spec_test';

        result[localForage.LOCALSTORAGE] = (function() {
            // Ref: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
            try {
                localStorage.setItem(specTest, specTest);
                localStorage.removeItem(specTest);
                return true;
            } catch (e) {
                return false;
            }
        })();

        return Promise.all([(new Promise(function(resolve, reject) {
            var openDatabase = _this.openDatabase;
            var db = null;
            var dbInfo = {};
            var options = localForage._config;

            if (!openDatabase) {
                reject();
            }

            for (var i in options) {
                dbInfo[i] = typeof(options[i]) !== 'string' ? options[i].toString() : options[i];
            }

            try {
                db = openDatabase(dbInfo.name, dbInfo.version,
                                  dbInfo.description, dbInfo.size);
            } catch (e) {
                reject();
            }

            db.transaction(function(t) {
                // Attempt to create table is needed to detect lack of support
                // in Safari Private Browsing mode.
                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName +
                             ' (id INTEGER PRIMARY KEY, key unique, value)', [], resolve, reject);
            });
        })).then(function() {
            result[localForage.WEBSQL] = true;
        }, function() {
            result[localForage.WEBSQL] = false;
        }), (new Promise(function(resolve, reject) {
            if (indexedDB && typeof indexedDB.open === 'function') {
                var request = indexedDB.open(specTest, 1);
                if (request.onupgradeneeded === null) {
                    // Async test is needed to detect lack of support in
                    // Firefox Private Browsing mode.
                    request.onsuccess = resolve;
                    request.onerror = reject;
                    return;
                }
            }
            reject();
        })).then(function() {
            result[localForage.INDEXEDDB] = true;
        }, function() {
            result[localForage.INDEXEDDB] = false;
        })]).then(function() {
            driverSupport = result;
        });
    })(this);

    var driverTestOrder = [
        localForage.INDEXEDDB,
        localForage.WEBSQL,
        localForage.LOCALSTORAGE
    ];

    localForage.setDriver(driverTestOrder);

    // We allow localForage to be declared as a module or as a library
    // available without AMD/require.js.
    if (moduleType === MODULE_TYPE_DEFINE) {
        define(function() {
            return localForage;
        });
    } else if (moduleType === MODULE_TYPE_EXPORT) {
        module.exports = localForage;
    } else {
        this.localforage = localForage;
    }
}).call(this);
