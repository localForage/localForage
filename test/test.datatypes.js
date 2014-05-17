/* global before:true, beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
];

// var componentBuild = window.require && window.require.modules &&
//                      window.require.modules.localforage &&
//                      window.require.modules.localforage.component;

DRIVERS.forEach(function(driverName) {
    if ((!Modernizr.indexeddb && driverName === localforage.INDEXEDDB) ||
        (!Modernizr.localstorage && driverName === localforage.LOCALSTORAGE) ||
        (!Modernizr.websqldatabase && driverName === localforage.WEBSQL)) {
        // Browser doesn't support this storage library, so we exit the API
        // tests.
        return;
    }

    describe('Type handler for ' + driverName, function() {
        'use strict';

        before(function(done) {
            localforage.setDriver(driverName).then(done);
        });

        beforeEach(function(done) {
            localforage.clear(done);
        });

        it('saves a string [callback]', function(done) {
            localforage.setItem('office', 'Initech', function(setValue) {
                expect(setValue).to.be('Initech');

                localforage.getItem('office', function(value) {
                    expect(value).to.be(setValue);
                    done();
                });
            });
        });
        it('saves a string [promise]', function(done) {
            localforage.setItem('office', 'Initech').then(function(setValue) {
                expect(setValue).to.be('Initech');

                return localforage.getItem('office');
            }).then(function(value) {
                expect(value).to.be('Initech');
                done();
            });
        });

        it('saves a number [callback]', function(done) {
            localforage.setItem('number', 546, function(setValue) {
                expect(setValue).to.be(546);
                expect(typeof setValue).to.be('number');

                localforage.getItem('number', function(value) {
                    expect(value).to.be(setValue);
                    expect(typeof value).to.be('number');
                    done();
                });
            });
        });
        it('saves a number [promise]', function(done) {
            localforage.setItem('number', 546).then(function(setValue) {
                expect(setValue).to.be(546);
                expect(typeof setValue).to.be('number');

                return localforage.getItem('number');
            }).then(function(value) {
                expect(value).to.be(546);
                expect(typeof value).to.be('number');
                done();
            });
        });

        it('saves a boolean [callback]', function(done) {
            localforage.setItem('boolean', false, function(setValue) {
                expect(setValue).to.be(false);
                expect(typeof setValue).to.be('boolean');

                localforage.getItem('boolean', function(value) {
                    expect(value).to.be(setValue);
                    expect(typeof value).to.be('boolean');
                    done();
                });
            });
        });
        it('saves a boolean [promise]', function(done) {
            localforage.setItem('boolean', false).then(function(setValue) {
                expect(setValue).to.be(false);
                expect(typeof setValue).to.be('boolean');

                return localforage.getItem('boolean');
            }).then(function(value) {
                expect(value).to.be(false);
                expect(typeof value).to.be('boolean');
                done();
            });
        });

        it('saves null [callback]', function(done) {
            localforage.setItem('null', null, function(setValue) {
                expect(setValue).to.be(null);
                expect(typeof setValue).to.be('object');

                localforage.getItem('null', function(value) {
                    expect(value).to.be(setValue);
                    expect(typeof value).to.be('object');
                    done();
                });
            });
        });
        it('saves null [promise]', function(done) {
            localforage.setItem('null', null).then(function(setValue) {
                expect(setValue).to.be(null);
                expect(typeof setValue).to.be('object');

                return localforage.getItem('null');
            }).then(function(value) {
                expect(value).to.be(null);
                expect(typeof value).to.be('object');
                done();
            });
        });

        it('saves undefined as null [callback]', function(done) {
            localforage.setItem('null', undefined, function(setValue) {
                expect(setValue).to.be(null);
                expect(typeof setValue).to.be('object');

                localforage.getItem('null', function(value) {
                    expect(value).to.be(setValue);
                    expect(typeof value).to.be('object');
                    done();
                });
            });
        });
        it('saves undefined as null [promise]', function(done) {
            localforage.setItem('null', undefined).then(function(setValue) {
                expect(setValue).to.be(null);
                expect(typeof setValue).to.be('object');

                return localforage.getItem('null');
            }).then(function(value) {
                expect(value).to.be(null);
                expect(typeof value).to.be('object');
                done();
            });
        });

        it('saves a float [callback]', function(done) {
            localforage.setItem('float', 546.041, function(setValue) {
                expect(setValue).to.be(546.041);
                expect(typeof setValue).to.be('number');

                localforage.getItem('float', function(value) {
                    expect(value).to.be(setValue);
                    expect(typeof value).to.be('number');
                    done();
                });
            });
        });
        it('saves a float [promise]', function(done) {
            localforage.setItem('float', 546.041).then(function(setValue) {
                expect(setValue).to.be(546.041);
                expect(typeof setValue).to.be('number');

                return localforage.getItem('float');
            }).then(function(value) {
                expect(value).to.be(546.041);
                expect(typeof value).to.be('number');
                done();
            });
        });

        var arrayToSave = [2, 'one', true];
        it('saves an array [callback]', function(done) {
            localforage.setItem('array', arrayToSave, function(setValue) {
                expect(setValue.length).to.be(arrayToSave.length);
                expect(setValue instanceof Array).to.be(true);

                localforage.getItem('array', function(value) {
                    expect(value.length).to.be(arrayToSave.length);
                    expect(value instanceof Array).to.be(true);
                    expect(typeof value[1]).to.be('string');
                    done();
                });
            });
        });
        it('saves an array [promise]', function(done) {
            localforage.setItem('array', arrayToSave).then(function(setValue) {
                expect(setValue.length).to.be(arrayToSave.length);
                expect(setValue instanceof Array).to.be(true);

                return localforage.getItem('array');
            }).then(function(value) {
                expect(value.length).to.be(arrayToSave.length);
                expect(value instanceof Array).to.be(true);
                expect(typeof value[1]).to.be('string');
                done();
            });
        });

        var objectToSave = {
            floating: 43.01,
            nested: {
                array: [1, 2, 3]
            },
            string: 'bar'
        };
        it('saves a nested object [callback]', function(done) {
            localforage.setItem('obj', objectToSave, function(setValue) {
                expect(Object.keys(setValue).length)
                    .to.be(Object.keys(objectToSave).length);
                expect(typeof setValue).to.be('object');

                localforage.getItem('obj', function(value) {
                    expect(Object.keys(value).length)
                        .to.be(Object.keys(objectToSave).length);
                    expect(typeof value).to.be('object');
                    expect(typeof value.nested).to.be('object');
                    done();
                });
            });
        });
        it('saves a nested object [promise]', function(done) {
            localforage.setItem('obj', objectToSave).then(function(setValue) {
                expect(Object.keys(setValue).length)
                    .to.be(Object.keys(objectToSave).length);
                expect(typeof setValue).to.be('object');

                return localforage.getItem('obj');
            }).then(function(value) {
                expect(Object.keys(value).length)
                    .to.be(Object.keys(objectToSave).length);
                expect(typeof value).to.be('object');
                expect(typeof value.nested).to.be('object');
                done();
            });
        });
    });
});
