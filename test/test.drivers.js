/* global beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];
DRIVERS.forEach(function(driverName) {
    if ((!Modernizr.indexeddb && driverName === localforage.INDEXEDDB) ||
        (!Modernizr.localstorage && driverName === localforage.LOCALSTORAGE) ||
        (!Modernizr.websqldatabase && driverName === localforage.WEBSQL)) {
        // Browser doesn't support this storage library, so we exit the API
        // tests.
        return;
    }
});

describe('Driver API', function() {
    'use strict';

    beforeEach(function(done) {
        if (Modernizr.indexeddb) {
            localforage.setDriver(localforage.INDEXEDDB, function() {
                done();
            });
        } else if (Modernizr.websqldatabase) {
            localforage.setDriver(localforage.WEBSQL, function() {
                done();
            });
        } else {
            done();
        }
    });

    // If localStorage was set by default
    if ((Modernizr.indexeddb &&
         localforage.driver() === localforage.INDEXEDDB) ||
        (Modernizr.websqldatabase &&
         localforage.driver() === localforage.WEBSQL)) {
        it('can change to localStorage from ' + localforage.driver() +
           ' [callback]', function(done) {
            var currentDriver = localforage.driver();

            localforage.setDriver(localforage.LOCALSTORAGE, function() {
                expect(localforage.driver()).to.be(localforage.LOCALSTORAGE);
                expect(localforage.driver()).to.not.be(currentDriver);
                done();
            });
        });
        it('can change to localStorage from ' + localforage.driver() +
           ' [promise]', function(done) {
            var currentDriver = localforage.driver();

            localforage.setDriver(localforage.LOCALSTORAGE).then(function() {
                expect(localforage.driver()).to.be(localforage.LOCALSTORAGE);
                expect(localforage.driver()).to.not.be(currentDriver);
                done();
            });
        });
    }
});
