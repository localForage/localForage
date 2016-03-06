import isIndexedDBValid from './utils/isIndexedDBValid';
import isWebSQLValid from './utils/isWebSQLValid';
import isLocalStorageValid from './utils/isLocalStorageValid';
import idbDriver from './drivers/indexeddb';
import websqlDriver from './drivers/websql';
import localstorageDriver from './drivers/localstorage';
import serializer from './utils/serializer';
import Promise from './utils/promise';
import executeTwoCallbacks from './utils/executeTwoCallbacks';

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

var driverSupport = {};
// Check to see if IndexedDB is available and if it is the latest
// implementation; it's our preferred backend library. We use "_spec_test"
// as the name of the database because it's not the one we'll operate on,
// but it's useful to make sure its using the right spec.
// See: https://github.com/mozilla/localForage/issues/128
driverSupport[DriverType.INDEXEDDB] = isIndexedDBValid();

driverSupport[DriverType.WEBSQL] = isWebSQLValid();

driverSupport[DriverType.LOCALSTORAGE] = isLocalStorageValid();

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

        this._defaultConfig = extend({}, DefaultConfig);
        this._config = extend({}, this._defaultConfig, options);
        this._driverSet = null;
        this._initDriver = null;
        this._ready = false;
        this._dbInfo = null;

        this._wrapLibraryMethodsWithReady();
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
                    if (!customDriverMethod || !driverObject[customDriverMethod] ||
                        typeof driverObject[customDriverMethod] !== 'function') {
                        reject(complianceError);
                        return;
                    }
                }

                var supportPromise = Promise.resolve(true);
                if ('_support' in driverObject) {
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

        executeTwoCallbacks(promise, callback, errorCallback);
        return promise;
    }

    driver() {
        return this._driver || null;
    }

    getDriver(driverName, callback, errorCallback) {
        var self = this;
        var getDriverPromise = Promise.resolve().then(() => {
            if (isLibraryDriver(driverName)) {
                switch (driverName) {
                    case self.INDEXEDDB:
                        return idbDriver;
                    case self.LOCALSTORAGE:
                        return localstorageDriver;
                    case self.WEBSQL:
                        return websqlDriver;
                }
            } else if (CustomDrivers[driverName]) {
                return CustomDrivers[driverName];
            } else {
                throw new Error('Driver not found.');
            }
        });
        executeTwoCallbacks(getDriverPromise, callback, errorCallback);
        return getDriverPromise;
    }

    getSerializer(callback) {
        var serializerPromise = Promise.resolve(serializer);
        executeTwoCallbacks(serializerPromise, callback);
        return serializerPromise;
    }

    ready(callback) {
        var self = this;

        var promise = self._driverSet.then(() => {
            if (self._ready === null) {
                self._ready = self._initDriver();
            }

            return self._ready;
        });

        executeTwoCallbacks(promise, callback, callback);
        return promise;
    }

    setDriver(drivers, callback, errorCallback) {
        var self = this;

        if (!isArray(drivers)) {
            drivers = [drivers];
        }

        var supportedDrivers = this._getSupportedDrivers(drivers);

        function setDriverToConfig() {
            self._config.driver = self.driver();
        }

        function initDriver(supportedDrivers) {
            return function() {
                var currentDriverIndex = 0;

                function driverPromiseLoop() {
                    while (currentDriverIndex < supportedDrivers.length) {
                        var driverName = supportedDrivers[currentDriverIndex];
                        currentDriverIndex++;

                        self._dbInfo = null;
                        self._ready = null;

                        return self.getDriver(driverName)
                            .then(driver => {
                                self._extend(driver);
                                setDriverToConfig();

                                self._ready = self._initStorage(self._config);
                                return self._ready;
                            })
                            .catch(driverPromiseLoop);
                    }

                    setDriverToConfig();
                    var error = new Error('No available storage method found.');
                    self._driverSet = Promise.reject(error);
                    return self._driverSet;
                }

                return driverPromiseLoop();
            };
        }

        // There might be a driver initialization in progress
        // so wait for it to finish in order to avoid a possible
        // race condition to set _dbInfo
        var oldDriverSetDone = this._driverSet !== null ?
            this._driverSet.catch(() => Promise.resolve()) :
            Promise.resolve();

        this._driverSet = oldDriverSetDone.then(() => {
            var driverName = supportedDrivers[0];
            self._dbInfo = null;
            self._ready = null;

            return self.getDriver(driverName)
                .then(driver => {
                    self._driver = driver._driver;
                    setDriverToConfig();
                    self._wrapLibraryMethodsWithReady();
                    self._initDriver = initDriver(supportedDrivers);
                });
        }).catch(() => {
            setDriverToConfig();
            var error = new Error('No available storage method found.');
            self._driverSet = Promise.reject(error);
            return self._driverSet;
        });

        executeTwoCallbacks(this._driverSet, callback, errorCallback);
        return this._driverSet;
    }

    supports(driverName) {
        return !!driverSupport[driverName];
    }

    _extend(libraryMethodsAndProperties) {
        extend(this, libraryMethodsAndProperties);
    }

    _getSupportedDrivers(drivers) {
        var supportedDrivers = [];
        for (var i = 0, len = drivers.length; i < len; i++) {
            var driverName = drivers[i];
            if (this.supports(driverName)) {
                supportedDrivers.push(driverName);
            }
        }
        return supportedDrivers;
    }

    _wrapLibraryMethodsWithReady() {
        // Add a stub for each driver API method that delays the call to the
        // corresponding driver method until localForage is ready. These stubs
        // will be replaced by the driver methods as soon as the driver is
        // loaded, so there is no performance impact.
        for (var i = 0; i < LibraryMethods.length; i++) {
            callWhenReady(this, LibraryMethods[i]);
        }
    }

    createInstance(options) {
        return new LocalForage(options);
    }
}

// The actual localForage object that we expose as a module or via a
// global. It's extended by pulling in one of our other libraries.
export default new LocalForage();
