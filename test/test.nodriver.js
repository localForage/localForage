/* global before:true, describe:true, expect:true, it:true */
describe('When No Drivers Are Available', function() {
    'use strict';

    before(function(done) {
        try {
            window.indexedDB.open = null;
        } catch (error) {
        }
        try {
            window.localStorage.setItem = null;
        } catch (error) {
        }
        try {
            window.openDatabase = null;
        } catch (error) {
        }

        done();
    });

    // Test to make sure localStorage isn't used when it isn't available.
    // it("can't use unsupported localStorage [callback]", function(done) {
    //     var _oldLS = window.localStorage;
    //     window.localStorage = null;
    //
    //     localforage.setDriver(localforage.LOCALSTORAGE, null, function() {
    //         expect(localforage.driver()).to.be(previousDriver);
    //         done();
    //     });
    // });
    it.skip('fails to load localForage [promise]', function(done) {
        localforage.ready(null, function(error) {
            expect(error).to.be('No available storage method found.');
            done();
        });
        // localforage.setDriver(localforage.LOCALSTORAGE).then(null,
        //                                                      function(error) {
        //     expect(error).to.be('No available storage method found.');
        //     window.localStorage = _oldLS;
        //     done();
        // });
    });
});
