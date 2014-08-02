/* global beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
describe('Driver API', function() {
    'use strict';

    beforeEach(function(done) {
        if (Modernizr.indexeddb) {
            localforage.setDriver(localforage.INDEXEDDB, function() {
                done();
            });
        } else if (Modernizr.websqldatabase) {
            localforage.setDriver(localforage.WEBSQL, function() {
                done();
            });
        } else {
            done();
        }
    });

    it('can change to localStorage from other driver' +
       ' [callback]', function(done) {
        if ((Modernizr.indexeddb &&
             localforage.driver() === localforage.INDEXEDDB) ||
            (Modernizr.websqldatabase &&
             localforage.driver() === localforage.WEBSQL)) {
            var previousDriver = localforage.driver();

            localforage.setDriver(localforage.LOCALSTORAGE, function() {
                expect(localforage.driver()).to.be(localforage.LOCALSTORAGE);
                expect(localforage.driver()).to.not.be(previousDriver);
                done();
            });
        } else {
            done();
        }
    });
    it('can change to localStorage from other driver' +
       ' [promise]', function(done) {
        if ((Modernizr.indexeddb &&
             localforage.driver() === localforage.INDEXEDDB) ||
            (Modernizr.websqldatabase &&
             localforage.driver() === localforage.WEBSQL)) {
            var previousDriver = localforage.driver();

            localforage.setDriver(localforage.LOCALSTORAGE).then(function() {
                expect(localforage.driver()).to.be(localforage.LOCALSTORAGE);
                expect(localforage.driver()).to.not.be(previousDriver);
                done();
            });
        } else {
            done();
        }
    });

    if (!Modernizr.indexeddb) {
        it("can't use unsupported IndexedDB [callback]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.INDEXEDDB);

            // These should be rejected in component builds but aren't.
            // TODO: Look into why.
            localforage.setDriver(localforage.INDEXEDDB, null, function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
        it("can't use unsupported IndexedDB [promise]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.INDEXEDDB);

            // These should be rejected in component builds but aren't.
            // TODO: Look into why.
            localforage.setDriver(localforage.INDEXEDDB).then(null,
                                                              function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
    } else {
        it('can set already active IndexedDB [callback]', function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.be(localforage.INDEXEDDB);

            localforage.setDriver(localforage.INDEXEDDB, function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
        it('can set already active IndexedDB [promise]', function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.be(localforage.INDEXEDDB);

            localforage.setDriver(localforage.INDEXEDDB).then(function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
    }

    if (!Modernizr.localstorage) {
        it("can't use unsupported localStorage [callback]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.LOCALSTORAGE);

            localforage.setDriver(localforage.LOCALSTORAGE, null, function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
        it("can't use unsupported localStorage [promise]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.LOCALSTORAGE);

            localforage.setDriver(localforage.LOCALSTORAGE).then(null,
                                                              function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
    } else if (!Modernizr.indexeddb && !Modernizr.websqldatabase) {
        it('can set already active localStorage [callback]', function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.be(localforage.LOCALSTORAGE);

            localforage.setDriver(localforage.LOCALSTORAGE, function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
        it('can set already active localStorage [promise]', function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.be(localforage.LOCALSTORAGE);

            localforage.setDriver(localforage.LOCALSTORAGE).then(function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
    }

    if (!Modernizr.websqldatabase) {
        it("can't use unsupported WebSQL [callback]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.WEBSQL);

            localforage.setDriver(localforage.WEBSQL, null, function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
        it("can't use unsupported WebSQL [promise]", function(done) {
            var previousDriver = localforage.driver();
            expect(previousDriver).to.not.be(localforage.WEBSQL);

            localforage.setDriver(localforage.WEBSQL).then(null,
                                                              function() {
                expect(localforage.driver()).to.be(previousDriver);
                done();
            });
        });
    } else {
        it('can set already active WebSQL [callback]', function(done) {
            localforage.setDriver(localforage.WEBSQL, function() {
                var previousDriver = localforage.driver();
                expect(previousDriver).to.be(localforage.WEBSQL);

                localforage.setDriver(localforage.WEBSQL, function() {
                    expect(localforage.driver()).to.be(previousDriver);
                    done();
                });
            });
        });
        it('can set already active WebSQL [promise]', function(done) {
            localforage.setDriver(localforage.WEBSQL).then(function() {
                var previousDriver = localforage.driver();
                expect(previousDriver).to.be(localforage.WEBSQL);

                localforage.setDriver(localforage.WEBSQL).then(function() {
                    expect(localforage.driver()).to.be(previousDriver);
                    done();
                });
            });
        });
    }
});
