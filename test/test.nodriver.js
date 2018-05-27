/* global before:true, beforeEach:true, after: true, describe:true, expect:true, it:true, Modernizr:true */
describe('When No Drivers Are Available', function() {
    'use strict';

    var DRIVERS = [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE,
        localforage.MEMORY
    ];

    var STORAGE_DRIVERS = [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
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

    it('uses memory storage driver [callback]', function(done) {
        localforage.ready(function(err) {
            expect(err).to.be(undefined);
            expect(localforage.driver()).to.be(localforage.MEMORY);
            done();
        });
    });

    it('uses memory storage driver [promise]', function() {
        return localforage.ready().then(function() {
            expect(localforage.driver()).to.be(localforage.MEMORY);
        });
    });

    STORAGE_DRIVERS.forEach(function(driverName) {
        it('fails to setDriver ' + driverName + ' [callback]', function(done) {
            localforage.setDriver(driverName, null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
                done();
            });
        });

        it('fails to setDriver ' + driverName + ' [promise]', function() {
            return localforage.setDriver(driverName).then(null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
            });
        });
    });

    describe('using array parameter', function() {
        it('fails to setDriver [callback]', function(done) {
            localforage.setDriver(STORAGE_DRIVERS, null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
                done();
            });
        });

        it('fails to setDriver [promise]', function() {
            return localforage
                .setDriver(STORAGE_DRIVERS)
                .then(null, function(err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.be(
                        'No available storage method found.'
                    );
                });
        });
    });

    describe('when not using memory storage driver', function() {
        before(function() {
            this.defaultConfig = localforage.config();
            // keep a copy of the array
            this.defaultConfig.driver = STORAGE_DRIVERS.slice();
        });

        // Reset localForage before each test so we can call `config()` without
        // errors.
        beforeEach(function() {
            localforage._ready = null;
            localforage.config(this.defaultConfig);
        });

        after(function() {
            // reset `driver` to a copy of the driver preference array
            this.defaultConfig.driver = DRIVERS.slice();
            localforage._ready = null;
            localforage.config(this.defaultConfig);
            return localforage.ready();
        });

        it('fails to load localForage [callback]', function(done) {
            localforage.ready(function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
                done();
            });
        });

        it('fails to load localForage [promise]', function() {
            return localforage.ready().then(null, function(err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('No available storage method found.');
            });
        });

        it('has no driver set', function() {
            return localforage.ready(function() {
                expect(localforage.driver()).to.be(null);
            });
        });
    });
});
