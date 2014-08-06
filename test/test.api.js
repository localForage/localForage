/* global afterEach:true, before:true, beforeEach:true, describe:true, expect:true, it:true, Modernizr:true, Promise:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

describe('localForage API', function() {
    beforeEach(function(done) {
        localforage.clear(done);
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
            (localforage.supports(localforage.localStorage) &&
             localforage.localStorage);
    });

    it('automatically selects the most appropriate driver (' +
       appropriateDriver + ')', function(done) {
        if (appropriateDriver) {
            localforage.ready().then(function() {
                expect(localforage.driver()).to.be(appropriateDriver);
                done();
            });
        } else {
            localforage.ready().then(null, function(error) {
                expect(error).to.be.an(Error);
                expect(error.message).to
                                     .be('No available storage method found.');
                expect(localforage.driver()).to.be(null);
                done();
            });
        }
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
            localforage.clear(done);
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
            expect(localforage.driver).to.be.a('function');
            expect(localforage.supports).to.be.a('function');
            expect(localforage.getItem).to.be.a('function');
            expect(localforage.setItem).to.be.a('function');
            expect(localforage.clear).to.be.a('function');
            expect(localforage.length).to.be.a('function');
            expect(localforage.removeItem).to.be.a('function');
            expect(localforage.key).to.be.a('function');
            expect(localforage.setDriver).to.be.a('function');
            expect(localforage.ready).to.be.a('function');
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
            localforage.length(function(length) {
                expect(length).to.be(0);
                done();
            });
        });

        // Because localStorage doesn't support saving the `undefined` type, we
        // always return `null` so that localForage is consistent across
        // browsers.
        // https://github.com/mozilla/localForage/pull/42
        it('returns null for undefined key [callback]', function(done) {
            localforage.getItem('key', function(value) {
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
            localforage.setItem('office', 'Initech', function(setValue) {
                expect(setValue).to.be('Initech');

                localforage.getItem('office', function(value) {
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
            localforage.setItem('4th floor', 'Mozilla', function(setValue) {
                expect(setValue).to.be('Mozilla');

                localforage.setItem('4th floor', 'Quora', function(newValue) {
                    expect(newValue).to.not.be(setValue);
                    expect(newValue).to.be('Quora');

                    localforage.getItem('4th floor', function(value) {
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
            localforage.setItem('undef', undefined, function(setValue) {
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
            localforage.getItem('undef', function(value) {
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
            localforage.key(0, function(key) {
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
                localforage.key(0, function(key) {
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
                        localforage.getItem('office', function(emptyValue) {
                            expect(emptyValue).to.be(null);

                            localforage.getItem('otherOffice',
                                                function(value) {
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
                    localforage.length(function(length) {
                        expect(length).to.be(2);

                        localforage.clear(function() {
                            localforage.getItem('office', function(value) {
                                expect(value).to.be(null);

                                localforage.length(function(length) {
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

        it('has a length after saving an item [callback]', function(done) {
            localforage.length(function(length) {
                expect(length).to.be(0);
                localforage.setItem('rapper', 'Black Thought', function() {
                    localforage.length(function(length) {
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

    describe(driverName + ' driver when ready() gets rejected', function() {
        'use strict';

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

        it('rejects getItem() promise', function(done) {
            localforage.getItem().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects setItem() promise', function(done) {
            localforage.setItem().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects clear() promise', function(done) {
            localforage.clear().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects length() promise', function(done) {
            localforage.length().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects removeItem() promise', function(done) {
            localforage.removeItem().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects key() promise', function(done) {
            localforage.key().then(null, function(/*err*/) {
                done();
            });
        });

        it('rejects keys() promise', function(done) {
            localforage.keys().then(null, function(/*err*/) {
                done();
            });
        });
    });
});
