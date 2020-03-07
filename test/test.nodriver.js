/* global describe:true, expect:true, it:true, dummyStorageDriver:true, Modernizr:true */
describe('When No Drivers Are Available', function() {
    'use strict';

    var DRIVERS = [
        localforage.INDEXEDDB,
        localforage.LOCALSTORAGE,
        localforage.WEBSQL
    ];

    it('agrees with Modernizr on storage drivers support', function() {
        expect(localforage.supports(localforage.INDEXEDDB)).to.be(false);
        expect(localforage.supports(localforage.INDEXEDDB)).to.be(
            Modernizr.indexeddb
        );

        expect(localforage.supports(localforage.LOCALSTORAGE)).to.be(false);
        expect(localforage.supports(localforage.LOCALSTORAGE)).to.be(
            Modernizr.localstorage
        );

        expect(localforage.supports(localforage.WEBSQL)).to.be(false);
        expect(localforage.supports(localforage.WEBSQL)).to.be(
            Modernizr.websqldatabase
        );
    });

    it('fails to load localForage [callback]', function(done) {
        localforage.ready(function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be('No available storage method found.');
            done();
        });
    });

    it('fails to load localForage [promise]', function(done) {
        localforage.ready().then(null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be('No available storage method found.');
            done();
        });
    });

    it('has no driver set', function(done) {
        localforage.ready(function() {
            expect(localforage.driver()).to.be(null);
            done();
        });
    });

    DRIVERS.forEach(function(driverName) {
        it('fails to setDriver ' + driverName + ' [callback]', function(done) {
            localforage.setDriver(driverName, null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
                done();
            });
        });

        it('fails to setDriver ' + driverName + ' [promise]', function(done) {
            localforage.setDriver(driverName).then(null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
                done();
            });
        });
    });

    it('fails to setDriver using array parameter [callback]', function(done) {
        localforage.setDriver(DRIVERS, null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be('No available storage method found.');
            done();
        });
    });

    it('fails to setDriver using array parameter [promise]', function(done) {
        localforage.setDriver(DRIVERS).then(null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be('No available storage method found.');
            done();
        });
    });

    it('allows a custom driver to be set immediately when no other drivers are found', function(done) {
        var db;
        localforage
            .defineDriver(dummyStorageDriver)
            .then(function() {
                db = localforage.createInstance({ name: 'test' });
                return db.setDriver(dummyStorageDriver._driver);
            })
            .then(function() {
                return db.ready();
            })
            .then(function() {
                expect(db.driver()).to.be(dummyStorageDriver._driver);
                done();
            });
    });
});
