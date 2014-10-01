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

    var DefaultDriverOrder = [
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

    var DefaultConfig = {
        description: '',
        name: 'localforage',
        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
        // we can use without a prompt.
        size: 4980736,
        storeName: 'keyvaluepairs',
        version: 1.0
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
        result[DriverType.INDEXEDDB] = !!(function() {
            try {
                return (indexedDB &&
                        typeof indexedDB.open === 'function' &&
                        indexedDB.open('_localforage_spec_test', 1)
                        .onupgradeneeded === null);
            } catch (e) {
                return false;
            }
        })();

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

    function extend(/*...*/) {
        for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
                for (var key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        arguments[0][key] = arg[key];
                    }
                }
            }
        }
        return arguments[0];
    }

    function callWhenReady(localForageInstance, libraryMethod) {
        localForageInstance[libraryMethod] = function() {
            var _args = arguments;
            return localForageInstance.ready().then(function() {
                return localForageInstance[libraryMethod].apply(localForageInstance, _args);
            });
        };
    }

    // The actual localForage object that we expose as a module or via a
    // global. It's extended by pulling in one of our other libraries.
    var _this = this;

    function LocalForage(options) {
        this._config = extend({}, DefaultConfig, options);
        this._driverSet = null;
        this._ready = false;
        this._dbInfo = null;

        // Add a stub for each driver API method that delays the call to the
        // corresponding driver method until localForage is ready. These stubs
        // will be replaced by the driver methods as soon as the driver is
        // loaded, so there is no performance impact.
        for (var i = 0; i < LibraryMethods.length; i++) {
            callWhenReady(this, LibraryMethods[i]);
        }

        this.setDriver(DefaultDriverOrder);
    }

    LocalForage.prototype.INDEXEDDB = DriverType.INDEXEDDB;
    LocalForage.prototype.LOCALSTORAGE = DriverType.LOCALSTORAGE;
    LocalForage.prototype.WEBSQL = DriverType.WEBSQL;

    // Set any config values for localForage; can be called anytime before
    // the first API call (e.g. `getItem`, `setItem`).
    // We loop through options so we don't overwrite existing config
    // values.
    LocalForage.prototype.config = function(options) {
        // If the options argument is an object, we use it to set values.
        // Otherwise, we return either a specified config value or all
        // config values.
        if (typeof(options) === 'object') {
            // If localforage is ready and fully initialized, we can't set
            // any new configuration values. Instead, we return an error.
            if (this._ready) {
                return new Error("Can't call config() after localforage " +
                                 'has been used.');
            }

            for (var i in options) {
                if (i === 'storeName') {
                    options[i] = options[i].replace(/\W/g, '_');
                }

                this._config[i] = options[i];
            }

            return true;
        } else if (typeof(options) === 'string') {
            return this._config[options];
        } else {
            return this._config;
        }
    };

    LocalForage.prototype.driver = function() {
        return this._driver || null;
    };

    LocalForage.prototype.ready = function(callback) {
        var self = this;

        var ready = new Promise(function(resolve, reject) {
            self._driverSet.then(function() {
                if (self._ready === null) {
                    self._ready = self._initStorage(self._config);
                }

                self._ready.then(resolve, reject);
            }).catch(reject);
        });

        ready.then(callback, callback);
        return ready;
    };

    LocalForage.prototype.setDriver = function(drivers, callback,
                                               errorCallback) {
        var self = this;

        if (typeof drivers === 'string') {
            drivers = [drivers];
        }

        this._driverSet = new Promise(function(resolve, reject) {
            var driverName = self._getFirstSupportedDriver(drivers);

            if (!driverName) {
                var error = new Error('No available storage method found.');
                self._driverSet = Promise.reject(error);

                reject(error);

                return;
            }

            self._dbInfo = null;
            self._ready = null;

            // We allow localForage to be declared as a module or as a
            // library available without AMD/require.js.
            if (moduleType === ModuleType.DEFINE) {
                require([driverName], function(lib) {
                    self._extend(lib);

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

            resolve();
        });

        this._driverSet.then(callback, errorCallback);
        return this._driverSet;
    };

    LocalForage.prototype.supports = function(driverName) {
        return !!driverSupport[driverName];
    };

    LocalForage.prototype._extend = function(libraryMethodsAndProperties) {
        extend(this, libraryMethodsAndProperties);
    };

    LocalForage.prototype._getFirstSupportedDriver = function(drivers) {
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
    };

    LocalForage.prototype.createInstance = function(options) {
        return new LocalForage(options);
    };

    var localForage = new LocalForage();

    // We allow localForage to be declared as a module or as a library
    // available without AMD/require.js.
    if (moduleType === ModuleType.DEFINE) {
        define('localforage', function() {
            return localForage;
        });
    } else if (moduleType === ModuleType.EXPORT) {
        module.exports = localForage;
    } else {
        this.localforage = localForage;
    }
}).call(window);
