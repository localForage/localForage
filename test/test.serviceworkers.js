/* global navigator:true, window:true, Modernizr:true, describe:true, expect:true, it:true, before:true, beforeEach:true, after:true*/
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

    describe('Service Worker support in ' + driverName, function() {
        'use strict';

        if (!Modernizr.serviceworker) {
            before.skip('doesn\'t have service worker support');
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

        if (!Modernizr.serviceworker) {
            after.skip('doesn\'t have service worker support');
            return;
        }

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

        if (!Modernizr.serviceworker) {
            beforeEach.skip('doesn\'t have service worker support');
            return;
        }

        beforeEach(function(done) {
            localforage.clear(done);
        });

        if (!Modernizr.serviceworker) {
            it.skip('doesn\'t have service worker support');
            return;
        }

        if (driverName === localforage.LOCALSTORAGE ||
            driverName === localforage.WEBSQL) {
            it.skip(driverName + ' is not supported in service workers');
            return;
        }

        it('should set a value on registration', function(done) {
            navigator.serviceWorker.ready
                .then(function() {
                    return localforage.getItem('service worker registration');
                })
                .then(function(result) {
                    expect(result)
                        .to.equal('serviceworker present');
                    done();
                })
                .catch(function(error) {
                    done(error);
                });
        });

        it('saves data', function(done) {
            if (window.MessageChannel) {
                var messageChannel = new MessageChannel();

                messageChannel.port1.onmessage = function(event) {
                    expect(event.data.body)
                        .to.be('I have been set');
                    done();
                };
            }

            navigator.serviceWorker.ready
                .then(function(registration) {
                    registration.active.postMessage({
                        driver: driverName,
                        value: 'I have been set'
                    }, [messageChannel.port2]);
                })
                .catch(function(error) {
                    done(error);
                });
        });
    });
});
