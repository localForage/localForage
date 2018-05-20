// If no driver is available, we'll fall back to simple in memory storage.
// Note that this will have considerable performance and storage
// side-effects and data will be lost when the user reloads the page

import serializer from '../utils/serializer';
import Promise from '../utils/promise';
import executeCallback from '../utils/executeCallback';
import normalizeKey from '../utils/normalizeKey';
import getCallback from '../utils/getCallback';

const storageRepository = {};

function _getDB({ name, storeName }) {
    const database = (storageRepository[name] = storageRepository[name] || {});
    const table = (database[storeName] = database[storeName] || {});
    return table;
}

function _initStorage(options) {
    const self = this;

    const dbInfo = {};
    if (options) {
        for (const i in options) {
            dbInfo[i] = options[i];
        }
    }

    dbInfo._getDB = () => _getDB(dbInfo);

    self._dbInfo = dbInfo;
    dbInfo.serializer = serializer;

    return Promise.resolve();
}

function clear(callback) {
    const promise = this.ready().then(() => {
        const { name, storeName } = this._dbInfo;
        const database = (storageRepository[name] =
            storageRepository[name] || {});
        database[storeName] = {};
    });

    executeCallback(promise, callback);
    return promise;
}

function getItem(key, callback) {
    const self = this;

    key = normalizeKey(key);

    const promise = self.ready().then(function() {
        const db = self._dbInfo._getDB();
        let result = db[key];

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

function iterate(iterator, callback) {
    const self = this;

    const promise = self.ready().then(function() {
        const db = self._dbInfo._getDB();

        let iterationNumber = 1;
        for (const key in db) {
            if (db.hasOwnProperty(key)) {
                let value = db[key];

                if (value) {
                    value = self._dbInfo.serializer.deserialize(value);
                }

                value = iterator(value, key, iterationNumber++);

                if (value !== void 0) {
                    return value;
                }
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

function key(n, callback) {
    const self = this;
    const promise = self.ready().then(function() {
        const db = self._dbInfo._getDB();
        let result = null;
        let index = 0;

        for (const key in db) {
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
    const self = this;
    const promise = self.ready().then(function() {
        const db = self._dbInfo._getDB();
        const keys = [];

        for (const key in db) {
            if (db.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        return keys;
    });

    executeCallback(promise, callback);
    return promise;
}

function length(callback) {
    const self = this;
    const promise = self.keys().then(function(keys) {
        return keys.length;
    });

    executeCallback(promise, callback);
    return promise;
}

function removeItem(key, callback) {
    const self = this;

    key = normalizeKey(key);

    const promise = self.ready().then(function() {
        const db = self._dbInfo._getDB();
        if (db.hasOwnProperty(key)) {
            delete db[key];
        }
    });

    executeCallback(promise, callback);
    return promise;
}

function serializeAsync(serializer, value) {
    return new Promise(function(resolve, reject) {
        serializer.serialize(value, function(value, error) {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

function setItem(key, value, callback) {
    const self = this;

    key = normalizeKey(key);

    const promise = self.ready().then(function() {
        // Convert undefined values to null.
        // https://github.com/mozilla/localForage/pull/42
        if (value === undefined) {
            value = null;
        }

        // Save the original value to pass to the callback.
        const originalValue = value;

        return serializeAsync(self._dbInfo.serializer, value).then(function(
            value
        ) {
            const db = self._dbInfo._getDB();
            db[key] = value;
            return originalValue;
        });
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance(options, callback) {
    callback = getCallback.apply(this, arguments);

    options = (typeof options !== 'function' && options) || {};
    if (!options.name) {
        const currentConfig = this.config();
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    let promise;
    if (!options.name) {
        promise = Promise.reject('Invalid arguments');
    } else {
        const database = storageRepository[options.name];
        if (!database) {
            return;
        }

        if (!options.storeName) {
            delete storageRepository[options.name];
        } else {
            const table = database[options.storeName];
            if (table) {
                delete database[options.storeName];
            }
        }
        promise = Promise.resolve();
    }

    executeCallback(promise, callback);
    return promise;
}

const memoryStorage = {
    _driver: 'memoryStorage',
    _initStorage: _initStorage,
    iterate: iterate,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key,
    keys: keys,
    dropInstance: dropInstance
};

export default memoryStorage;
