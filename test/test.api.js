/* global after:true, afterEach:true, before:true, beforeEach:true, describe:true, expect:true, it:true, Promise:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

var driverApiMethods = [
    'getItem',
    'setItem',
    'clear',
    'length',
    'removeItem',
    'key',
    'keys'
];

describe('localForage API', function() {
    // https://github.com/mozilla/localForage#working-on-localforage
    it('has Promises available', function() {
        expect(Promise).to.be.a('function');
    });
});

describe('localForage', function() {
    var appropriateDriver =
        (localforage.supports(localforage.INDEXEDDB) &&
         localforage.INDEXEDDB) ||
        (localforage.supports(localforage.WEBSQL) &&
         localforage.WEBSQL) ||
        (localforage.supports(localforage.LOCALSTORAGE) &&
         localforage.LOCALSTORAGE);

    it('automatically selects the most appropriate driver (' +
       appropriateDriver + ')', function(done) {
        this.timeout(10000);
        localforage.ready().then(function() {
            expect(localforage.driver()).to.be(appropriateDriver);
            done();
        }, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to
                                 .be('No available storage method found.');
            expect(localforage.driver()).to.be(null);
            done();
        });
    });

    it('errors when a requested driver is not found [callback]', function(done) {
        localforage.getDriver('UnknownDriver', null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to
                                 .be('Driver not found.');
            done();
        });
    });

    it('errors when a requested driver is not found [promise]', function(done) {
        localforage.getDriver('UnknownDriver').then(null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to
                                 .be('Driver not found.');
            done();
        });
    });

    it('retrieves the serializer [callback]', function(done) {
        localforage.getSerializer(function(serializer) {
            expect(serializer).to.be.an('object');
            done();
        });
    });

    it('retrieves the serializer [promise]', function(done) {
        var serializerPromise = localforage.getSerializer();
        expect(serializerPromise).to.be.an('object');
        expect(serializerPromise.then).to.be.a('function');

        serializerPromise.then(function(serializer) {
            expect(serializer).to.be.an('object');
            done();
        });
    });

    it('does not support object parameter to setDriver', function(done) {
        var driverPreferedOrder = {
            '0': localforage.INDEXEDDB,
            '1': localforage.WEBSQL,
            '2': localforage.LOCALSTORAGE,
            length: 3
        };

        localforage.setDriver(driverPreferedOrder).then(null, function(error) {
            expect(error).to.be.an(Error);
            expect(error.message).to
                                 .be('No available storage method found.');
            done();
        });
    });

    it('skips drivers that fail to initilize', function(done) {
        var failingStorageDriver = (function() {
            function driverDummyMethod() {
                return Promise.reject(new Error('Driver Method Failed.'));
            }

            return {
                _driver: 'failingStorageDriver',
                _initStorage: function _initStorage() {
                    return Promise.reject(new Error('Driver Failed to Initialize.'));
                },
                iterate: driverDummyMethod,
                getItem: driverDummyMethod,
                setItem: driverDummyMethod,
                removeItem: driverDummyMethod,
                clear: driverDummyMethod,
                length: driverDummyMethod,
                key: driverDummyMethod,
                keys: driverDummyMethod
            };
        })();

        var driverPreferedOrder = [
            failingStorageDriver._driver,
            localforage.INDEXEDDB,
            localforage.WEBSQL,
            localforage.LOCALSTORAGE
        ];

        localforage.defineDriver(failingStorageDriver).then(function() {
            return localforage.setDriver(driverPreferedOrder);
        }).then(function() {
            return localforage.ready();
        }).then(function() {
            expect(localforage.driver()).to.be(appropriateDriver);
            done();
        });

    });

    describe('createInstance()', function() {
        var oldConsoleInfo;

        before(function() {
            oldConsoleInfo = console.info;
            var logs = [];
            console.info = function() {
                console.info.logs.push({
                    args: arguments
                });
                oldConsoleInfo.apply(this, arguments);
            };
            console.info.logs = logs;
        });

        after(function() {
            console.info = oldConsoleInfo;
        });

        it('does not log unnecessary messages', function() {
            var oldLogCount = console.info.logs.length;
            var localforage2 = localforage.createInstance();
            var localforage3 = localforage.createInstance();

            return Promise.all([
                localforage.ready(),
                localforage2.ready(),
                localforage3.ready()
            ]).then(function() {
                expect(console.info.logs.length).to.be(oldLogCount);
            });
        });
    });

});

DRIVERS.forEach(function(driverName) {
    if ((!localforage.supports(localforage.INDEXEDDB) &&
         driverName === localforage.INDEXEDDB) ||
        (!localforage.supports(localforage.LOCALSTORAGE) &&
         driverName === localforage.LOCALSTORAGE) ||
        (!localforage.supports(localforage.WEBSQL) &&
         driverName === localforage.WEBSQL)) {
        // Browser doesn't support this storage library, so we exit the API
        // tests.
        return;
    }

    describe(driverName + ' driver', function() {
        'use strict';

        this.timeout(30000);

        before(function(done) {
            localforage.setDriver(driverName).then(done);
        });

        beforeEach(function(done) {
            localStorage.clear();
            localforage.ready().then(function() {
                localforage.clear(done);
            });
        });

        it('has a localStorage API', function() {
            expect(localforage.getItem).to.be.a('function');
            expect(localforage.setItem).to.be.a('function');
            expect(localforage.clear).to.be.a('function');
            expect(localforage.length).to.be.a('function');
            expect(localforage.removeItem).to.be.a('function');
            expect(localforage.key).to.be.a('function');
        });

        it('has the localForage API', function() {
            expect(localforage._initStorage).to.be.a('function');
            expect(localforage.config).to.be.a('function');
            expect(localforage.defineDriver).to.be.a('function');
            expect(localforage.driver).to.be.a('function');
            expect(localforage.supports).to.be.a('function');
            expect(localforage.iterate).to.be.a('function');
            expect(localforage.getItem).to.be.a('function');
            expect(localforage.setItem).to.be.a('function');
            expect(localforage.clear).to.be.a('function');
            expect(localforage.length).to.be.a('function');
            expect(localforage.removeItem).to.be.a('function');
            expect(localforage.key).to.be.a('function');
            expect(localforage.getDriver).to.be.a('function');
            expect(localforage.setDriver).to.be.a('function');
            expect(localforage.ready).to.be.a('function');
            expect(localforage.createInstance).to.be.a('function');
            expect(localforage.getSerializer).to.be.a('function');
        });

        // Make sure we don't support bogus drivers.
        it('supports ' + driverName + ' database driver', function() {
            expect(localforage.supports(driverName) === true);
            expect(localforage.supports('I am not a driver') === false);
        });

        it('sets the right database driver', function() {
            expect(localforage.driver() === driverName);
        });

        it('has an empty length by default', function(done) {
            localforage.length(function(err, length) {
                expect(length).to.be(0);
                done();
            });
        });

        if (driverName === localforage.INDEXEDDB) {
            describe('Blob support', function() {
                var transaction;
                var called;
                var db;
                var blob = new Blob([''], {type: 'image/png'});

                before(function() {
                    db = localforage._dbInfo.db;
                    transaction = db.transaction;
                    db.transaction = function() {
                        called += 1;
                        return transaction.apply(db, arguments);
                    };
                });

                beforeEach(function() {
                    called = 0;
                });

                it('not check for non Blob', function(done) {
                    localforage.setItem('key', {}).then(function() {
                        expect(called).to.be(1);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('check for Blob', function(done) {
                    localforage.setItem('key', blob).then(function() {
                        expect(called).to.be.above(1);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('check for Blob once', function(done) {
                    localforage.setItem('key', blob).then(function() {
                        expect(called).to.be(1);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                after(function() {
                    localforage._dbInfo.db.transaction = transaction;
                });
            });

            describe('recover (reconnect) from IDBDatabase InvalidStateError', function() {

                beforeEach(function(done) {
                    Promise.all([
                        localforage.setItem('key', 'value1'),
                        localforage.setItem('key1', 'value1'),
                        localforage.setItem('key2', 'value2'),
                        localforage.setItem('key3', 'value3')
                    ]).then(function() {
                        localforage._dbInfo.db.close();
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('retrieves an item from the storage', function(done) {
                    localforage.getItem('key').then(function(value) {
                        expect(value).to.be('value1');
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('retrieves more than one items from the storage', function(done) {
                    Promise.all([
                        localforage.getItem('key1'),
                        localforage.getItem('key2'),
                        localforage.getItem('key3')
                    ]).then(function(values) {
                        expect(values).to.eql([
                            'value1',
                            'value2',
                            'value3'
                        ]);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('stores and retrieves an item from the storage', function(done) {
                    localforage.setItem('key', 'value1b').then(function() {
                        return localforage.getItem('key');
                    }).then(function(value) {
                        expect(value).to.be('value1b');
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                it('stores and retrieves more than one items from the storage', function(done) {
                    Promise.all([
                        localforage.setItem('key1', 'value1b'),
                        localforage.setItem('key2', 'value2b'),
                        localforage.setItem('key3', 'value3b')
                    ]).then(function() {
                        return Promise.all([
                            localforage.getItem('key1'),
                            localforage.getItem('key2'),
                            localforage.getItem('key3')
                        ]);
                    }).then(function(values) {
                        expect(values).to.eql([
                            'value1b',
                            'value2b',
                            'value3b'
                        ]);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });
            });
        }

        if (driverName === localforage.WEBSQL) {
            describe('on QUOTA ERROR', function() {
                var transaction;
                var called;
                var db;

                function getQuotaErrorCode(transaction) {
                    return new Promise(function(resolve) {
                        transaction(function(t) {
                            t.executeSql('');
                        }, function(err) {
                            resolve(err.QUOTA_ERR);
                        });
                    }).catch(function(err) {
                        return err.QUOTA_ERR;
                    });
                }

                beforeEach(function() {
                    called = 0;
                    db = localforage._dbInfo.db;
                    transaction = db.transaction;

                    db.transaction = function(fn, errFn) {
                        called += 1;
                        // restore the normal transaction,
                        // so that subsequent operations work
                        db.transaction = transaction;

                        getQuotaErrorCode(transaction).then(function(QUOTA_ERR) {
                            var error = new Error();
                            error.code = QUOTA_ERR;
                            errFn(error);
                        });
                    };
                });

                it('should retry setItem', function(done) {
                    localforage.setItem('key', {}).then(function() {
                        expect(called).to.be(1);
                        done();
                    }, function(error) {
                        done(error || 'error');
                    });
                });

                after(function() {
                    db.transaction = transaction || db.transaction;
                });
            });
        }

        it('should iterate [callback]', function(done) {
            localforage.setItem('officeX', 'InitechX', function(err, setValue) {
                expect(setValue).to.be('InitechX');

                localforage.getItem('officeX', function(err, value) {
                    expect(value).to.be(setValue);

                    localforage.setItem('officeY', 'InitechY', function(err, setValue) {
                        expect(setValue).to.be('InitechY');

                        localforage.getItem('officeY', function(err, value) {
                            expect(value).to.be(setValue);

                            var accumulator = {};
                            var iterationNumbers = [];

                            localforage.iterate(function(value, key, iterationNumber) {
                                accumulator[key] = value;
                                iterationNumbers.push(iterationNumber);
                            }, function() {
                                try {
                                    expect(accumulator.officeX).to.be('InitechX');
                                    expect(accumulator.officeY).to.be('InitechY');
                                    expect(iterationNumbers).to.eql([1, 2]);
                                    done();
                                } catch (e) {
                                    done(e);
                                }
                            });
                        });
                    });
                });
            });
        });

        it('should iterate [promise]', function(done) {
            var accumulator = {};
            var iterationNumbers = [];

            return localforage.setItem('officeX',
                                       'InitechX').then(function(setValue) {
                expect(setValue).to.be('InitechX');
                return localforage.getItem('officeX');
            }).then(function(value) {
                expect(value).to.be('InitechX');
                return localforage.setItem('officeY', 'InitechY');
            }).then(function(setValue) {
                expect(setValue).to.be('InitechY');
                return localforage.getItem('officeY');
            }).then(function(value) {
                expect(value).to.be('InitechY');

                return localforage.iterate(function(value, key,
                                                    iterationNumber) {
                    accumulator[key] = value;
                    iterationNumbers.push(iterationNumber);
                });
            }).then(function() {
                expect(accumulator.officeX).to.be('InitechX');
                expect(accumulator.officeY).to.be('InitechY');
                expect(iterationNumbers).to.eql([1, 2]);
                done();
            });
        });

        it('should break iteration with defined return value [callback]', function(done) {
            var breakCondition = 'Some value!';

            localforage.setItem('officeX', 'InitechX', function(err, setValue) {
                expect(setValue).to.be('InitechX');

                localforage.getItem('officeX', function(err, value) {
                    expect(value).to.be(setValue);

                    localforage.setItem('officeY', 'InitechY', function(err, setValue) {
                        expect(setValue).to.be('InitechY');

                        localforage.getItem('officeY', function(err, value) {
                            expect(value).to.be(setValue);

                            // Loop is broken within first iteration.
                            localforage.iterate(function() {
                                // Returning defined value will break the cycle.
                                return breakCondition;
                            }, function(err, loopResult) {
                                // The value that broken the cycle is returned
                                // as a result.
                                expect(loopResult).to.be(breakCondition);

                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should break iteration with defined return value [promise]', function(done) {
            var breakCondition = 'Some value!';

            localforage.setItem('officeX', 'InitechX').then(function(setValue) {
                expect(setValue).to.be('InitechX');
                return localforage.getItem('officeX');
            }).then(function(value) {
                expect(value).to.be('InitechX');
                return localforage.setItem('officeY', 'InitechY');
            }).then(function(setValue) {
                expect(setValue).to.be('InitechY');
                return localforage.getItem('officeY');
            }).then(function(value) {
                expect(value).to.be('InitechY');
                return localforage.iterate(function() {
                    return breakCondition;
                });
            }).then(function(result) {
                expect(result).to.be(breakCondition);
                done();
            });
        });

        it('should iterate() through only its own keys/values', function(done) {
            localStorage.setItem('local', 'forage');
            localforage.setItem('office', 'Initech').then(function() {
                return localforage.setItem('name', 'Bob');
            }).then(function() {
                // Loop through all key/value pairs; {local: 'forage'} set
                // manually should not be returned.
                var numberOfItems = 0;
                var iterationNumberConcat = '';

                localStorage.setItem('locals', 'forages');

                localforage.iterate(function(value, key, iterationNumber) {
                    expect(key).to.not.be('local');
                    expect(value).to.not.be('forage');
                    numberOfItems++;
                    iterationNumberConcat += iterationNumber;
                }, function(err) {
                    if (!err) {
                        // While there are 4 items in localStorage,
                        // only 2 items were set using localForage.
                        expect(numberOfItems).to.be(2);

                        // Only 2 items were set using localForage,
                        // so we should get '12' and not '1234'
                        expect(iterationNumberConcat).to.be('12');

                        done();
                    }
                });
            });
        });

        // Test for https://github.com/mozilla/localForage/issues/175
        it('nested getItem inside clear works [callback]', function(done) {
            localforage.setItem('hello', 'Hello World !', function() {
                localforage.clear(function() {
                    localforage.getItem('hello', function(secondValue) {
                        expect(secondValue).to.be(null);
                        done();
                    });
                });
            });
        });
        it('nested getItem inside clear works [promise]', function(done) {
            localforage.setItem('hello', 'Hello World !').then(function() {
                return localforage.clear();
            }).then(function() {
                return localforage.getItem('hello');
            }).then(function(secondValue) {
                expect(secondValue).to.be(null);
                done();
            });
        });

        // Because localStorage doesn't support saving the `undefined` type, we
        // always return `null` so that localForage is consistent across
        // browsers.
        // https://github.com/mozilla/localForage/pull/42
        it('returns null for undefined key [callback]', function(done) {
            localforage.getItem('key', function(err, value) {
                expect(value).to.be(null);
                done();
            });
        });

        it('returns null for undefined key [promise]', function(done) {
            localforage.getItem('key').then(function(value) {
                expect(value).to.be(null);
                done();
            });
        });

        it('saves an item [callback]', function(done) {
            localforage.setItem('office', 'Initech', function(err, setValue) {
                expect(setValue).to.be('Initech');

                localforage.getItem('office', function(err, value) {
                    expect(value).to.be(setValue);
                    done();
                });
            });
        });

        it('saves an item [promise]', function(done) {
            localforage.setItem('office', 'Initech').then(function(setValue) {
                expect(setValue).to.be('Initech');

                return localforage.getItem('office');
            }).then(function(value) {
                expect(value).to.be('Initech');
                done();
            });
        });

        it('saves an item over an existing key [callback]', function(done) {
            localforage.setItem('4th floor', 'Mozilla', function(err, setValue) {
                expect(setValue).to.be('Mozilla');

                localforage.setItem('4th floor', 'Quora', function(err, newValue) {
                    expect(newValue).to.not.be(setValue);
                    expect(newValue).to.be('Quora');

                    localforage.getItem('4th floor', function(err, value) {
                        expect(value).to.not.be(setValue);
                        expect(value).to.be(newValue);
                        done();
                    });
                });
            });
        });
        it('saves an item over an existing key [promise]', function(done) {
            localforage.setItem('4e', 'Mozilla').then(function(setValue) {
                expect(setValue).to.be('Mozilla');

                return localforage.setItem('4e', 'Quora');
            }).then(function(newValue) {
                expect(newValue).to.not.be('Mozilla');
                expect(newValue).to.be('Quora');

                return localforage.getItem('4e');
            }).then(function(value) {
                expect(value).to.not.be('Mozilla');
                expect(value).to.be('Quora');
                done();
            });
        });

        it('returns null when saving undefined [callback]', function(done) {
            localforage.setItem('undef', undefined, function(err, setValue) {
                expect(setValue).to.be(null);

                done();
            });
        });
        it('returns null when saving undefined [promise]', function(done) {
            localforage.setItem('undef', undefined).then(function(setValue) {
                expect(setValue).to.be(null);

                done();
            });
        });

        it('returns null for a non-existant key [callback]', function(done) {
            localforage.getItem('undef', function(err, value) {
                expect(value).to.be(null);

                done();
            });
        });
        it('returns null for a non-existant key [promise]', function(done) {
            localforage.getItem('undef').then(function(value) {
                expect(value).to.be(null);

                done();
            });
        });

        // github.com/mozilla/localforage/pull/24#discussion-diff-9389662R158
        // localStorage's method API (`localStorage.getItem('foo')`) returns
        // `null` for undefined keys, even though its getter/setter API
        // (`localStorage.foo`) returns `undefined` for the same key. Gaia's
        // asyncStorage API, which is based on localStorage and upon which
        // localforage is based, ALSO returns `null`. BLARG! So for now, we
        // just return null, because there's no way to know from localStorage
        // if the key is ACTUALLY `null` or undefined but returning `null`.
        // And returning `undefined` here would break compatibility with
        // localStorage fallback. Maybe in the future we won't care...
        it('returns null from an undefined key [callback]', function(done) {
            localforage.key(0, function(err, key) {
                expect(key).to.be(null);

                done();
            });
        });
        it('returns null from an undefined key [promise]', function(done) {
            localforage.key(0).then(function(key) {
                expect(key).to.be(null);

                done();
            });
        });

        it('returns key name [callback]', function(done) {
            localforage.setItem('office', 'Initech').then(function() {
                localforage.key(0, function(err, key) {
                    expect(key).to.be('office');

                    done();
                });
            });
        });
        it('returns key name [promise]', function(done) {
            localforage.setItem('office', 'Initech').then(function() {
                return localforage.key(0);
            }).then(function(key) {
                expect(key).to.be('office');

                done();
            });
        });

        it('removes an item [callback]', function(done) {
            localforage.setItem('office', 'Initech', function() {
                localforage.setItem('otherOffice', 'Initrode', function() {
                    localforage.removeItem('office', function() {
                        localforage.getItem('office', function(err, emptyValue) {
                            expect(emptyValue).to.be(null);

                            localforage.getItem('otherOffice', function(err, value) {
                                expect(value).to.be('Initrode');

                                done();
                            });
                        });
                    });
                });
            });
        });
        it('removes an item [promise]', function(done) {
            localforage.setItem('office', 'Initech').then(function() {
                return localforage.setItem('otherOffice', 'Initrode');
            }).then(function() {
                return localforage.removeItem('office');
            }).then(function() {
                return localforage.getItem('office');
            }).then(function(emptyValue) {
                expect(emptyValue).to.be(null);

                return localforage.getItem('otherOffice');
            }).then(function(value) {
                expect(value).to.be('Initrode');

                done();
            });
        });

        it('removes all items [callback]', function(done) {
            localforage.setItem('office', 'Initech', function() {
                localforage.setItem('otherOffice', 'Initrode', function() {
                    localforage.length(function(err, length) {
                        expect(length).to.be(2);

                        localforage.clear(function() {
                            localforage.getItem('office', function(err, value) {
                                expect(value).to.be(null);

                                localforage.length(function(err, length) {
                                    expect(length).to.be(0);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
        it('removes all items [promise]', function(done) {
            localforage.setItem('office', 'Initech').then(function() {
                return localforage.setItem('otherOffice', 'Initrode');
            }).then(function() {
                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(2);

                return localforage.clear();
            }).then(function() {
                return localforage.getItem('office');
            }).then(function(value) {
                expect(value).to.be(null);

                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(0);

                done();
            });
        });

        if (driverName === localforage.LOCALSTORAGE) {
            it('removes only own items upon clear', function(done) {
                localStorage.setItem('local', 'forage');

                localforage.setItem('office', 'Initech').then(function() {
                    return localforage.clear();
                }).then(function() {
                    expect(localStorage.getItem('local')).to.be('forage');

                    localStorage.clear();

                    done();
                });
            });

            it('returns only its own keys from keys()', function(done) {
                localStorage.setItem('local', 'forage');

                localforage.setItem('office', 'Initech').then(function() {
                    return localforage.keys();
                }).then(function(keys) {
                    expect(keys).to.eql(['office']);

                    localStorage.clear();

                    done();
                });
            });

            it('counts only its own items with length()', function(done) {
                localStorage.setItem('local', 'forage');
                localStorage.setItem('another', 'value');

                localforage.setItem('office', 'Initech').then(function() {
                    return localforage.length();
                }).then(function(length) {
                    expect(length).to.be(1);

                    localStorage.clear();

                    done();
                });
            });
        }

        it('has a length after saving an item [callback]', function(done) {
            localforage.length(function(err, length) {
                expect(length).to.be(0);
                localforage.setItem('rapper', 'Black Thought', function() {
                    localforage.length(function(err, length) {
                        expect(length).to.be(1);

                        done();
                    });
                });
            });
        });
        it('has a length after saving an item [promise]', function(done) {
            localforage.length().then(function(length) {
                expect(length).to.be(0);

                return localforage.setItem('lame rapper', 'Vanilla Ice');
            }).then(function() {
                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(1);

                done();
            });
        });

        // Deal with non-string keys, see issue #250
        // https://github.com/mozilla/localForage/issues/250
        it('casts an undefined key to a String', function(done) {
            localforage.setItem(undefined, 'goodness!').then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.getItem(undefined);
            }).then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.removeItem(undefined);
            }).then(function() {
                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(0);
                done();
            });
        });

        it('casts a null key to a String', function(done) {
            localforage.setItem(null, 'goodness!').then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.getItem(null);
            }).then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.removeItem(null);
            }).then(function() {
                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(0);
                done();
            });
        });

        it('casts a float key to a String', function(done) {
            localforage.setItem(537.35737, 'goodness!').then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.getItem(537.35737);
            }).then(function(value) {
                expect(value).to.be('goodness!');

                return localforage.removeItem(537.35737);
            }).then(function() {
                return localforage.length();
            }).then(function(length) {
                expect(length).to.be(0);
                done();
            });
        });

        it('is retrieved by getDriver [callback]', function(done) {
            localforage.getDriver(driverName, function(driver) {
                expect(typeof driver).to.be('object');
                driverApiMethods.concat('_initStorage').forEach(function(methodName) {
                    expect(typeof driver[methodName]).to.be('function');
                });
                expect(driver._driver).to.be(driverName);
                done();
            });
        });

        it('is retrieved by getDriver [promise]', function(done) {
            localforage.getDriver(driverName).then(function(driver) {
                expect(typeof driver).to.be('object');
                driverApiMethods.concat('_initStorage').forEach(function(methodName) {
                    expect(typeof driver[methodName]).to.be('function');
                });
                expect(driver._driver).to.be(driverName);
                done();
            });
        });

        if (driverName === localforage.WEBSQL ||
            driverName === localforage.LOCALSTORAGE) {
            it('exposes the serializer on the dbInfo object', function(done) {
                localforage.ready().then(function() {
                    expect(localforage._dbInfo.serializer).to.be.an('object');
                    done();
                });
            });
        }
    });

    function prepareStorage(storageName) {
        // Delete IndexedDB storages (start from scratch)
        // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
        if (driverName === localforage.INDEXEDDB) {
            return new Promise(function(resolve) {
                // eslint-disable-next-line no-use-before-define
                var indexedDB = (indexedDB || window.indexedDB ||
                                 window.webkitIndexedDB ||
                                 window.mozIndexedDB || window.OIndexedDB ||
                                 window.msIndexedDB);

                indexedDB.deleteDatabase(storageName).onsuccess = resolve;
            });
        }

        // Otherwise, do nothing
        return Promise.resolve();
    }

    describe(driverName + ' driver multiple instances', function() {
        'use strict';

        this.timeout(30000);

        var localforage2 = null;
        var localforage3 = null;

        before(function(done) {

            prepareStorage('storage2').then(function() {
                localforage2 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename2'
                });

                // Same name, but different storeName since this has been
                // malfunctioning before w/ IndexedDB.
                localforage3 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename3'
                });

                Promise.all([
                    localforage.setDriver(driverName),
                    localforage2.setDriver(driverName),
                    localforage3.setDriver(driverName)
                ]).then(function() {
                    done();
                });
            });
        });

        beforeEach(function(done) {
            Promise.all([
                localforage.clear(),
                localforage2.clear(),
                localforage3.clear()
            ]).then(function() {
                done();
            });
        });

        it('is not be able to access values of other instances', function(done) {
            Promise.all([
                localforage.setItem('key1', 'value1a'),
                localforage2.setItem('key2', 'value2a'),
                localforage3.setItem('key3', 'value3a')
            ]).then(function() {
                return Promise.all([
                    localforage.getItem('key2').then(function(value) {
                        expect(value).to.be(null);
                    }),
                    localforage2.getItem('key1').then(function(value) {
                        expect(value).to.be(null);
                    }),
                    localforage2.getItem('key3').then(function(value) {
                        expect(value).to.be(null);
                    }),
                    localforage3.getItem('key2').then(function(value) {
                        expect(value).to.be(null);
                    })
                ]);
            }).then(function() {
                done();
            }, function(errors) {
                done(new Error(errors));
            });
        });

        it('retrieves the proper value when using the same key with other instances', function(done) {
            Promise.all([
                localforage.setItem('key', 'value1'),
                localforage2.setItem('key', 'value2'),
                localforage3.setItem('key', 'value3')
            ]).then(function() {
                return Promise.all([
                    localforage.getItem('key').then(function(value) {
                        expect(value).to.be('value1');
                    }),
                    localforage2.getItem('key').then(function(value) {
                        expect(value).to.be('value2');
                    }),
                    localforage3.getItem('key').then(function(value) {
                        expect(value).to.be('value3');
                    })
                ]);
            }).then(function() {
                done();
            }, function(errors) {
                done(new Error(errors));
            });
        });
    });

    // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
    describe(driverName + ' driver multiple instances (concurrent on same database)', function() {

        'use strict';

        this.timeout(30000);

        before(function() {
            return Promise.all([
                prepareStorage('storage3'),
                prepareStorage('commonStorage'),
                prepareStorage('commonStorage2'),
                prepareStorage('commonStorage3')
            ]);
        });

        it('chains operation on multiple stores', function() {
            var localforage1 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store1',
                size: 1024
            });

            var localforage2 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store2',
                size: 1024
            });

            var localforage3 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store3',
                size: 1024
            });

            var promise1 = localforage1.setItem('key', 'value1').then(function() {
                return localforage1.getItem('key');
            }).then(function(value) {
                expect(value).to.be('value1');
            });

            var promise2 = localforage2.setItem('key', 'value2').then(function() {
                return localforage2.getItem('key');
            }).then(function(value) {
                expect(value).to.be('value2');
            });

            var promise3 = localforage3.setItem('key', 'value3').then(function() {
                return localforage3.getItem('key');
            }).then(function(value) {
                expect(value).to.be('value3');
            });

            return Promise.all([
                promise1,
                promise2,
                promise3
            ]);
        });

        it('can create multiple instances of the same store', function() {
            var localforage1;
            var localforage2;
            var localforage3;

            Promise.resolve()
            .then(function() {
                localforage1 = localforage.createInstance({
                    name: 'commonStorage',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage1.ready();
            })
            .then(function() {
                localforage2 = localforage.createInstance({
                    name: 'commonStorage',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage2.ready();
            })
            .then(function() {
                localforage3 = localforage.createInstance({
                    name: 'commonStorage',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage3.ready();
            }).then(function() {
                return Promise.resolve()
                .then(function() {
                    return localforage1.setItem('key1', 'value1').then(function() {
                        return localforage1.getItem('key1');
                    }).then(function(value) {
                        expect(value).to.be('value1');
                    });
                })
                .then(function() {
                    return localforage2.setItem('key2', 'value2').then(function() {
                        return localforage2.getItem('key2');
                    }).then(function(value) {
                        expect(value).to.be('value2');
                    });
                })
                .then(function() {
                    return localforage3.setItem('key3', 'value3').then(function() {
                        return localforage3.getItem('key3');
                    }).then(function(value) {
                        expect(value).to.be('value3');
                    });
                });
            });
        });

        it('can create multiple instances of the same store and do concurrent operations', function() {
            var localforage1;
            var localforage2;
            var localforage3;
            var localforage3b;

            Promise.resolve()
            .then(function() {
                localforage1 = localforage.createInstance({
                    name: 'commonStorage2',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage1.ready();
            })
            .then(function() {
                localforage2 = localforage.createInstance({
                    name: 'commonStorage2',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage2.ready();
            })
            .then(function() {
                localforage3 = localforage.createInstance({
                    name: 'commonStorage2',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage3.ready();
            })
            .then(function() {
                localforage3b = localforage.createInstance({
                    name: 'commonStorage2',
                    storeName: 'commonStore',
                    size: 1024
                });
                return localforage3b.ready();
            }).then(function() {
                var promise1 = localforage1.setItem('key1', 'value1').then(function() {
                    return localforage1.getItem('key1');
                }).then(function(value) {
                    expect(value).to.be('value1');
                });

                var promise2 = localforage2.setItem('key2', 'value2').then(function() {
                    return localforage2.getItem('key2');
                }).then(function(value) {
                    expect(value).to.be('value2');
                });

                var promise3 = localforage3.setItem('key3', 'value3').then(function() {
                    return localforage3.getItem('key3');
                }).then(function(value) {
                    expect(value).to.be('value3');
                });

                var promise4 = localforage3b.setItem('key3', 'value3').then(function() {
                    return localforage3.getItem('key3');
                }).then(function(value) {
                    expect(value).to.be('value3');
                });

                return Promise.all([
                    promise1,
                    promise2,
                    promise3,
                    promise4
                ]);
            });
        });

        it('can create multiple instances of the same store concurrently', function() {
            var localforage1 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            var localforage2 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            var localforage3 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            var localforage3b = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            var promise1 = localforage1.setItem('key1', 'value1').then(function() {
                return localforage1.getItem('key1');
            }).then(function(value) {
                expect(value).to.be('value1');
            });

            var promise2 = localforage2.setItem('key2', 'value2').then(function() {
                return localforage2.getItem('key2');
            }).then(function(value) {
                expect(value).to.be('value2');
            });

            var promise3 = localforage3.setItem('key3', 'value3').then(function() {
                return localforage3.getItem('key3');
            }).then(function(value) {
                expect(value).to.be('value3');
            });

            var promise4 = localforage3b.setItem('key3', 'value3').then(function() {
                return localforage3.getItem('key3');
            }).then(function(value) {
                expect(value).to.be('value3');
            });

            return Promise.all([
                promise1,
                promise2,
                promise3,
                promise4
            ]);
        });
    });

    describe(driverName + ' driver', function() {
        'use strict';

        var driverPreferedOrder;

        before(function() {
            // add some unsupported drivers before
            // and after the target driver
            driverPreferedOrder = ['I am a not supported driver'];

            if (!localforage.supports(localforage.WEBSQL)) {
                driverPreferedOrder.push(localforage.WEBSQL);
            }
            if (!localforage.supports(localforage.INDEXEDDB)) {
                driverPreferedOrder.push(localforage.INDEXEDDB);
            }
            if (!localforage.supports(localforage.LOCALSTORAGE)) {
                driverPreferedOrder.push(localforage.localStorage);
            }

            driverPreferedOrder.push(driverName);

            driverPreferedOrder.push('I am another not supported driver');
        });

        it('is used according to setDriver preference order', function(done) {
            localforage.setDriver(driverPreferedOrder).then(function() {
                expect(localforage.driver()).to.be(driverName);
                done();
            });
        });
    });

    describe(driverName + ' driver when the callback throws an Error', function() {
        'use strict';

        var testObj = {
            throwFunc: function() {
                testObj.throwFuncCalls++;
                throw new Error('Thrown test error');
            },
            throwFuncCalls: 0
        };

        beforeEach(function(done) {
            testObj.throwFuncCalls = 0;
            done();
        });

        it('resolves the promise of getItem()', function(done) {
            localforage.getItem('key', testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of setItem()', function(done) {
            localforage.setItem('key', 'test', testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of clear()', function(done) {
            localforage.clear(testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of length()', function(done) {
            localforage.length(testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of removeItem()', function(done) {
            localforage.removeItem('key', testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of key()', function(done) {
            localforage.key('key', testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });

        it('resolves the promise of keys()', function(done) {
            localforage.keys(testObj.throwFunc).then(function() {
                expect(testObj.throwFuncCalls).to.be(1);
                done();
            });
        });
    });

    describe(driverName + ' driver when ready() gets rejected', function() {
        'use strict';

        this.timeout(30000);

        var _oldReady;

        beforeEach(function(done) {
            _oldReady = localforage.ready;
            localforage.ready = function() {
                return Promise.reject();
            };
            done();
        });

        afterEach(function(done) {
            localforage.ready = _oldReady;
            _oldReady = null;
            done();
        });

        driverApiMethods.forEach(function(methodName) {
            it('rejects ' + methodName + '() promise', function(done) {
                localforage[methodName]().then(null, function(/*err*/) {
                    done();
                });
            });
        });
    });
});

DRIVERS.forEach(function(driverName) {
    describe(driverName + ' driver instance', function() {
        it('creates a new instance and sets the driver', function(done) {
            var localforage2 = localforage.createInstance({
                name: 'storage2',
                driver: driverName,
                // We need a small value here
                // otherwise local PhantomJS test
                // will fail with SECURITY_ERR.
                // TravisCI seem to work fine though.
                size: 1024,
                storeName: 'storagename2'
            });

            // since config actually uses setDriver which is async,
            // and since driver() and supports() are not defered (are sync),
            // we have to wait till an async method returns
            localforage2.length().then(function() {
                expect(localforage2.driver()).to.be(driverName);
                done();
            }, function() {
                expect(localforage2.driver()).to.be(null);
                done();
            });
        });
    });
});
