/* global before:true, beforeEach:true, describe:true, expect:true, it:true */
describe('Config API', function() {
    'use strict';

    before(function() {
        this.defaultConfig = localforage.config();
    });

    // Reset localForage before each test so we can call `config()` without
    // errors.
    beforeEach(function() {
        localforage._ready = null;
        localforage.config(this.defaultConfig);
    });

    it('returns the default values', function() {
        expect(localforage.config('description')).to.be('');
        expect(localforage.config('name')).to.be('localforage');
        expect(localforage.config('size')).to.be(4980736);
        expect(localforage.config('storeName')).to.be('keyvaluepairs');
        expect(localforage.config('version')).to.be(1.0);
    });

    it('returns error if API call was already made', function(done) {
        localforage.length(function() {
            var configResult = localforage.config({
                description: '123',
                name: 'My Cool App',
                storeName: 'storeFront',
                version: 2.0
            });

            var error = "Error: Can't call config() after localforage " +
                        "has been used.";

            expect(configResult).to.not.be(true);
            expect(configResult.toString()).to.be(error);

            // Expect the config values to be as they were before.
            expect(localforage.config('description')).to.not.be('123');
            expect(localforage.config('description')).to.be('');
            expect(localforage.config('name')).to.be('localforage');
            expect(localforage.config('name')).to.not.be('My Cool App');
            expect(localforage.config('size')).to.be(4980736);
            expect(localforage.config('storeName')).to.be('keyvaluepairs');
            expect(localforage.config('version')).to.be(1.0);

            done();
        });
    });

    it('sets new values and returns them properly', function() {
        localforage.config({
            description: 'The offline datastore for my cool app',
            name: 'My Cool App',
            storeName: 'storeFront',
            version: 2.0
        });

        expect(localforage.config('description')).to.not.be('');
        expect(localforage.config('description')).to
                          .be('The offline datastore for my cool app');
        expect(localforage.config('name')).to.be('My Cool App');
        expect(localforage.config('size')).to.be(4980736);
        expect(localforage.config('storeName')).to.be('storeFront');
        expect(localforage.config('version')).to.be(2.0);
    });

    it('uses the config values in ' + localforage.driver(), function(done) {
        localforage.config({
            description: 'The offline datastore for my cool app',
            name: 'My Cool App',
            storeName: 'storeFront',
            version: 2.0
        });

        localforage.setItem('some key', 'some value').then(function(value) {
            if (localforage.driver() === localforage.INDEXEDDB) {
                var indexedDB = (indexedDB || window.indexedDB ||
                                 window.webkitIndexedDB ||
                                 window.mozIndexedDB || window.OIndexedDB ||
                                 window.msIndexedDB);
                var req = indexedDB.open('My Cool App', 2.0);

                req.onsuccess = function() {
                    var dbValue = req.result
                                     .transaction('storeFront', 'readonly')
                                     .objectStore('storeFront')
                                     .get('some key');
                    expect(dbValue).to.be(value);
                    done();
                };
            } else if (localforage.driver() === localforage.WEBSQL) {
                window.openDatabase('My Cool App', (2.0).toString(),
                                    '', 4980736).transaction(function(t) {
                    t.executeSql('SELECT * FROM storeFront WHERE key = ? ' +
                                 'LIMIT 1', ['some key'],
                                 function(t, results) {
                        var dbValue = JSON.parse(results.rows.item(0).value);

                        expect(dbValue).to.be(value);
                        done();
                    });
                });
            } else if (localforage.driver() === localforage.LOCALSTORAGE) {
                var dbValue = JSON.parse(localStorage['My Cool App/some key']);

                expect(dbValue).to.be(value);
                done();
            }
        });
    });

    it("returns all values when config isn't passed arguments", function() {
        expect(localforage.config()).to.be.an('object');
        expect(Object.keys(localforage.config()).length).to.be(5);
    });

    // This may go away when https://github.com/mozilla/localForage/issues/168
    // is fixed.
    it('maintains config values across setDriver calls', function(done) {
        localforage.config({
            name: 'Mega Mozilla Dino'
        });

        localforage.length().then(function() {
            return localforage.setDriver(localforage.LOCALSTORAGE);
        }).then(function() {
            expect(localforage.config('name')).to.be('Mega Mozilla Dino');
            done();
        });
    });
});
