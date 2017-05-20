(function() {
    'use strict';

    // Promises!
    var Promise = (typeof module !== 'undefined' && module.exports) ?
                  require('promise') : this.Promise;

    var chromeStorageLocal = chrome.storage.local;

    // Config the chromeStorageLocal backend, using options set in the config.
    // REFER : https://developer.chrome.com/extensions/storage
    function _initStorage(options) {
        var self = this;

        var dbInfo = {};
        if (options) {
            for (var i in options) {
                dbInfo[i] = options[i];
            }
        }

        dbInfo.keyPrefix = dbInfo.name + '/';

        self._dbInfo = dbInfo;
        return Promise.resolve();
    }

    function clear(callback) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {

                chromeStorageLocal.clear(function(){
                  resolve();
                });

            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function getItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            window.console.warn(key +
                                ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {
                try {
                    var dbInfo = self._dbInfo;
                    var prefixedKey = dbInfo.keyPrefix + key
                    chromeStorageLocal.get(prefixedKey, function(data){
                      if(data[prefixedKey]){
                        var result = _deserialize(data[prefixedKey]);
                        resolve(result);
                      }
                      else{
                        resolve();
                      }
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function iterate(callback) {
        var self = this;

        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {
                try {
                  var db = {};
                  chromeStorageLocal.get(null, function(data){
                    db = data;

                    for (var key in db) {
                        var result = db[key];

                        if (result) {
                            result = _deserialize(result);
                        }

                        callback(result, key);
                    }

                    resolve();
                  });
                } catch (e) {
                    reject(e);
                }
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function key(n, callback) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {
                var db = {};
                chromeStorageLocal.get(null, function(data){
                  db = data;
                  var result = null;
                  var index = 0;

                  for (var key in db) {
                      if (db.hasOwnProperty(key) && db[key] !== undefined) {
                          if (n === index) {
                              result = key;
                              break;
                          }
                          index++;
                      }
                  }

                  resolve(result);
                })
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function keys(callback) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {

                var db = {};
                chromeStorageLocal.get(null, function(data){
                  db = data;
                  var keys = [];

                  for (var key in db) {
                      if (db.hasOwnProperty(key)) {
                          keys.push(key);
                      }
                  }

                  resolve(keys);
                });
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function length(callback) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.keys().then(function(keys) {
                resolve(keys.length);
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function removeItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            window.console.warn(key +
                                ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {
              var dbInfo = self._dbInfo;
              var prefixedKey = dbInfo.keyPrefix + key

              chromeStorageLocal.remove(prefixedKey, function(){
                  resolve();
              });
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    function setItem(key, value, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            window.console.warn(key +
                                ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = new Promise(function(resolve, reject) {
            self.ready().then(function() {
                // Convert undefined values to null.
                // https://github.com/mozilla/localForage/pull/42
                if (value === undefined) {
                    value = null;
                }

                // Save the original value to pass to the callback.
                var originalValue = value;

                _serialize(value, function(value, error) {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            var dbInfo = self._dbInfo;
                            var prefixedKey = dbInfo.keyPrefix + key;
                            var obj = {};
                            obj[prefixedKey] = value;

                            chromeStorageLocal.set(obj, function(){
                              resolve(originalValue);
                            });

                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            }).catch(reject);
        });

        executeCallback(promise, callback);
        return promise;
    }

    // _deserialize : chrome storage automatically serializes objects
    function _serialize(value, callback) {
      /*
        Hack fix... chrome.storage.local serializer stores functions on an object into the storage area as:
          {testFunction: {}}
        stringify & parse gets rid of these
      */
      callback(JSON.parse(JSON.stringify(value)));
    }

    // _deserialize : chrome storage automatically deserializes objects
    function _deserialize(value) {
        return value
    }

    function executeCallback(promise, callback) {
        if (callback) {
            promise.then(function(result) {
                callback(null, result);
            }, function(error) {
                callback(error);
            });
        }
    }

    var chromeStorageLocalDriver = {
        _driver: 'chromeStorageLocalDriver',
        _initStorage: _initStorage,
        // _supports: function() { return true; }
        iterate: iterate,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key,
        keys: keys
    };

    if (typeof define === 'function' && define.amd) {
        define('chromeStorageLocalDriver', function() {
            return chromeStorageLocalDriver;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = chromeStorageLocalDriver;
    } else {
        this.chromeStorageLocalDriver = chromeStorageLocalDriver;
    }
}).call(window);

localforage.defineDriver(chromeStorageLocalDriver);
