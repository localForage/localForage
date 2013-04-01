# localForage #

An IndexedDB + localStorage + WebSQL grab bag library, designed to make web
app storage fast and simple.

## backbone.localstorage ##

Simple require this library in your Backbone collection like so:

    // Include the library:
    BackboneStorage = require('local-forage').BackboneStorage

    // Tell your collection to use it:
    var MyCollection = Backbone.Collection.extend({
        model: MyModel,

        localStorage: new BackboneStorage('MyCollection') // Should be unique!

        // Rest of collection code goes here...
    });

## Blob DB ##

A very simple, key/value-based IndexedDB library for storing data in IndexedDB.
Created for Firefox OS Podcasts app, because it needed to store large binary
files ( podcast image covers and audio files) but couldn't use Appcache or 
localStorage. Because most data is manipulated with Backbone.js and stored in
localStorage, we just used IndexedDB as async blob storage.

This library lets a user store arbitrary "big data" in IndexedDB with a
stupid simple API:

    // Require the library:
    BlobDB = require('local-forage').BlobDB

    // Load the DB (only needed once):
    BlobDB.load('databaseName', 'objectStoreName')

    // To get a blob:
    BlobDB.get('some-key', callback)

    // To set a key:
    BlobDB.set('some-key', blobData, callback)

    // And to destroy data:
    BlobDB.destroy('some-key', callback)
