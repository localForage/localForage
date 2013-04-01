'use strict';

// localForage is a library that allows users to create offline Backbone models
// and use IndexedDB to store large pieces of data.
define([
    'backbone.localstorage',
    'blob-db'
], function(BackboneStorage, BlobDB, require) {
    // Just return these classes for now!
    return {
        BackboneStorage: BackboneStorage,
        BlobStorage: BlobDB
    };
});
