(function() {
    'use strict';

    // Custom drivers are stored here when `defineDriver()` is called.
    // They are shared across all instances of localForage.
    var CustomDrivers = {};

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
        'iterate',
        'key',
        'keys',
        'length',
        'removeItem',
        'setItem'
    ];

    var DefaultConfig = {
        description: '',
        driver: DefaultDriverOrder.slice(),
        name: 'localforage',
        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
        // we can use without a prompt.
        size: 4980736,
        storeName: 'keyvaluepairs',
        version: 1.0
    };

    // Check to see if IndexedDB is available and if it is the latest
    // implementation; it's our preferred backend library. We use "_spec_test"
    // as the name of the database because it's not the one we'll operate on,
    // but it's useful to make sure its using the right spec.
    // See: https://github.com/mozilla/localForage/issues/128
    var driverSupport = (function(self) {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        var indexedDB = indexedDB || self.indexedDB || self.webkitIndexedDB ||
                        self.mozIndexedDB || self.OIndexedDB ||
                        self.msIndexedDB;

        var result = {};

        result[DriverType.WEBSQL] = !!self.openDatabase;
        result[DriverType.INDEXEDDB] = !!(function() {
            // We mimic PouchDB here; just UA test for Safari (which, as of
            // iOS 8/Yosemite, doesn't properly support IndexedDB).
            // IndexedDB support is broken and different from Blink's.
            // This is faster than the test case (and it's sync), so we just
            // do this. *SIGH*
            // http://bl.ocks.org/nolanlawson/raw/c83e9039edf2278047e9/
            //
            // We test for openDatabase because IE Mobile identifies itself
            // as Safari. Oh the lulz...
            if (typeof self.openDatabase !== 'undefined' && self.navigator &&
                self.navigator.userAgent &&
                /Safari/.test(self.navigator.userAgent) &&
                !/Chrome/.test(self.navigator.userAgent)) {
                return false;
            }
            try {
                return indexedDB &&
                       typeof indexedDB.open === 'function' &&
                       // Some Samsung/HTC Android 4.0-4.3 devices
                       // have older IndexedDB specs; if this isn't available
                       // their IndexedDB is too old for us to use.
                       // (Replaces the onupgradeneeded test.)
                       typeof self.IDBKeyRange !== 'undefined';
            } catch (e) {
                return false;
            }
        })();

        result[DriverType.LOCALSTORAGE] = !!(function() {
            try {
                return (self.localStorage &&
                        ('setItem' in self.localStorage) &&
                        (self.localStorage.setItem));
            } catch (e) {
                return false;
            }
        })();

        return result;
    })(this);

    var isArray = Array.isArray || function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };

    function callWhenReady(localForageInstance, libraryMethod) {
        localForageInstance[libraryMethod] = function() {
            var _args = arguments;
            return localForageInstance.ready().then(function() {
                return localForageInstance[libraryMethod].apply(localForageInstance, _args);
            });
        };
    }

    function extend() {
        for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];

            if (arg) {
                for (var key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        if (isArray(arg[key])) {
                            arguments[0][key] = arg[key].slice();
                        } else {
                            arguments[0][key] = arg[key];
                        }
                    }
                }
            }
        }

        return arguments[0];
    }

    function isLibraryDriver(driverName) {
        for (var driver in DriverType) {
            if (DriverType.hasOwnProperty(driver) &&
                DriverType[driver] === driverName) {
                return true;
            }
        }

        return false;
    }

    class LocalForage {
        constructor(options) {
            this.INDEXEDDB = DriverType.INDEXEDDB;
            this.LOCALSTORAGE = DriverType.LOCALSTORAGE;
            this.WEBSQL = DriverType.WEBSQL;

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

            this.setDriver(this._config.driver);
        }

        // Set any config values for localForage; can be called anytime before
        // the first API call (e.g. `getItem`, `setItem`).
        // We loop through options so we don't overwrite existing config
        // values.
        config(options) {
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

                // after all config options are set and
                // the driver option is used, try setting it
                if ('driver' in options && options.driver) {
                    this.setDriver(this._config.driver);
                }

                return true;
            } else if (typeof(options) === 'string') {
                return this._config[options];
            } else {
                return this._config;
            }
        }

        // Used to define a custom driver, shared across all instances of
        // localForage.
        defineDriver(driverObject, callback, errorCallback) {
            var promise = new Promise(function(resolve, reject) {
                try {
                    var driverName = driverObject._driver;
                    var complianceError = new Error(
                        'Custom driver not compliant; see ' +
                        'https://mozilla.github.io/localForage/#definedriver'
                    );
                    var namingError = new Error(
                        'Custom driver name already in use: ' + driverObject._driver
                    );

                    // A driver name should be defined and not overlap with the
                    // library-defined, default drivers.
                    if (!driverObject._driver) {
                        reject(complianceError);
                        return;
                    }
                    if (isLibraryDriver(driverObject._driver)) {
                        reject(namingError);
                        return;
                    }

                    var customDriverMethods = LibraryMethods.concat('_initStorage');
                    for (var i = 0; i < customDriverMethods.length; i++) {
                        var customDriverMethod = customDriverMethods[i];
                        if (!customDriverMethod ||
                            !driverObject[customDriverMethod] ||
                            typeof driverObject[customDriverMethod] !== 'function') {
                            reject(complianceError);
                            return;
                        }
                    }

                    var supportPromise = Promise.resolve(true);
                    if ('_support'  in driverObject) {
                        if (driverObject._support && typeof driverObject._support === 'function') {
                            supportPromise = driverObject._support();
                        } else {
                            supportPromise = Promise.resolve(!!driverObject._support);
                        }
                    }

                    supportPromise.then(function(supportResult) {
                        driverSupport[driverName] = supportResult;
                        CustomDrivers[driverName] = driverObject;
                        resolve();
                    }, reject);
                } catch (e) {
                    reject(e);
                }
            });

            promise.then(callback, errorCallback);
            return promise;
        }

        driver() {
            return this._driver || null;
        }

        ready(callback) {
            var self = this;

            var promise = new Promise(function(resolve, reject) {
                self._driverSet.then(function() {
                    if (self._ready === null) {
                        self._ready = self._initStorage(self._config);
                    }

                    self._ready.then(resolve, reject);
                }).catch(reject);
            });

            promise.then(callback, callback);
            return promise;
        }

        setDriver(drivers, callback, errorCallback) {
            var self = this;

            if (typeof drivers === 'string') {
                drivers = [drivers];
            }

            this._driverSet = new Promise(function(resolve, reject) {
                var driverName = self._getFirstSupportedDriver(drivers);
                var error = new Error('No available storage method found.');

                if (!driverName) {
                    self._driverSet = Promise.reject(error);
                    reject(error);
                    return;
                }

                self._dbInfo = null;
                self._ready = null;

                if (isLibraryDriver(driverName)) {
                    var driverPromise;
                    switch (driverName) {
                        case self.INDEXEDDB:
                            driverPromise = System.import('./drivers/indexeddb');
                            break;
                        case self.LOCALSTORAGE:
                            driverPromise = System.import('./drivers/localstorage');
                            break;
                        case self.WEBSQL:
                            driverPromise = System.import('./drivers/websql');
                            break;
                    }
                    driverPromise.then(function(driver) {
                        self._extend(driver);
                        resolve();
                    });
                } else if (CustomDrivers[driverName]) {
                    self._extend(CustomDrivers[driverName]);
                    resolve();
                } else {
                    self._driverSet = Promise.reject(error);
                    reject(error);
                }
            });

            function setDriverToConfig() {
                self._config.driver = self.driver();
            }
            this._driverSet.then(setDriverToConfig, setDriverToConfig);

            this._driverSet.then(callback, errorCallback);
            return this._driverSet;
        }

        supports(driverName) {
            return !!driverSupport[driverName];
        }

        _extend(libraryMethodsAndProperties) {
            extend(this, libraryMethodsAndProperties);
        }

        // Used to determine which driver we should use as the backend for this
        // instance of localForage.
        _getFirstSupportedDriver(drivers) {
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

        createInstance(options) {
            return new LocalForage(options);
        }
    }

    // The actual localForage object that we expose as a module or via a
    // global. It's extended by pulling in one of our other libraries.
    var localForage = new LocalForage();

    export default localForage;
}).call(window);
