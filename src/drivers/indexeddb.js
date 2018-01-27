import isIndexedDBValid from '../utils/isIndexedDBValid';
import createBlob from '../utils/createBlob';
import idb from '../utils/idb';
import Promise from '../utils/promise';
import executeCallback from '../utils/executeCallback';
import executeTwoCallbacks from '../utils/executeTwoCallbacks';
import normalizeKey from '../utils/normalizeKey';
import getCallback from '../utils/getCallback';

// Some code originally from async_storage.js in
// [Gaia](https://github.com/mozilla-b2g/gaia).

const DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
let supportsBlobs;
const dbContexts = {};
const toString = Object.prototype.toString;

// Transaction Modes
const READ_ONLY = 'readonly';
const READ_WRITE = 'readwrite';

// Transform a binary string to an array buffer, because otherwise
// weird stuff happens when you try to work with the binary string directly.
// It is known.
// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function _binStringToArrayBuffer(bin) {
    var length = bin.length;
    var buf = new ArrayBuffer(length);
    var arr = new Uint8Array(buf);
    for (var i = 0; i < length; i++) {
        arr[i] = bin.charCodeAt(i);
    }
    return buf;
}

//
// Blobs are not supported in all versions of IndexedDB, notably
// Chrome <37 and Android <5. In those versions, storing a blob will throw.
//
// Various other blob bugs exist in Chrome v37-42 (inclusive).
// Detecting them is expensive and confusing to users, and Chrome 37-42
// is at very low usage worldwide, so we do a hacky userAgent check instead.
//
// content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
// 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
// FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
//
// Code borrowed from PouchDB. See:
// https://github.com/pouchdb/pouchdb/blob/master/packages/node_modules/pouchdb-adapter-idb/src/blobSupport.js
//
function _checkBlobSupportWithoutCaching(idb) {
    return new Promise(function(resolve) {
        var txn = idb.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
        var blob = createBlob(['']);
        txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');

        txn.onabort = function(e) {
            // If the transaction aborts now its due to not being able to
            // write to the database, likely due to the disk being full
            e.preventDefault();
            e.stopPropagation();
            resolve(false);
        };

        txn.oncomplete = function() {
            var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
            var matchedEdge = navigator.userAgent.match(/Edge\//);
            // MS Edge pretends to be Chrome 42:
            // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx
            resolve(
                matchedEdge ||
                    !matchedChrome ||
                    parseInt(matchedChrome[1], 10) >= 43
            );
        };
    }).catch(function() {
        return false; // error, so assume unsupported
    });
}

function _checkBlobSupport(idb) {
    if (typeof supportsBlobs === 'boolean') {
        return Promise.resolve(supportsBlobs);
    }
    return _checkBlobSupportWithoutCaching(idb).then(function(value) {
        supportsBlobs = value;
        return supportsBlobs;
    });
}

function _deferReadiness(dbInfo) {
    var dbContext = dbContexts[dbInfo.name];

    // Create a deferred object representing the current database operation.
    var deferredOperation = {};

    deferredOperation.promise = new Promise(function(resolve, reject) {
        deferredOperation.resolve = resolve;
        deferredOperation.reject = reject;
    });

    // Enqueue the deferred operation.
    dbContext.deferredOperations.push(deferredOperation);

    // Chain its promise to the database readiness.
    if (!dbContext.dbReady) {
        dbContext.dbReady = deferredOperation.promise;
    } else {
        dbContext.dbReady = dbContext.dbReady.then(function() {
            return deferredOperation.promise;
        });
    }
}

function _advanceReadiness(dbInfo) {
    var dbContext = dbContexts[dbInfo.name];

    // Dequeue a deferred operation.
    var deferredOperation = dbContext.deferredOperations.pop();

    // Resolve its promise (which is part of the database readiness
    // chain of promises).
    if (deferredOperation) {
        deferredOperation.resolve();
        return deferredOperation.promise;
    }
}

function _rejectReadiness(dbInfo, err) {
    var dbContext = dbContexts[dbInfo.name];

    // Dequeue a deferred operation.
    var deferredOperation = dbContext.deferredOperations.pop();

    // Reject its promise (which is part of the database readiness
    // chain of promises).
    if (deferredOperation) {
        deferredOperation.reject(err);
        return deferredOperation.promise;
    }
}

function _getConnection(dbInfo, upgradeNeeded) {
    return new Promise(function(resolve, reject) {
        dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();

        if (dbInfo.db) {
            if (upgradeNeeded) {
                _deferReadiness(dbInfo);
                dbInfo.db.close();
            } else {
                return resolve(dbInfo.db);
            }
        }

        var dbArgs = [dbInfo.name];

        if (upgradeNeeded) {
            dbArgs.push(dbInfo.version);
        }

        var openreq = idb.open.apply(idb, dbArgs);

        if (upgradeNeeded) {
            openreq.onupgradeneeded = function(e) {
                var db = openreq.result;
                try {
                    db.createObjectStore(dbInfo.storeName);
                    if (e.oldVersion <= 1) {
                        // Added when support for blob shims was added
                        db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                    }
                } catch (ex) {
                    if (ex.name === 'ConstraintError') {
                        console.warn(
                            'The database "' +
                                dbInfo.name +
                                '"' +
                                ' has been upgraded from version ' +
                                e.oldVersion +
                                ' to version ' +
                                e.newVersion +
                                ', but the storage "' +
                                dbInfo.storeName +
                                '" already exists.'
                        );
                    } else {
                        throw ex;
                    }
                }
            };
        }

        openreq.onerror = function(e) {
            e.preventDefault();
            reject(openreq.error);
        };

        openreq.onsuccess = function() {
            resolve(openreq.result);
            _advanceReadiness(dbInfo);
        };
    });
}

function _getOriginalConnection(dbInfo) {
    return _getConnection(dbInfo, false);
}

function _getUpgradedConnection(dbInfo) {
    return _getConnection(dbInfo, true);
}

function _isUpgradeNeeded(dbInfo, defaultVersion) {
    if (!dbInfo.db) {
        return true;
    }

    var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
    var isDowngrade = dbInfo.version < dbInfo.db.version;
    var isUpgrade = dbInfo.version > dbInfo.db.version;

    if (isDowngrade) {
        // If the version is not the default one
        // then warn for impossible downgrade.
        if (dbInfo.version !== defaultVersion) {
            console.warn(
                'The database "' +
                    dbInfo.name +
                    '"' +
                    " can't be downgraded from version " +
                    dbInfo.db.version +
                    ' to version ' +
                    dbInfo.version +
                    '.'
            );
        }
        // Align the versions to prevent errors.
        dbInfo.version = dbInfo.db.version;
    }

    if (isUpgrade || isNewStore) {
        // If the store is new then increment the version (if needed).
        // This will trigger an "upgradeneeded" event which is required
        // for creating a store.
        if (isNewStore) {
            var incVersion = dbInfo.db.version + 1;
            if (incVersion > dbInfo.version) {
                dbInfo.version = incVersion;
            }
        }

        return true;
    }

    return false;
}

// encode a blob for indexeddb engines that don't support blobs
function _encodeBlob(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = function(e) {
            var base64 = btoa(e.target.result || '');
            resolve({
                __local_forage_encoded_blob: true,
                data: base64,
                type: blob.type
            });
        };
        reader.readAsBinaryString(blob);
    });
}

// decode an encoded blob
function _decodeBlob(encodedBlob) {
    var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
    return createBlob([arrayBuff], { type: encodedBlob.type });
}

// is this one of our fancy encoded blobs?
function _isEncodedBlob(value) {
    return value && value.__local_forage_encoded_blob;
}

// Specialize the default `ready()` function by making it dependent
// on the current database operations. Thus, the driver will be actually
// ready when it's been initialized (default) *and* there are no pending
// operations on the database (initiated by some other instances).
function _fullyReady(callback) {
    var self = this;

    var promise = self._initReady().then(function() {
        var dbContext = dbContexts[self._dbInfo.name];

        if (dbContext && dbContext.dbReady) {
            return dbContext.dbReady;
        }
    });

    executeTwoCallbacks(promise, callback, callback);
    return promise;
}

// Try to establish a new db connection to replace the
// current one which is broken (i.e. experiencing
// InvalidStateError while creating a transaction).
function _tryReconnect(dbInfo) {
    _deferReadiness(dbInfo);

    var dbContext = dbContexts[dbInfo.name];
    var forages = dbContext.forages;

    for (var i = 0; i < forages.length; i++) {
        const forage = forages[i];
        if (forage._dbInfo.db) {
            forage._dbInfo.db.close();
            forage._dbInfo.db = null;
        }
    }
    dbInfo.db = null;

    return _getOriginalConnection(dbInfo)
        .then(db => {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo)) {
                // Reopen the database for upgrading.
                return _getUpgradedConnection(dbInfo);
            }
            return db;
        })
        .then(db => {
            // store the latest db reference
            // in case the db was upgraded
            dbInfo.db = dbContext.db = db;
            for (var i = 0; i < forages.length; i++) {
                forages[i]._dbInfo.db = db;
            }
        })
        .catch(err => {
            _rejectReadiness(dbInfo, err);
            throw err;
        });
}

// FF doesn't like Promises (micro-tasks) and IDDB store operations,
// so we have to do it with callbacks
function createTransaction(dbInfo, mode, callback, retries) {
    if (retries === undefined) {
        retries = 1;
    }

    try {
        var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
        callback(null, tx);
    } catch (err) {
        if (
            retries > 0 &&
            (!dbInfo.db ||
                err.name === 'InvalidStateError' ||
                err.name === 'NotFoundError')
        ) {
            return Promise.resolve()
                .then(() => {
                    if (
                        !dbInfo.db ||
                        (err.name === 'NotFoundError' &&
                            !dbInfo.db.objectStoreNames.contains(
                                dbInfo.storeName
                            ) &&
                            dbInfo.version <= dbInfo.db.version)
                    ) {
                        // increase the db version, to create the new ObjectStore
                        if (dbInfo.db) {
                            dbInfo.version = dbInfo.db.version + 1;
                        }
                        // Reopen the database for upgrading.
                        return _getUpgradedConnection(dbInfo);
                    }
                })
                .then(() => {
                    return _tryReconnect(dbInfo).then(function() {
                        createTransaction(dbInfo, mode, callback, retries - 1);
                    });
                })
                .catch(callback);
        }

        callback(err);
    }
}

function createDbContext() {
    return {
        // Running localForages sharing a database.
        forages: [],
        // Shared database.
        db: null,
        // Database readiness (promise).
        dbReady: null,
        // Deferred operations on the database.
        deferredOperations: []
    };
}

// Open the IndexedDB database (automatically creates one if one didn't
// previously exist), using any options set in the config.
function _initStorage(options) {
    var self = this;
    var dbInfo = {
        db: null
    };

    if (options) {
        for (var i in options) {
            dbInfo[i] = options[i];
        }
    }

    // Get the current context of the database;
    var dbContext = dbContexts[dbInfo.name];

    // ...or create a new context.
    if (!dbContext) {
        dbContext = createDbContext();
        // Register the new context in the global container.
        dbContexts[dbInfo.name] = dbContext;
    }

    // Register itself as a running localForage in the current context.
    dbContext.forages.push(self);

    // Replace the default `ready()` function with the specialized one.
    if (!self._initReady) {
        self._initReady = self.ready;
        self.ready = _fullyReady;
    }

    // Create an array of initialization states of the related localForages.
    var initPromises = [];

    function ignoreErrors() {
        // Don't handle errors here,
        // just makes sure related localForages aren't pending.
        return Promise.resolve();
    }

    for (var j = 0; j < dbContext.forages.length; j++) {
        var forage = dbContext.forages[j];
        if (forage !== self) {
            // Don't wait for itself...
            initPromises.push(forage._initReady().catch(ignoreErrors));
        }
    }

    // Take a snapshot of the related localForages.
    var forages = dbContext.forages.slice(0);

    // Initialize the connection process only when
    // all the related localForages aren't pending.
    return Promise.all(initPromises)
        .then(function() {
            dbInfo.db = dbContext.db;
            // Get the connection or open a new one without upgrade.
            return _getOriginalConnection(dbInfo);
        })
        .then(function(db) {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
                // Reopen the database for upgrading.
                return _getUpgradedConnection(dbInfo);
            }
            return db;
        })
        .then(function(db) {
            dbInfo.db = dbContext.db = db;
            self._dbInfo = dbInfo;
            // Share the final connection amongst related localForages.
            for (var k = 0; k < forages.length; k++) {
                var forage = forages[k];
                if (forage !== self) {
                    // Self is already up-to-date.
                    forage._dbInfo.db = dbInfo.db;
                    forage._dbInfo.version = dbInfo.version;
                }
            }
        });
}

function getItem(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_ONLY, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var req = store.get(key);

                        req.onsuccess = function() {
                            var value = req.result;
                            if (value === undefined) {
                                value = null;
                            }
                            if (_isEncodedBlob(value)) {
                                value = _decodeBlob(value);
                            }
                            resolve(value);
                        };

                        req.onerror = function() {
                            reject(req.error);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Iterate over all items stored in database.
function iterate(iterator, callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_ONLY, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var req = store.openCursor();
                        var iterationNumber = 1;

                        req.onsuccess = function() {
                            var cursor = req.result;

                            if (cursor) {
                                var value = cursor.value;
                                if (_isEncodedBlob(value)) {
                                    value = _decodeBlob(value);
                                }
                                var result = iterator(
                                    value,
                                    cursor.key,
                                    iterationNumber++
                                );

                                // when the iterator callback retuns any
                                // (non-`undefined`) value, then we stop
                                // the iteration immediately
                                if (result !== void 0) {
                                    resolve(result);
                                } else {
                                    cursor.continue();
                                }
                            } else {
                                resolve();
                            }
                        };

                        req.onerror = function() {
                            reject(req.error);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);

    return promise;
}

function setItem(key, value, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise(function(resolve, reject) {
        var dbInfo;
        self
            .ready()
            .then(function() {
                dbInfo = self._dbInfo;
                if (toString.call(value) === '[object Blob]') {
                    return _checkBlobSupport(dbInfo.db).then(function(
                        blobSupport
                    ) {
                        if (blobSupport) {
                            return value;
                        }
                        return _encodeBlob(value);
                    });
                }
                return value;
            })
            .then(function(value) {
                createTransaction(self._dbInfo, READ_WRITE, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );

                        // The reason we don't _save_ null is because IE 10 does
                        // not support saving the `null` type in IndexedDB. How
                        // ironic, given the bug below!
                        // See: https://github.com/mozilla/localForage/issues/161
                        if (value === null) {
                            value = undefined;
                        }

                        var req = store.put(value, key);

                        transaction.oncomplete = function() {
                            // Cast to undefined so the value passed to
                            // callback/promise is the same as what one would get out
                            // of `getItem()` later. This leads to some weirdness
                            // (setItem('foo', undefined) will return `null`), but
                            // it's not my fault localStorage is our baseline and that
                            // it's weird.
                            if (value === undefined) {
                                value = null;
                            }

                            resolve(value);
                        };
                        transaction.onabort = transaction.onerror = function() {
                            var err = req.error
                                ? req.error
                                : req.transaction.error;
                            reject(err);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function removeItem(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_WRITE, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        // We use a Grunt task to make this safe for IE and some
                        // versions of Android (including those used by Cordova).
                        // Normally IE won't like `.delete()` and will insist on
                        // using `['delete']()`, but we have a build step that
                        // fixes this for us now.
                        var req = store.delete(key);
                        transaction.oncomplete = function() {
                            resolve();
                        };

                        transaction.onerror = function() {
                            reject(req.error);
                        };

                        // The request will be also be aborted if we've exceeded our storage
                        // space.
                        transaction.onabort = function() {
                            var err = req.error
                                ? req.error
                                : req.transaction.error;
                            reject(err);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function clear(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_WRITE, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var req = store.clear();

                        transaction.oncomplete = function() {
                            resolve();
                        };

                        transaction.onabort = transaction.onerror = function() {
                            var err = req.error
                                ? req.error
                                : req.transaction.error;
                            reject(err);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function length(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_ONLY, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var req = store.count();

                        req.onsuccess = function() {
                            resolve(req.result);
                        };

                        req.onerror = function() {
                            reject(req.error);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function key(n, callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        if (n < 0) {
            resolve(null);

            return;
        }

        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_ONLY, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var advanced = false;
                        var req = store.openCursor();

                        req.onsuccess = function() {
                            var cursor = req.result;
                            if (!cursor) {
                                // this means there weren't enough keys
                                resolve(null);

                                return;
                            }

                            if (n === 0) {
                                // We have the first key, return it if that's what they
                                // wanted.
                                resolve(cursor.key);
                            } else {
                                if (!advanced) {
                                    // Otherwise, ask the cursor to skip ahead n
                                    // records.
                                    advanced = true;
                                    cursor.advance(n);
                                } else {
                                    // When we get here, we've got the nth key.
                                    resolve(cursor.key);
                                }
                            }
                        };

                        req.onerror = function() {
                            reject(req.error);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self
            .ready()
            .then(function() {
                createTransaction(self._dbInfo, READ_ONLY, function(
                    err,
                    transaction
                ) {
                    if (err) {
                        return reject(err);
                    }

                    try {
                        var store = transaction.objectStore(
                            self._dbInfo.storeName
                        );
                        var req = store.openCursor();
                        var keys = [];

                        req.onsuccess = function() {
                            var cursor = req.result;

                            if (!cursor) {
                                resolve(keys);
                                return;
                            }

                            keys.push(cursor.key);
                            cursor.continue();
                        };

                        req.onerror = function() {
                            reject(req.error);
                        };
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance(options, callback) {
    callback = getCallback.apply(this, arguments);

    var currentConfig = this.config();
    options = (typeof options !== 'function' && options) || {};
    if (!options.name) {
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    var self = this;
    var promise;
    if (!options.name) {
        promise = Promise.reject('Invalid arguments');
    } else {
        const isCurrentDb =
            options.name === currentConfig.name && self._dbInfo.db;

        const dbPromise = isCurrentDb
            ? Promise.resolve(self._dbInfo.db)
            : _getOriginalConnection(options).then(db => {
                  const dbContext = dbContexts[options.name];
                  const forages = dbContext.forages;
                  dbContext.db = db;
                  for (var i = 0; i < forages.length; i++) {
                      forages[i]._dbInfo.db = db;
                  }
                  return db;
              });

        if (!options.storeName) {
            promise = dbPromise.then(db => {
                _deferReadiness(options);

                const dbContext = dbContexts[options.name];
                const forages = dbContext.forages;

                db.close();
                for (var i = 0; i < forages.length; i++) {
                    const forage = forages[i];
                    forage._dbInfo.db = null;
                }

                const dropDBPromise = new Promise((resolve, reject) => {
                    var req = idb.deleteDatabase(options.name);

                    req.onerror = req.onblocked = err => {
                        const db = req.result;
                        if (db) {
                            db.close();
                        }
                        reject(err);
                    };

                    req.onsuccess = () => {
                        const db = req.result;
                        if (db) {
                            db.close();
                        }
                        resolve(db);
                    };
                });

                return dropDBPromise
                    .then(db => {
                        dbContext.db = db;
                        for (var i = 0; i < forages.length; i++) {
                            const forage = forages[i];
                            _advanceReadiness(forage._dbInfo);
                        }
                    })
                    .catch(err => {
                        (
                            _rejectReadiness(options, err) || Promise.resolve()
                        ).catch(() => {});
                        throw err;
                    });
            });
        } else {
            promise = dbPromise.then(db => {
                if (!db.objectStoreNames.contains(options.storeName)) {
                    return;
                }

                const newVersion = db.version + 1;

                _deferReadiness(options);

                const dbContext = dbContexts[options.name];
                const forages = dbContext.forages;

                db.close();
                for (let i = 0; i < forages.length; i++) {
                    const forage = forages[i];
                    forage._dbInfo.db = null;
                    forage._dbInfo.version = newVersion;
                }

                const dropObjectPromise = new Promise((resolve, reject) => {
                    const req = idb.open(options.name, newVersion);

                    req.onerror = err => {
                        const db = req.result;
                        db.close();
                        reject(err);
                    };

                    req.onupgradeneeded = () => {
                        var db = req.result;
                        db.deleteObjectStore(options.storeName);
                    };

                    req.onsuccess = () => {
                        const db = req.result;
                        db.close();
                        resolve(db);
                    };
                });

                return dropObjectPromise
                    .then(db => {
                        dbContext.db = db;
                        for (let j = 0; j < forages.length; j++) {
                            const forage = forages[j];
                            forage._dbInfo.db = db;
                            _advanceReadiness(forage._dbInfo);
                        }
                    })
                    .catch(err => {
                        (
                            _rejectReadiness(options, err) || Promise.resolve()
                        ).catch(() => {});
                        throw err;
                    });
            });
        }
    }

    executeCallback(promise, callback);
    return promise;
}

var asyncStorage = {
    _driver: 'asyncStorage',
    _initStorage: _initStorage,
    _support: isIndexedDBValid(),
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
export default asyncStorage;
