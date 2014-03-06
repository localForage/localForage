/*!
    localForage -- Offline Storage, Improved
    http://mozilla.github.io/localForage
    (c) 2013-2014 Mozilla, Apache License 2.0
*/
// ES6 Promises Polyfill
// Version 0.1.1
// https://github.com/jakearchibald/ES6-Promises
// http://s3.amazonaws.com/es6-promises/promise-0.1.1.js
// MIT license
// (https://github.com/jakearchibald/ES6-Promises/blob/master/LICENSE)
(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("promise/all", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;

    /**
      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The return promise
      is fulfilled with an array that gives all the values in the order they were
      passed in the `promises` array argument.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP
      @param {Array} promises
      @param {String} label
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    function all(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to all.');
      }

      return new Promise(function(resolve, reject) {
        var results = [], remaining = promises.length,
        promise;

        if (remaining === 0) {
          resolve([]);
        }

        function resolver(index) {
          return function(value) {
            resolveAll(index, value);
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && isFunction(promise.then)) {
            promise.then(resolver(i), reject);
          } else {
            resolveAll(i, promise);
          }
        }
      });
    }

    __exports__.all = all;
  });
define("promise/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var local = (typeof global !== 'undefined') ? global : this;

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        local.setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    }

    __exports__.asap = asap;
  });
define("promise/cast", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.Promise.cast` returns the same promise if that promise shares a constructor
      with the promise being casted.

      Example:

      ```javascript
      var promise = RSVP.resolve(1);
      var casted = RSVP.Promise.cast(promise);

      console.log(promise === casted); // true
      ```

      In the case of a promise whose constructor does not match, it is assimilated.
      The resulting promise will fulfill or reject based on the outcome of the
      promise being casted.

      In the case of a non-promise, a promise which will fulfill with that value is
      returned.

      Example:

      ```javascript
      var value = 1; // could be a number, boolean, string, undefined...
      var casted = RSVP.Promise.cast(value);

      console.log(value === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(val) {
        val === value // => true
      });
      ```

      `RSVP.Promise.cast` is similar to `RSVP.resolve`, but `RSVP.Promise.cast` differs in the
      following ways:
      * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
      have something that could either be a promise or a value. RSVP.resolve
      will have the same effect but will create a new promise wrapper if the
      argument is a promise.
      * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
      promises of the exact class specified, so that the resulting object's `then` is
      ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

      @method cast
      @for RSVP
      @param {Object} object to be casted
      @return {Promise} promise that is fulfilled when all properties of `promises`
      have been fulfilled, or rejected if any of them become rejected.
    */


    function cast(object) {
      /*jshint validthis:true */
      if (object && typeof object === 'object' && object.constructor === this) {
        return object;
      }

      var Promise = this;

      return new Promise(function(resolve) {
        resolve(object);
      });
    }

    __exports__.cast = cast;
  });
define("promise/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var config = {
      instrument: false
    };

    function configure(name, value) {
      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("promise/polyfill", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var RSVPPromise = __dependency1__.Promise;
    var isFunction = __dependency2__.isFunction;

    function polyfill() {
      var es6PromiseSupport = 
        "Promise" in window &&
        // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        "cast" in window.Promise &&
        "resolve" in window.Promise &&
        "reject" in window.Promise &&
        "all" in window.Promise &&
        "race" in window.Promise &&
        // Older version of the spec had a resolver object
        // as the arg rather than a function
        (function() {
          var resolve;
          new window.Promise(function(r) { resolve = r; });
          return isFunction(resolve);
        }());

      if (!es6PromiseSupport) {
        window.Promise = RSVPPromise;
      }
    }

    __exports__.polyfill = polyfill;
  });
define("promise/promise", 
  ["./config","./utils","./cast","./all","./race","./resolve","./reject","./asap","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var configure = __dependency1__.configure;
    var objectOrFunction = __dependency2__.objectOrFunction;
    var isFunction = __dependency2__.isFunction;
    var now = __dependency2__.now;
    var cast = __dependency3__.cast;
    var all = __dependency4__.all;
    var race = __dependency5__.race;
    var staticResolve = __dependency6__.resolve;
    var staticReject = __dependency7__.reject;
    var asap = __dependency8__.asap;

    var counter = 0;

    config.async = asap; // default async is asap;

    function Promise(resolver) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._subscribers = [];

      invokeResolver(resolver, this);
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
      constructor: Promise,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      then: function(onFulfillment, onRejection) {
        var promise = this;

        var thenPromise = new this.constructor(function() {});

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        return thenPromise;
      },

      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };

    Promise.all = all;
    Promise.cast = cast;
    Promise.race = race;
    Promise.resolve = staticResolve;
    Promise.reject = staticReject;

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            });

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      publish(promise, promise._state = REJECTED);
    }

    __exports__.Promise = Promise;
  });
define("promise/race", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */
    var isArray = __dependency1__.isArray;

    /**
      `RSVP.race` allows you to watch a series of promises and act as soon as the
      first promise given to the `promises` argument fulfills or rejects.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.race` is deterministic in that only the state of the first completed
      promise matters. For example, even if other promises given to the `promises`
      array argument are resolved, but the first completed promise has become
      rejected before the other promises became fulfilled, the returned promise
      will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise that becomes fulfilled with the value the first
      completed promises is resolved with if the first completed promise was
      fulfilled, or rejected with the reason that the first completed promise
      was rejected with.
    */
    function race(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to race.');
      }
      return new Promise(function(resolve, reject) {
        var results = [], promise;

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && typeof promise.then === 'function') {
            promise.then(resolve, reject);
          } else {
            resolve(promise);
          }
        }
      });
    }

    __exports__.race = race;
  });
define("promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.reject` returns a promise that will become rejected with the passed
      `reason`. `RSVP.reject` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become rejected with the given
      `reason`.
    */
    function reject(reason) {
      /*jshint validthis:true */
      var Promise = this;

      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }

    __exports__.reject = reject;
  });
define("promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.resolve` returns a promise that will become fulfilled with the passed
      `value`. `RSVP.resolve` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @for RSVP
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    function resolve(value) {
      /*jshint validthis:true */
      var Promise = this;
      return new Promise(function(resolve, reject) {
        resolve(value);
      });
    }

    __exports__.resolve = resolve;
  });
define("promise/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return isFunction(x) || (typeof x === "object" && x !== null);
    }

    function isFunction(x) {
      return typeof x === "function";
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };


    __exports__.objectOrFunction = objectOrFunction;
    __exports__.isFunction = isFunction;
    __exports__.isArray = isArray;
    __exports__.now = now;
  });
requireModule('promise/polyfill').polyfill();
}());
(function() {
    'use strict';

    // Originally found in https://github.com/mozilla-b2g/gaia/blob/e8f624e4cc9ea945727278039b3bc9bcb9f8667a/shared/js/async_storage.js

    var DBNAME = 'localforage';
    var DBVERSION = 1;
    var STORENAME = 'keyvaluepairs';
    var Promise = window.Promise;
    var db = null;

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // If IndexedDB isn't available, we get outta here!
    if (!indexedDB) {
        return;
    }

    function withStore(type, f, reject) {
        if (db) {
            f(db.transaction(STORENAME, type).objectStore(STORENAME));
        } else {
            var openreq = indexedDB.open(DBNAME, DBVERSION);
            openreq.onerror = function withStoreOnError() {
                reject(openreq.error.name);
            };
            openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
                // First time setup: create an empty object store
                openreq.result.createObjectStore(STORENAME);
            };
            openreq.onsuccess = function withStoreOnSuccess() {
                db = openreq.result;
                f(db.transaction(STORENAME, type).objectStore(STORENAME));
            };
        }
    }

    function getItem(key, callback) {
        return new Promise(function(resolve, reject) {
            withStore('readonly', function getItemBody(store) {
                var req = store.get(key);
                req.onsuccess = function getItemOnSuccess() {
                    var value = req.result;
                    if (value === undefined) {
                        value = null;
                    }

                    if (callback) {
                        callback(value);
                    }

                    resolve(value);
                };
                req.onerror = function getItemOnError() {
                    reject(req.error.name);
                };
            }, reject);
        });
    }

    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function setItemBody(store) {
                // Cast to undefined so the value passed to callback/promise is
                // the same as what one would get out of `getItem()` later.
                // This leads to some weirdness (setItem('foo', undefined) will
                // return "null"), but it's not my fault localStorage is our
                // baseline and that it's weird.
                if (value === undefined) {
                    value = null;
                }

                var req = store.put(value, key);
                req.onsuccess = function setItemOnSuccess() {
                    if (callback) {
                        callback(value);
                    }

                    resolve(value);
                };
                req.onerror = function setItemOnError() {
                    reject(req.error.name);
                };
            }, reject);
        });
    }

    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function removeItemBody(store) {
                // We use `['delete']` instead of `.delete` because IE 8 will
                // throw a fit if it sees the reserved word "delete" in this
                // scenario. See: https://github.com/mozilla/localForage/pull/67
                //
                // This can be removed once we no longer care about IE 8, for
                // what that's worth.
                // TODO: Write a test against this? Maybe IE in general? Also,
                // make sure the minify step doesn't optimise this to `.delete`,
                // though it currently doesn't.
                var req = store['delete'](key);
                req.onsuccess = function removeItemOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function removeItemOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function clear(callback) {
        return new Promise(function(resolve, reject) {
            withStore('readwrite', function clearBody(store) {
                var req = store.clear();
                req.onsuccess = function clearOnSuccess() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                };
                req.onerror = function clearOnError() {
                    reject(req.error.name);
                };
            }, reject);
        });
    }

    function length(callback) {
        return new Promise(function(resolve, reject) {
            withStore('readonly', function lengthBody(store) {
                var req = store.count();
                req.onsuccess = function lengthOnSuccess() {
                    if (callback) {
                        callback(req.result);
                    }

                    resolve(req.result);
                };
                req.onerror = function lengthOnError() {
                    reject(req.error.name);
                };
            });
        });
    }

    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            if (n < 0) {
                if (callback) {
                    callback(null);
                }

                resolve(null);

                return;
            }

            withStore('readonly', function keyBody(store) {
                var advanced = false;
                var req = store.openCursor();
                req.onsuccess = function keyOnSuccess() {
                    var cursor = req.result;
                    if (!cursor) {
                        // this means there weren't enough keys
                        if (callback) {
                            callback(null);
                        }

                        resolve(null);

                        return;
                    }
                    if (n === 0) {
                        // We have the first key, return it if that's what they wanted
                        if (callback) {
                            callback(cursor.key);
                        }

                        resolve(cursor.key);
                    } else {
                        if (!advanced) {
                            // Otherwise, ask the cursor to skip ahead n records
                            advanced = true;
                            cursor.advance(n);
                        } else {
                            // When we get here, we've got the nth key.
                            if (callback) {
                                callback(cursor.key);
                            }

                            resolve(cursor.key);
                        }
                    }
                };

                req.onerror = function keyOnError() {
                    reject(req.error.name);
                };
            }, reject);
        });
    }

    var asyncStorage = {
        driver: 'asyncStorage',
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('asyncStorage', function() {
            return asyncStorage;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = asyncStorage;
    } else {
        this.asyncStorage = asyncStorage;
    }
}).call(this);
// If IndexedDB isn't available, we'll fall back to localStorage.
// Note that this will have considerable performance and storage
// side-effects (all data will be serialized on save and only data that
// can be converted to a string via `JSON.stringify()` will be saved).
(function() {
    'use strict';

    var localStorage;
    var Promise = window.Promise;

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

    // Remove all keys from the datastore, effectively destroying all data in
    // the app's key/value store!
    function clear(callback) {
        return new Promise(function(resolve, reject) {
            localStorage.clear();

            if (callback) {
                callback();
            }

            resolve();
        });
    }

    // Retrieve an item from the store. Unlike the original async_storage
    // library in Gaia, we don't modify return values at all. If a key's value
    // is `undefined`, we pass that value to the callback function.
    function getItem(key, callback) {
        return new Promise(function(resolve, reject) {
            try {
                var result = localStorage.getItem(key);

                // If a result was found, parse it from serialized JSON into a
                // JS object. If result isn't truthy, the key is likely
                // undefined and we'll pass it straight to the callback.
                if (result) {
                    result = JSON.parse(result);
                }

                if (callback) {
                    callback(result);
                }

                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    // Same as localStorage's key() method, except takes a callback.
    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            var result = localStorage.key(n);

            if (callback) {
                callback(result);
            }

            resolve(result);
        });
    }

    // Supply the number of keys in the datastore to the callback function.
    function length(callback) {
        return new Promise(function(resolve, reject) {
            var result = localStorage.length;

            if (callback) {
                callback(result);
            }

            resolve(result);
        });
    }

    // Remove an item from the store, nice and simple.
    function removeItem(key, callback) {
        return new Promise(function(resolve, reject) {
            localStorage.removeItem(key);

            if (callback) {
                callback();
            }

            resolve();
        });
    }

    // Set a key's value and run an optional callback once the value is set.
    // Unlike Gaia's implementation, the callback function is passed the value,
    // in case you want to operate on that value only after you're sure it
    // saved, or something like that.
    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            // Convert undefined values to null.
            // https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            try {
                value = JSON.stringify(value);
            } catch (e) {
                reject(e);
            }

            localStorage.setItem(key, value);

            if (callback) {
                callback(originalValue);
            }

            resolve(originalValue);
        });
    }

    var localStorageWrapper = {
        driver: 'localStorageWrapper',
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
(function() {
    'use strict';

    var DB_NAME = 'localforage';
    // Default DB size is _JUST UNDER_ 5MB, as it's the highest size we can use
    // without a prompt.
    //
    // TODO: Add a way to increase this size programmatically?
    var DB_SIZE = 4980736;
    var DB_VERSION = '1.0';
    var SERIALIZED_MARKER = '__lfsc__:';
    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;
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
                t.executeSql('SELECT * FROM localforage WHERE key = ? LIMIT 1', [key], function (t, results) {
                    var result = results.rows.length ? results.rows.item(0).value : null;

                    // Check to see if this is serialized content we need to
                    // unpack.
                    if (result && result.substr(0, SERIALIZED_MARKER_LENGTH) === SERIALIZED_MARKER) {
                        try {
                            result = JSON.parse(result.slice(SERIALIZED_MARKER_LENGTH));
                        } catch (e) {
                            reject(e);
                        }
                    }

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                }, null);
            });
        });
    }

    function setItem(key, value, callback) {
        return new Promise(function(resolve, reject) {
            // The localStorage API doesn't return undefined values in an
            // "expected" way, so undefined is always cast to null in all
            // drivers. See: https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // We need to serialize certain types of objects using WebSQL;
            // otherwise they'll get stored as strings as be useless when we
            // use getItem() later.
            var valueToSave;
            if (typeof(value) === 'boolean' || typeof(value) === 'number' || typeof(value) === 'object') {
                // Mark the content as "localForage serialized content" so we
                // know to run JSON.parse() on it when we get it back out from
                // the database.
                valueToSave = SERIALIZED_MARKER + JSON.stringify(value);
            } else {
                valueToSave = value;
            }

            db.transaction(function (t) {
                t.executeSql('INSERT OR REPLACE INTO localforage (key, value) VALUES (?, ?)', [key, valueToSave], function() {
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
                t.executeSql('DELETE FROM localforage WHERE key = ?', [key], function() {
                    if (callback) {
                        callback();
                    }

                    resolve();
                }, null);
            });
        });
    }

    // Deletes every item in the table.
    // TODO: Find out if this resets the AUTO_INCREMENT number.
    function clear(callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('DELETE FROM localforage', [], function(t, results) {
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
                t.executeSql('SELECT COUNT(key) as c FROM localforage', [], function (t, results) {
                    var result = results.rows.item(0).c;

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                }, null);
            });
        });
    }

    // Return the key located at key index X; essentially gets the key from a
    // `WHERE id = ?`. This is the most efficient way I can think to implement
    // this rarely-used (in my experience) part of the API, but it can seem
    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
    // the ID of each key will change every time it's updated. Perhaps a stored
    // procedure for the `setItem()` SQL would solve this problem?
    // TODO: Don't change ID on `setItem()`.
    function key(n, callback) {
        return new Promise(function(resolve, reject) {
            db.transaction(function (t) {
                t.executeSql('SELECT key FROM localforage WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
                    var result = results.rows.length ? results.rows.item(0).key : null;

                    if (callback) {
                        callback(result);
                    }

                    resolve(result);
                }, null);
            });
        });
    }

    var webSQLStorage = {
        driver: 'webSQLStorage',
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key
    };

    if (typeof define === 'function' && define.amd) {
        define('webSQLStorage', function() {
            return webSQLStorage;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = webSQLStorage;
    } else {
        this.webSQLStorage = webSQLStorage;
    }
}).call(this);
(function() {
    'use strict';

    // Promises!
    var Promise = window.Promise;

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

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    // The actual localForage object that we expose as a module or via a global.
    // It's extended by pulling in one of our other libraries.
    var _this = this;
    var localForage = {
        INDEXEDDB: 'asyncStorage',
        LOCALSTORAGE: 'localStorageWrapper',
        WEBSQL: 'webSQLStorage',

        setDriver: function(driverName, callback) {
            return new Promise(function(resolve, reject) {
                if ((!indexedDB && driverName === localForage.INDEXEDDB) ||
                    (!window.openDatabase && driverName === localForage.WEBSQL)) {
                    if (callback) {
                        callback(localForage);
                    }

                    reject(localForage);

                    return;
                }

                // We allow localForage to be declared as a module or as a library
                // available without AMD/require.js.
                if (moduleType === MODULE_TYPE_DEFINE) {
                    require([driverName], function(lib) {
                        localForage._extend(lib);

                        if (callback) {
                            callback(localForage);
                        }

                        resolve(localForage);
                    });
                } else if (moduleType === MODULE_TYPE_EXPORT) {
                    // Making it browserify friendly
                    var driver;
                    switch (driverName) {
                        case localForage.INDEXEDDB:
                            driver = require('localforage/src/drivers/indexeddb');
                            break;
                        case localForage.LOCALSTORAGE:
                            driver = require('localforage/src/drivers/localstorage');
                            break;
                        case localForage.WEBSQL:
                            driver = require('localforage/src/drivers/websql');
                    }
                    localForage._extend(driver);

                    if (callback) {
                        callback(localForage);
                    }

                    resolve(localForage);
                } else {
                    localForage._extend(_this[driverName]);

                    if (callback) {
                        callback(localForage);
                    }

                    resolve(localForage);
                }
            });
        },

        _extend: function(libraryMethodsAndProperties) {
            for (var i in libraryMethodsAndProperties) {
                if (libraryMethodsAndProperties.hasOwnProperty(i)) {
                    this[i] = libraryMethodsAndProperties[i];
                }
            }
        }
    };

    var storageLibrary;
    // Check to see if IndexedDB is available; it's our preferred backend
    // library.
    if (indexedDB) {
        storageLibrary = localForage.INDEXEDDB;
    } else if (window.openDatabase) { // WebSQL is available, so we'll use that.
        storageLibrary = localForage.WEBSQL;
    } else { // If nothing else is available, we use localStorage.
        storageLibrary = localForage.LOCALSTORAGE;
    }

    // Set the (default) driver.
    localForage.setDriver(storageLibrary);

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
