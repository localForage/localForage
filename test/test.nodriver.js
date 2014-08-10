/* global describe:true, expect:true, it:true, Modernizr:true */
describe('When No Drivers Are Available', function() {
    'use strict';

    var DRIVERS = [
        localforage.INDEXEDDB,
        localforage.LOCALSTORAGE,
        localforage.WEBSQL
    ];

    it('agrees with Modernizr on storage drivers support', function() {
        expect(localforage.supports(localforage.INDEXEDDB)).to.be(false);
        expect(localforage.supports(localforage.INDEXEDDB))
            .to.be(Modernizr.indexeddb);

        expect(localforage.supports(localforage.LOCALSTORAGE))
            .to.be(false);
        expect(localforage.supports(localforage.LOCALSTORAGE))
            .to.be(Modernizr.localstorage);

        expect(localforage.supports(localforage.WEBSQL)).to.be(false);
        expect(localforage.supports(localforage.WEBSQL))
            .to.be(Modernizr.websqldatabase);
    });

    it('fails to load localForage [callback]', function(done) {
        localforage.ready(function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to.be('No available storage method found.');
            done();
        });
    });

    it('fails to load localForage [promise]', function(done) {
        localforage.ready().then(null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to.be('No available storage method found.');
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
            localforage.setDriver(driverName, null, function(error) {
                expect(error).to.be.an(Error);
                expect(error.message).to
                                     .be('No available storage method found.');
                done();
            });
        });

        it('fails to setDriver ' + driverName + ' [promise]', function(done) {
            localforage.setDriver(driverName).then(null, function(error) {
                expect(error).to.be.an(Error);
                expect(error.message).to
                                     .be('No available storage method found.');
                done();
            });
        });
    });

    it('fails to setDriver using array parameter [callback]', function(done) {
        localforage.setDriver(DRIVERS, null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to.be('No available storage method found.');
            done();
        });
    });

    it('fails to setDriver using array parameter [promise]', function(done) {
        localforage.setDriver(DRIVERS).then(null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to.be('No available storage method found.');
            done();
        });
    });

});
