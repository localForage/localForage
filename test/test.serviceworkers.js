/* global navigator:true, window:true, Modernizr:true, describe:true, expect:true, it:true, xit:true, before:true, beforeEach:true, after:true*/
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

DRIVERS.forEach(function(driverName) {
    if (
        (!Modernizr.indexeddb && driverName === localforage.INDEXEDDB) ||
        (!Modernizr.localstorage && driverName === localforage.LOCALSTORAGE) ||
        (!Modernizr.websqldatabase && driverName === localforage.WEBSQL)
    ) {
        // Browser doesn't support this storage library, so we exit the API
        // tests.
        return;
    }

    describe('Service Worker support in ' + driverName, function() {
        'use strict';

        // Use this until a test is added to Modernizr
        if (!('serviceworker' in Modernizr)) {
            Modernizr.serviceworker = 'serviceWorker' in navigator;
        }

        if (!Modernizr.serviceworker) {
            before.skip("doesn't have service worker support");
            beforeEach.skip("doesn't have service worker support");
            it.skip("doesn't have service worker support");
            after.skip("doesn't have service worker support");
            return;
        }

        if (!window.MessageChannel) {
            before.skip("doesn't have MessageChannel support");
            beforeEach.skip("doesn't have MessageChannel support");
            it.skip("doesn't have MessageChannel support");
            after.skip("doesn't have MessageChannel support");
            return;
        }

        before(function(done) {
            navigator.serviceWorker
                .register('/test/serviceworker-client.js')
                .then(function() {
                    return localforage.setDriver(driverName);
                })
                .then(done);
        });

        after(function(done) {
            navigator.serviceWorker.ready
                .then(function(registration) {
                    return registration.unregister();
                })
                .then(function(bool) {
                    if (bool) {
                        done();
                    } else {
                        done('service worker failed to unregister');
                    }
                });
        });

        beforeEach(function(done) {
            localforage.clear(done);
        });

        if (
            driverName === localforage.LOCALSTORAGE ||
            driverName === localforage.WEBSQL
        ) {
            it.skip(driverName + ' is not supported in service workers');
            return;
        }

        xit('should set a value on registration', function(done) {
            navigator.serviceWorker.ready
                .then(function() {
                    return localforage.getItem('service worker registration');
                })
                .then(function(result) {
                    expect(result).to.equal('serviceworker present');
                    done();
                })
                .catch(function(error) {
                    done(error);
                });
        });

        it('saves data', function(done) {
            var messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = function(event) {
                expect(event.data.body).to.be(
                    'I have been set using ' + driverName
                );
                done();
            };

            navigator.serviceWorker.ready
                .then(function(registration) {
                    registration.active.postMessage(
                        {
                            driver: driverName,
                            value: 'I have been set'
                        },
                        [messageChannel.port2]
                    );
                })
                .catch(function(error) {
                    done(error);
                });
        });
    });
});
