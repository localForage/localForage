/* global describe:true, expect:true, it:true */
describe('When Driver Fails to Initialize', function() {
    'use strict';

    var FAULTYDRIVERS = [
        localforage.WEBSQL
    ];

    FAULTYDRIVERS.forEach(function(driverName) {
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
