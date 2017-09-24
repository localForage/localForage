/* global describe:true, expect:true, it:true, dummyStorageDriver:true */
describe('When Custom Drivers are used', function() {
    'use strict';
    var errorMessage = 'Custom driver not compliant; see ' +
                       'https://mozilla.github.io/localForage/#definedriver';

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

    it('fails to define a custom driver with missing methods [promise]', function(done) {
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

    it('defines a driver synchronously when it doesn\'t have _supports()', function(done) {
        var customDriver = {
            _driver: 'dummyStorageDriver' + (+new Date()),
            _initStorage: function() { },
            // _support: function() { return true; }
            iterate: function() { },
            getItem: function() { },
            setItem: function() { },
            removeItem: function() { },
            clear: function() { },
            length: function() { },
            key: function() { },
            keys: function() { }
        };

        localforage.defineDriver(customDriver);
        localforage.setDriver(customDriver._driver).then(function() {
            expect(localforage.driver()).to.be(customDriver._driver);
            done();
        });
    });

    it('defines a driver synchronously when it has boolean _supports()', function(done) {
        var customDriver = {
            _driver: 'dummyStorageDriver' + (+new Date()),
            _initStorage: function() { },
            _support: true,
            iterate: function() { },
            getItem: function() { },
            setItem: function() { },
            removeItem: function() { },
            clear: function() { },
            length: function() { },
            key: function() { },
            keys: function() { }
        };

        localforage.defineDriver(customDriver);
        localforage.setDriver(customDriver._driver).then(function() {
            expect(localforage.driver()).to.be(customDriver._driver);
            done();
        });
    });

    it('defines a driver asynchronously when _supports() returns a Promise<boolean>', function(done) {
        var customDriver = {
            _driver: 'dummyStorageDriver' + (+new Date()),
            _initStorage: function() { },
            _support: function() {
                return Promise.resolve(true);
            },
            iterate: function() { },
            getItem: function() { },
            setItem: function() { },
            removeItem: function() { },
            clear: function() { },
            length: function() { },
            key: function() { },
            keys: function() { }
        };

        localforage.defineDriver(customDriver).then(function() {
            return localforage.setDriver(customDriver._driver);
        }).then(function() {
            expect(localforage.driver()).to.be(customDriver._driver);
            done();
        });
    });

    it('sets and uses a custom driver', function(done) {
        localforage.defineDriver(dummyStorageDriver, function() {
            localforage.setDriver(dummyStorageDriver._driver, function(err) {
                expect(err).to.be(undefined);
                localforage.setItem('testCallbackKey', 'testCallbackValue', function(err) {
                    expect(err).to.be(null);
                    localforage.getItem('testCallbackKey', function(err, value) {
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
