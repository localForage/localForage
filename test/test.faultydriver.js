/* global beforeEach:true, describe:true, expect:true, it:true */
describe('When Driver Fails to Initialize', function() {
    'use strict';

    var FAULTYDRIVERS = [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
    ]
    .filter(localforage.supports)
    .filter(function(driverName) {
        // FF doesn't allow you to override `localStorage.setItem`
        // so if the faulty driver setup didn't succeed
        // then skip the localStorage tests
        return !(
            driverName === localforage.LOCALSTORAGE &&
            localStorage.setItem.toString().indexOf('[native code]') >= 0
        );
    });

    FAULTYDRIVERS.forEach(function(driverName) {
        describe(driverName, function() {

            beforeEach(function() {
                if (driverName === localforage.LOCALSTORAGE) {
                    localStorage.clear();
                }
            });

            it('fails to setDriver ' + driverName + ' [callback]', function(done) {
                localforage.setDriver(driverName, function() {
                    localforage.ready(function(err) {
                        expect(err).to.be.an(Error);
                        expect(err.message).to.be('No available storage method found.');
                        done();
                    });
                });
            });

            it('fails to setDriver ' + driverName + ' [promise]', function(done) {
                localforage.setDriver(driverName).then(function() {
                    return localforage.ready();
                }).then(null, function(err) {
                    expect(err).to.be.an(Error);
                    expect(err.message).to.be('No available storage method found.');
                    done();
                });
            });
        });
    });

});
