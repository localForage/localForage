// If IndexedDB isn't available, we'll fall back to localStorage.
// Note that this will have considerable performance and storage
// side-effects (all data will be serialized on save and only data that
// can be converted to a string via `JSON.stringify()` will be saved).
(function() {
    'use strict';

    var keyPrefix = '';
    var dbInfo = {
        name: 'localforage'
    };
    var Promise = window.Promise;
    var localStorage = null;

    // If the app is running inside a Google Chrome packaged webapp, or some
    // other context where localStorage isn't available, we don't use
    // localStorage. This feature detection is preferred over the old
    // `if (window.chrome && window.chrome.runtime)` code.
    // See: https://github.com/mozilla/localForage/issues/68
    try {
        // Initialize localStorage and create a variable to use throughout
        // the code.
        localStorage = window.localStorage;
    } catch (e) {
        return;
    }

    // Config the localStorage backend, using options set in
    // window.localForageConfig.
    function _initStorage(options) {
        if (options) {
            for (var i in dbInfo) {
                if (options[i] !== undefined) {
                    dbInfo[i] = options[i];
                }
            }
        }

        keyPrefix = dbInfo.name + '/';

        return Promise.resolve();
    }

    var SERIALIZED_MARKER = '__lfsc__';
    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

    // Remove all keys from the datastore, effectively destroying all data in
    // the app's key/value store!
    function clear(callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                localStorage.clear();

                if (callback) {
                    callback();
                }

                resolve();
            });
        });
    }

    function deserializeValue(value) {
        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
            return JSON.parse(value);
        }

        var type = value.substring(SERIALIZED_MARKER_LENGTH,
            SERIALIZED_MARKER_LENGTH + 4);

        var str = value.substring(SERIALIZED_MARKER_LENGTH + 5 /* type + colon */);

        // Fill the string into a ArrayBuffer.
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i = str.length - 1; i >= 0; i--) {
            bufView[i] = str.charCodeAt(i);
        }

        switch (type) {
            case 'arbf':
                return buf;
            case 'blob':
                return new Blob([buf]);
            case 'si08':
                return new Int8Array(buf);
            case 'ui08':
                return new Uint8Array(buf);
            case 'uic8':
                return new Uint8ClampedArray(buf);
            case 'si16':
                return new Int16Array(buf);
            case 'ur16':
                return new Uint16Array(buf);
            case 'ui32':
                return new Uint32Array(buf);
            case 'fl32':
                return new Float32Array(buf);
            case 'flt64':
                return new Float64Array(buf);
            default:
                throw new Error('Unkown type: ' + type);
        }
    }

    // Retrieve an item from the store. Unlike the original async_storage
    // library in Gaia, we don't modify return values at all. If a key's value
    // is `undefined`, we pass that value to the callback function.
    function getItem(key, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                try {
                    var result = localStorage.getItem(keyPrefix + key);

                    // If a result was found, parse it from the serialized
                    // string into a JS object. If result isn't truthy, the key
                    // is likely undefined and we'll pass it straight to the
                    // callback.
                    if (result) {
                        result = deserializeValue(result);
                    }

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    // Same as localStorage's key() method, except takes a callback.
    function key(n, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                var result = localStorage.key(n);

                // Remove the prefix from the key, if a key is found.
                if (result) {
                    result = result.substring(keyPrefix.length);
                }

                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        });
    }

    // Supply the number of keys in the datastore to the callback function.
    function length(callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                var result = localStorage.length;

                if (callback) {
                    callback(result);
                }

                resolve(result);
            });
        });
    }

    // Remove an item from the store, nice and simple.
    function removeItem(key, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                localStorage.removeItem(keyPrefix + key);

                if (callback) {
                    callback();
                }

                resolve();
            });
        });
    }

    function serializeValue(value, callback) {
        var valueString = '';
        if (value) {
            valueString = value.toString();
        }
        // Cannot use `value instanceof ArrayBuffer` or such here, as these
        // checks fail when running the tests using casper.js...
        if (value &&
            (value.toString() === '[object ArrayBuffer]' ||
                value.buffer && value.buffer.toString() === '[object ArrayBuffer]'))
        {
            // Convert binary arrays to a string and prefix the string with
            // a special marker.
            var buf;
            var marker = SERIALIZED_MARKER;
            if (value instanceof ArrayBuffer) {
                buf = value;
                marker += 'arbf:';
            } else {
                buf = value.buffer;
                if (valueString === '[object Int8Array]') {
                    marker += 'si08:';
                } else if (valueString === '[object Uint8Array]') {
                    marker += 'ui08:';
                } else if (valueString ===  '[object Uint8ClampedArray]') {
                    marker += 'uic8:';
                } else if (valueString ===  '[object Int16Array]') {
                    marker += 'si16:';
                } else if (valueString ===  '[object Uint16Array]') {
                    marker += 'ur16:';
                } else if (valueString ===  '[object Int32Array]') {
                    marker += 'si32:';
                } else if (valueString ===  '[object Uint32Array]') {
                    marker += 'ui32:';
                } else if (valueString ===  '[object Float32Array]') {
                    marker += 'fl32:';
                } else if (valueString ===  '[object Float64Array]') {
                    marker += 'fl64:';
                } else {
                    callback(new Error("Failed to get type for BinaryArray"));
                }
            }

            var str = '';
            var uint16Array = new Uint16Array(buf);
            try {
                str = String.fromCharCode.apply(null, uint16Array);
            } catch (e) {
                // This is a fallback implementation in case the first one does
                // not work. This is required to get the phantomjs passing...
                for (var i = 0; i < uint16Array.length; i++) {
                    str += String.fromCharCode(uint16Array[i]);
                }
            }
            callback(null, marker + str);
        } else if (valueString === "[object Blob]") {
            // Conver the blob to a binaryArray and then to a string.
            var fileReader = new FileReader();
            fileReader.onload = function() {
                var resializedString = String.fromCharCode.apply(
                    null, new Uint16Array(this.result));
                callback(null, SERIALIZED_MARKER + 'blob:' + resializedString);
            };
            fileReader.readAsArrayBuffer(value);
        } else {
            try {
                callback(null, JSON.stringify(value));
            } catch (e) {
                console.error("Couldn't convert value into a JSON string: ",
                              value);
                callback(e);
            }
        }
    }

    // Set a key's value and run an optional callback once the value is set.
    // Unlike Gaia's implementation, the callback function is passed the value,
    // in case you want to operate on that value only after you're sure it
    // saved, or something like that.
    function setItem(key, value, callback) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.ready().then(function() {
                // Convert undefined values to null.
                // https://github.com/mozilla/localForage/pull/42
                if (value === undefined) {
                    value = null;
                }

                // Save the original value to pass to the callback.
                var originalValue = value;

                serializeValue(value, function setSerialized(error, value) {
                    if (error) {
                        reject(error);
                    } else {
                        localStorage.setItem(keyPrefix + key, value);

                        if (callback) {
                            callback(originalValue);
                        }

                        resolve(originalValue);
                    }
                });
            });
        });
    }

    var localStorageWrapper = {
        _driver: 'localStorageWrapper',
        _initStorage: _initStorage,
        // Default API, from Gaia/localStorage.
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('localStorageWrapper', function() {
            return localStorageWrapper;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = localStorageWrapper;
    } else {
        this.localStorageWrapper = localStorageWrapper;
    }
}).call(this);
