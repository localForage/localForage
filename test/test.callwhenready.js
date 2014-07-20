/* global beforeEach:true */
var mocha = this.mocha;

mocha.setup('bdd');

beforeEach(function(done) {
    var previousDriver = localforage.driver();

    // Undefine localforage module to force reload, which will cause the
    // API calls in tests to be called before the drivers are asynchronously
    // loaded again, thus testing the API method stubs which delay the actual
    // driver API calls till ready().
    require.undef('/dist/localforage.js');
    require(['/dist/localforage.js'], function(localforage) {
        localforage.setDriver(previousDriver);
        window.localforage = localforage;
        done();
    });
});
