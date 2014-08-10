(function() {
    'use strict';

    // Promises!
    var Promise = (typeof module !== 'undefined' && module.exports) ?
                  require('promise') : this.Promise;

    var DriverType = {
        INDEXEDDB: 'asyncStorage',
        LOCALSTORAGE: 'localStorageWrapper',
        WEBSQL: 'webSQLStorage'
    };

    var DEFAULT_DRIVER_ORDER = [
        DriverType.INDEXEDDB,
        DriverType.WEBSQL,
        DriverType.LOCALSTORAGE
    ];

    var LibraryMethods = [
        'clear',
        'getItem',
        'key',
        'keys',
        'length',
        'removeItem',
        'setItem'
    ];

    var ModuleType = {
        DEFINE: 1,
        EXPORT: 2,
        WINDOW: 3
    };

    // Attaching to window (i.e. no module loader) is the assumed,
    // simple default.
    var moduleType = ModuleType.WINDOW;

    // Find out what kind of module setup we have; if none, we'll just attach
    // localForage to the main window.
    if (typeof define === 'function' && define.amd) {
        moduleType = ModuleType.DEFINE;
    } else if (typeof module !== 'undefined' && module.exports) {
        moduleType = ModuleType.EXPORT;
    }

    // Check to see if IndexedDB is available and if it is the latest
    // implementation; it's our preferred backend library. We use "_spec_test"
    // as the name of the database because it's not the one we'll operate on,
    // but it's useful to make sure its using the right spec.
    // See: https://github.com/mozilla/localForage/issues/128
    var driverSupport = (function(_this) {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        var indexedDB = indexedDB || _this.indexedDB || _this.webkitIndexedDB ||
                        _this.mozIndexedDB || _this.OIndexedDB ||
                        _this.msIndexedDB;

        var result = {};

        result[DriverType.WEBSQL] = !!_this.openDatabase;
        result[DriverType.INDEXEDDB] = !!(
            indexedDB &&
            typeof indexedDB.open === 'function' &&
            indexedDB.open('_localforage_spec_test', 1)
                     .onupgradeneeded === null
        );

        result[DriverType.LOCALSTORAGE] = !!(function() {
            try {
                return (localStorage &&
                        typeof localStorage.setItem === 'function');
            } catch (e) {
                return false;
            }
        })();

        return result;
    })(this);

    // The actual localForage object that we expose as a module or via a
    // global. It's extended by pulling in one of our other libraries.
    var _this = this;
    var localForage = {
        INDEXEDDB: DriverType.INDEXEDDB,
        LOCALSTORAGE: DriverType.LOCALSTORAGE,
        WEBSQL: DriverType.WEBSQL,

        _config: {
            description: '',
            name: 'localforage',
            // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
            // we can use without a prompt.
            size: 4980736,
            storeName: 'keyvaluepairs',
            version: 1.0
        },
        _driverSet: null,
        _ready: false,

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

        ready: function(callback) {
            var ready = new Promise(function(resolve, reject) {
                localForage._driverSet.then(function() {
                    if (localForage._ready === null) {
                        localForage._ready = localForage._initStorage(
                            localForage._config);
                    }

                    localForage._ready.then(resolve, reject);
                }, reject);
            });

            ready.then(callback, callback);

            return ready;
        },

        setDriver: function(drivers, callback, errorCallback) {
            var self = this;

            if (typeof drivers === 'string') {
                drivers = [drivers];
            }

            this._driverSet = new Promise(function(resolve, reject) {
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
                if (moduleType === ModuleType.DEFINE) {
                    require([driverName], function(lib) {
                        self._extend(lib);

                        if (callback) {
                            callback();
                        }
                        resolve();
                    });

                    return;
                } else if (moduleType === ModuleType.EXPORT) {
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
            });

            return this._driverSet;
        },

        supports: function(driverName) {
            return !!driverSupport[driverName];
        },

        _extend: function(libraryMethodsAndProperties) {
            for (var i in libraryMethodsAndProperties) {
                if (libraryMethodsAndProperties.hasOwnProperty(i)) {
                    this[i] = libraryMethodsAndProperties[i];
                }
            }
        },

        _getFirstSupportedDriver: function(drivers) {
            var isArray = Array.isArray || function(arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };

            if (drivers && isArray(drivers)) {
                for (var i = 0; i < drivers.length; i++) {
                    var driver = drivers[i];

                    if (this.supports(driver)) {
                        return driver;
                    }
                }
            }

            return null;
        }
    };

    function callWhenReady(libraryMethod) {
        localForage[libraryMethod] = function() {
            var _args = arguments;
            return localForage.ready().then(function() {
                return localForage[libraryMethod].apply(localForage, _args);
            });
        };
    }

    // Add a stub for each driver API method that delays the call to the
    // corresponding driver method until localForage is ready. These stubs will
    // be replaced by the driver methods as soon as the driver is loaded, so
    // there is no performance impact.
    for (var i = 0; i < LibraryMethods.length; i++) {
        callWhenReady(LibraryMethods[i]);
    }

    localForage.setDriver(DEFAULT_DRIVER_ORDER);

    // We allow localForage to be declared as a module or as a library
    // available without AMD/require.js.
    if (moduleType === ModuleType.DEFINE) {
        define(function() {
            return localForage;
        });
    } else if (moduleType === ModuleType.EXPORT) {
        module.exports = localForage;
    } else {
        this.localforage = localForage;
    }
}).call(this);
