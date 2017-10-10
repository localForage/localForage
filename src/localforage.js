import idbDriver from './drivers/indexeddb';
import websqlDriver from './drivers/websql';
import localstorageDriver from './drivers/localstorage';
import serializer from './utils/serializer';
import Promise from './utils/promise';
import executeTwoCallbacks from './utils/executeTwoCallbacks';
import isArray from './utils/isArray';

// Drivers are stored here when `defineDriver()` is called.
// They are shared across all instances of localForage.
const DefinedDrivers = {};

const DriverSupport = {};

const DefaultDrivers = {
    INDEXEDDB: idbDriver,
    WEBSQL: websqlDriver,
    LOCALSTORAGE: localstorageDriver
};

const DefaultDriverOrder = [
    DefaultDrivers.INDEXEDDB._driver,
    DefaultDrivers.WEBSQL._driver,
    DefaultDrivers.LOCALSTORAGE._driver
];

const LibraryMethods = [
    'clear',
    'getItem',
    'iterate',
    'key',
    'keys',
    'length',
    'removeItem',
    'setItem'
];

const DefaultConfig = {
    description: '',
    driver: DefaultDriverOrder.slice(),
    name: 'localforage',
    // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
    // we can use without a prompt.
    size: 4980736,
    storeName: 'keyvaluepairs',
    version: 1.0
};

function callWhenReady(localForageInstance, libraryMethod) {
    localForageInstance[libraryMethod] = function() {
        const _args = arguments;
        return localForageInstance.ready().then(function() {
            return localForageInstance[libraryMethod].apply(localForageInstance, _args);
        });
    };
}

function extend() {
    for (let i = 1; i < arguments.length; i++) {
        const arg = arguments[i];

        if (arg) {
            for (let key in arg) {
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

class LocalForage {
    constructor(options) {
        for (let driverTypeKey in DefaultDrivers) {
            if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
                const driver = DefaultDrivers[driverTypeKey];
                const driverName = driver._driver;
                this[driverTypeKey] = driverName;

                if (!DefinedDrivers[driverName]) {
                    // we don't need to wait for the promise,
                    // since the default drivers can be defined
                    // in a blocking manner
                    this.defineDriver(driver);
                }
            }
        }

        this._defaultConfig = extend({}, DefaultConfig);
        this._config = extend({}, this._defaultConfig, options);
        this._driverSet = null;
        this._initDriver = null;
        this._ready = false;
        this._dbInfo = null;

        this._wrapLibraryMethodsWithReady();
        this.setDriver(this._config.driver).catch(() => {});
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
                return new Error('Can\'t call config() after localforage ' +
                    'has been used.');
            }

            for (let i in options) {
                if (i === 'storeName') {
                    options[i] = options[i].replace(/\W/g, '_');
                }

                if (i === 'version' && typeof options[i] !== 'number') {
                    return new Error('Database version must be a number.');
                }

                this._config[i] = options[i];
            }

            // after all config options are set and
            // the driver option is used, try setting it
            if ('driver' in options && options.driver) {
                return this.setDriver(this._config.driver);
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
        const promise = new Promise(function(resolve, reject) {
            try {
                const driverName = driverObject._driver;
                const complianceError = new Error(
                    'Custom driver not compliant; see ' +
                    'https://mozilla.github.io/localForage/#definedriver'
                );

                // A driver name should be defined and not overlap with the
                // library-defined, default drivers.
                if (!driverObject._driver) {
                    reject(complianceError);
                    return;
                }

                const driverMethods = LibraryMethods.concat('_initStorage');
                for (let i = 0, len = driverMethods.length; i < len; i++) {
                    const customDriverMethod = driverMethods[i];
                    if (!customDriverMethod || !driverObject[customDriverMethod] ||
                        typeof driverObject[customDriverMethod] !== 'function') {
                        reject(complianceError);
                        return;
                    }
                }

                const setDriverSupport = function(support) {
                    if (DefinedDrivers[driverName]) {
                        console.info(`Redefining LocalForage driver: ${driverName}`);
                    }
                    DefinedDrivers[driverName] = driverObject;
                    DriverSupport[driverName] = support;
                    // don't use a then, so that we can define
                    // drivers that have simple _support methods
                    // in a blocking manner
                    resolve();
                };

                if ('_support' in driverObject) {
                    if (driverObject._support && typeof driverObject._support === 'function') {
                        driverObject._support().then(setDriverSupport, reject);
                    } else {
                        setDriverSupport(!!driverObject._support);
                    }
                } else {
                    setDriverSupport(true);
                }
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
        const getDriverPromise = DefinedDrivers[driverName] ?
            Promise.resolve(DefinedDrivers[driverName]) :
            Promise.reject(new Error('Driver not found.'));

        executeTwoCallbacks(getDriverPromise, callback, errorCallback);
        return getDriverPromise;
    }

    getSerializer(callback) {
        const serializerPromise = Promise.resolve(serializer);
        executeTwoCallbacks(serializerPromise, callback);
        return serializerPromise;
    }

    ready(callback) {
        const self = this;

        const promise = self._driverSet.then(() => {
            if (self._ready === null) {
                self._ready = self._initDriver();
            }

            return self._ready;
        });

        executeTwoCallbacks(promise, callback, callback);
        return promise;
    }

    setDriver(drivers, callback, errorCallback) {
        const self = this;

        if (!isArray(drivers)) {
            drivers = [drivers];
        }

        const supportedDrivers = this._getSupportedDrivers(drivers);

        function setDriverToConfig() {
            self._config.driver = self.driver();
        }

        function extendSelfWithDriver(driver) {
            self._extend(driver);
            setDriverToConfig();

            self._ready = self._initStorage(self._config);
            return self._ready;
        }

        function initDriver(supportedDrivers) {
            return function() {
                let currentDriverIndex = 0;

                function driverPromiseLoop() {
                    while (currentDriverIndex < supportedDrivers.length) {
                        let driverName = supportedDrivers[currentDriverIndex];
                        currentDriverIndex++;

                        self._dbInfo = null;
                        self._ready = null;

                        return self.getDriver(driverName)
                            .then(extendSelfWithDriver)
                            .catch(driverPromiseLoop);
                    }

                    setDriverToConfig();
                    const error = new Error('No available storage method found.');
                    self._driverSet = Promise.reject(error);
                    return self._driverSet;
                }

                return driverPromiseLoop();
            };
        }

        // There might be a driver initialization in progress
        // so wait for it to finish in order to avoid a possible
        // race condition to set _dbInfo
        const oldDriverSetDone = this._driverSet !== null ?
            this._driverSet.catch(() => Promise.resolve()) :
            Promise.resolve();

        this._driverSet = oldDriverSetDone.then(() => {
            const driverName = supportedDrivers[0];
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
            const error = new Error('No available storage method found.');
            self._driverSet = Promise.reject(error);
            return self._driverSet;
        });

        executeTwoCallbacks(this._driverSet, callback, errorCallback);
        return this._driverSet;
    }

    supports(driverName) {
        return !!DriverSupport[driverName];
    }

    _extend(libraryMethodsAndProperties) {
        extend(this, libraryMethodsAndProperties);
    }

    _getSupportedDrivers(drivers) {
        const supportedDrivers = [];
        for (let i = 0, len = drivers.length; i < len; i++) {
            const driverName = drivers[i];
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
        for (let i = 0, len = LibraryMethods.length; i < len; i++) {
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
