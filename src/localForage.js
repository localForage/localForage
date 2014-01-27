(function() {
    'use strict';

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    var storageLibrary;

    // Check to see if IndexedDB is available; it's our preferred backend
    // library.
    // TODO: Offer library selection with something other than naughty globals.
    if (indexedDB && !window._FORCE_LOCALSTORAGE) {
        storageLibrary = 'asyncStorage';
    } else if (window.openDatabase) { // WebSQL is available, so we'll use that.
        storageLibrary = 'webSQLStorage';
    } else { // If nothing else is available, we use localStorage.
        storageLibrary = 'localStorageWrapper';
    }

    // We allow localForage to be declared as a module or as a library
    // available without AMD/require.js.
    if (typeof define === 'function' && define.amd) {
        define([storageLibrary], function(lib) {
            return lib;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        var lib = require('./' + storageLibrary);
        module.exports = lib;
    } else {
        this.localForage = this[storageLibrary];
    }
}).call(this);
