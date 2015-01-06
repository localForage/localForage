/* global afterEach:true, before:true, beforeEach:true, describe:true, expect:true, it:true, Modernizr:true, Promise:true, require:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

var componentBuild = window.require && window.require.modules &&
                     window.require.modules.localforage &&
                     window.require.modules.localforage.component;

describe('localForage API', function() {
    // If this test is failing, you are likely missing the Promises polyfill,
    // installed via bower. Read more here:
    // https://github.com/mozilla/localForage#working-on-localforage
    it('has Promises available', function() {
        if (componentBuild) {
            expect(require('promise')).to.be.a('function');
        } else {
            expect(Promise).to.be.a('function');
        }
    });
});

describe('localForage', function() {
    var appropriateDriver;

    before(function() {
        appropriateDriver =
            (localforage.supports(localforage.INDEXEDDB) &&
             localforage.INDEXEDDB) ||
            (localforage.supports(localforage.WEBSQL) &&
             localforage.WEBSQL) ||
            (localforage.supports(localforage.LOCALSTORAGE) &&
             localforage.LOCALSTORAGE);
    });

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
});

DRIVERS.forEach(function(driverName) {
    if ((!Modernizr.indexeddb && driverName === localforage.INDEXEDDB) ||
        (!Modernizr.localstorage && driverName === localforage.LOCALSTORAGE) ||
        (!Modernizr.websqldatabase && driverName === localforage.WEBSQL)) {
        // Browser doesn't support this storage library, so we exit the API
        // tests.
        return;
    }

    describe(driverName + ' driver', function() {
        'use strict';

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
            expect(localforage.setDriver).to.be.a('function');
            expect(localforage.ready).to.be.a('function');
            expect(localforage.createInstance).to.be.a('function');
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

        it('should iterate [callback]', function(done) {
            localforage.setItem('officeX', 'InitechX', function(err, setValue) {
                expect(setValue).to.be('InitechX');

                localforage.getItem('officeX', function(err, value) {
                    expect(value).to.be(setValue);

                    localforage.setItem('officeY', 'InitechY',
                                        function(err, setValue) {
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

        it('should iterate [promise]', function() {
            var accumulator = {};
            var iterationNumbers = [];

            return localforage.setItem('officeX', 'InitechX').then(function(setValue) {
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

                return localforage.iterate(function(value, key, iterationNumber) {
                    accumulator[key] = value;
                    iterationNumbers.push(iterationNumber);
                });
            }).then(function() {
                expect(accumulator.officeX).to.be('InitechX');
                expect(accumulator.officeY).to.be('InitechY');
                expect(iterationNumbers).to.eql([1, 2]);
            });
        });

        it('should break iteration with defined return value [callback]',
           function(done) {
            var breakCondition = 'Some value!';

            localforage.setItem('officeX', 'InitechX', function(err, setValue) {
                expect(setValue).to.be('InitechX');

                localforage.getItem('officeX', function(err, value) {
                    expect(value).to.be(setValue);

                    localforage.setItem('officeY', 'InitechY',
                                        function(err, setValue) {
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

        it('should break iteration with defined return value [promise]',
           function(done) {
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
            localforage.setItem('4th floor', 'Mozilla',
                                function(err, setValue) {
                expect(setValue).to.be('Mozilla');

                localforage.setItem('4th floor', 'Quora',
                                    function(err, newValue) {
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
                        localforage.getItem('office',
                                            function(err, emptyValue) {
                            expect(emptyValue).to.be(null);

                            localforage.getItem('otherOffice',
                                                function(err, value) {
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
    });

    describe(driverName + ' driver multiple instances', function() {
        'use strict';
        var localforage2 = null;
        var Promise;

        before(function(done) {
            Promise = window.Promise || require('promise');

            localforage2 = localforage.createInstance({
                name: 'storage2',
                // We need a small value here
                // otherwise local PhantomJS test
                // will fail with SECURITY_ERR.
                // TravisCI seem to work fine though.
                size: 1024,
                storeName: 'storagename2'
            });

            Promise.all([
                localforage.setDriver(driverName),
                localforage2.setDriver(driverName)
            ])
            .then(function() {
                done();
            });
        });

        beforeEach(function(done) {
            Promise.all([
                localforage.clear(),
                localforage2.clear()
            ]).then(function() {
                done();
            });
        });

        it('is not be able to access values of other instances', function(done) {
            Promise.all([
                localforage.setItem('key1', 'value1a'),
                localforage2.setItem('key2', 'value2a')
            ]).then(function() {
                return Promise.all([
                    localforage.getItem('key2').then(function(value) {
                        expect(value).to.be(null);
                    }),
                    localforage2.getItem('key1').then(function(value) {
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
                localforage2.setItem('key', 'value2')
            ]).then(function() {
                return Promise.all([
                    localforage.getItem('key').then(function(value) {
                        expect(value).to.be('value1');
                    }),
                    localforage2.getItem('key').then(function(value) {
                        expect(value).to.be('value2');
                    })
                ]);
            }).then(function() {
                done();
            }, function(errors) {
                done(new Error(errors));
            });
        });
    });

    describe(driverName + ' driver', function() {
        'use strict';

        var driverPreferedOrder;

        before(function() {
            // add some unsupported drivers before
            // and after the target driver
            driverPreferedOrder = ['I am a not supported driver'];

            if (!Modernizr.websqldatabase) {
                driverPreferedOrder.push(localforage.WEBSQL);
            }
            if (!Modernizr.indexeddb) {
                driverPreferedOrder.push(localforage.INDEXEDDB);
            }
            if (!Modernizr.localstorage) {
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

        var _oldReady;
        var Promise;

        before(function() {
            Promise = window.Promise || require('promise');
        });

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

        var driverApiMethods = [
            'getItem',
            'setItem',
            'clear',
            'length',
            'removeItem',
            'key',
            'keys'
        ];

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
