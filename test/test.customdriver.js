/* global describe:true, expect:true, it:true, dummyStorageDriver:true */
describe('When Custom Drivers are used', function() {
    'use strict';
    var errorMessage = 'Custom driver not compliant; see ' +
                       'https://mozilla.github.io/localForage/#definedriver';
    var nameErrorMessage = function(driverName) {
        return 'Custom driver name already in use: ' + driverName;
    };

    it('fails to define a no-name custom driver', function(done) {
        localforage.defineDriver({
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {},
            length: function() {},
            key: function() {},
            keys: function() {}
        }, null,  function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(errorMessage);
            done();
        });
    });

    it('fails to define a no-name custom driver [promise]', function(done) {
        localforage.defineDriver({
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {},
            length: function() {},
            key: function() {},
            keys: function() {}
        }).then(null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(errorMessage);
            done();
        });
    });

    it('fails to define a custom driver with overlapping driver name',
       function(done) {
        localforage.defineDriver({
            _driver: localforage.INDEXEDDB,
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {},
            length: function() {},
            key: function() {},
            keys: function() {}
        }, null,  function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(nameErrorMessage(localforage.INDEXEDDB));
            done();
        });
    });

    it('fails to define a custom driver with overlapping driver name [promise]',
       function(done) {
        localforage.defineDriver({
            _driver: localforage.INDEXEDDB,
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {},
            length: function() {},
            key: function() {},
            keys: function() {}
        }).then(null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(nameErrorMessage(localforage.INDEXEDDB));
            done();
        });
    });

    it('fails to define a custom driver with missing methods', function(done) {
        localforage.defineDriver({
            _driver: 'missingMethodsDriver',
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {}
        }, null,  function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(errorMessage);
            done();
        });
    });

    it('fails to define a custom driver with missing methods [promise]',
       function(done) {
        localforage.defineDriver({
            _driver: 'missingMethodsDriver',
            _initStorage: function() {},
            iterate: function() {},
            getItem: function() {},
            setItem: function() {},
            removeItem: function() {},
            clear: function() {}
        }).then(null, function(err) {
            expect(err).to.be.an(Error);
            expect(err.message).to.be(errorMessage);
            done();
        });
    });

    it('defines a compliant custom driver', function(done) {
        localforage.defineDriver(dummyStorageDriver, function() {
            done();
        });
    });

    it('defines a compliant custom driver [promise]', function(done) {
        localforage.defineDriver(dummyStorageDriver).then(function() {
            done();
        });
    });

    it('sets a custom driver', function(done) {
        localforage.defineDriver(dummyStorageDriver, function() {
            localforage.setDriver(dummyStorageDriver._driver, function() {
                expect(localforage.driver()).to.be(dummyStorageDriver._driver);
                done();
            });
        });
    });

    it('sets a custom driver [promise]', function(done) {
        localforage.defineDriver(dummyStorageDriver).then(function() {
            return localforage.setDriver(dummyStorageDriver._driver);
        }).then(function() {
            expect(localforage.driver()).to.be(dummyStorageDriver._driver);
            done();
        });
    });

    it('sets and uses a custom driver', function(done) {
        localforage.defineDriver(dummyStorageDriver, function() {
            localforage.setDriver(dummyStorageDriver._driver, function(err) {
                expect(err).to.be(undefined);
                localforage.setItem('testCallbackKey', 'testCallbackValue',
                                    function(err) {
                    expect(err).to.be(null);
                    localforage.getItem('testCallbackKey',
                                        function(err, value) {
                        expect(err).to.be(null);
                        expect(value).to.be('testCallbackValue');
                        done();
                    });
                });
            });
        });
    });

    it('sets and uses a custom driver [promise]', function(done) {
        localforage.defineDriver(dummyStorageDriver).then(function() {
            return localforage.setDriver(dummyStorageDriver._driver);
        }).then(function() {
            return localforage.setItem('testPromiseKey', 'testPromiseValue');
        }).then(function() {
            return localforage.getItem('testPromiseKey');
        }).then(function(value) {
            expect(value).to.be('testPromiseValue');
            done();
        });
    });

});
