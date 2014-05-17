/* global before:true, beforeEach:true, describe:true, expect:true, it:true, Modernizr:true, Promise:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

describe('localForage API', function() {
    beforeEach(function(done) {
        localforage.clear(done);
    });

    // If this test is failing, you are likely missing the Promises polyfill,
    // installed via bower. Read more here:
    // https://github.com/mozilla/localForage#working-on-localforage
    it('has Promises available', function() {
        expect(typeof Promise).to.be('function');
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

        before(function() {
            localforage.setDriver(driverName);
        });

        beforeEach(function(done) {
            localforage.clear(done);
        });

        it('has a localStorage API', function() {
            expect(typeof localforage.getItem).to.be('function');
            expect(typeof localforage.setItem).to.be('function');
            expect(typeof localforage.clear).to.be('function');
            expect(typeof localforage.length).to.be('function');
            expect(typeof localforage.removeItem).to.be('function');
            expect(typeof localforage.key).to.be('function');
        });

        it('has the localForage API', function() {
            expect(typeof localforage._initStorage).to.be('function');
            expect(typeof localforage.driver).to.be('function');
            expect(typeof localforage.getItem).to.be('function');
            expect(typeof localforage.setItem).to.be('function');
            expect(typeof localforage.clear).to.be('function');
            expect(typeof localforage.length).to.be('function');
            expect(typeof localforage.removeItem).to.be('function');
            expect(typeof localforage.key).to.be('function');
            expect(typeof localforage.setDriver).to.be('function');
            expect(typeof localforage.ready).to.be('function');
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
});
