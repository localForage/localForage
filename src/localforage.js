
// localForage is a library that allows users to create offline Backbone models
// and use IndexedDB to store large pieces of data.
// TODO: update ^^^ to reflect this is not only for Backbone

(function() {

    'use strict';

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;


    var storageLibrary;

    if(indexedDB) {
        storageLibrary = 'asyncStorage';
    } else {
        storageLibrary = 'localStorageWrapper';
    }


    if(typeof define === 'function' && define.amd) {
        define([storageLibrary], function(lib) { return lib; });
    } else if(typeof module !== 'undefined' && module.exports) {
        var lib = require('./' + storageLibrary);
        module.exports = lib;
    } else {
        this.localForage = this[storageLibrary];
    }

}).call(this); 
