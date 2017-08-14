/* global beforeEach:true */
this.mocha.setup('bdd');

beforeEach(function() {
    var previousDriver = localforage.driver();

    function rerequirelocalforage() {
        // The API method stubs inserted by callWhenReady must be tested before
        // they are replaced by the driver, which happens as soon as it loads.
        //
        // To ensure that they work when the drivers are loaded asynchronously,
        // we run the entire test suite (except for config tests), but undefine
        // the localforage module and force it to reload before each test, so that
        // it will be initialized again.
        //
        // This ensures that the synchronous parts of localforage initialization
        // and the API calls in the tests occur first in every test, such that the
        // callWhenReady API method stubs are called before RequireJS
        // asynchronously loads the drivers that replace them.
        return new Promise(function(resolve) {
            require.undef('localforage');
            require(['localforage'], function(localforage) {
                return localforage.setDriver(previousDriver)
                .catch(function() { })
                .then(function() {
                    window.localforage = localforage;
                })
                .then(resolve);
            });
        });
    }

    return localforage.ready()
    .then(function() {
        previousDriver = localforage.driver();
    })
    .catch(function() { })
    .then(rerequirelocalforage);
});
