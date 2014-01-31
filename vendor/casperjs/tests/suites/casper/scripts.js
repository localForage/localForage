/*global casper*/
/*jshint strict:false*/
casper.test.begin('remote script includes tests', 4, {
    setUp: function() {
        casper.options.remoteScripts = [
            'includes/include1.js', // local includes are actually served
            'includes/include2.js'  // through the local test webserver
        ];
    },

    tearDown: function() {
        casper.options.remoteScripts = [];
    },

    test: function(test) {
        casper.start('tests/site/index.html', function() {
            test.assertSelectorHasText('#include1', 'include1',
                'Casper.includeRemoteScripts() includes a first remote script on start');
            test.assertSelectorHasText('#include2', 'include2',
                'Casper.includeRemoteScripts() includes a second remote script on start');
        });

        casper.thenOpen('tests/site/form.html', function() {
            test.assertSelectorHasText('#include1', 'include1',
                'Casper.includeRemoteScripts() includes a first remote script on second step');
            test.assertSelectorHasText('#include2', 'include2',
                'Casper.includeRemoteScripts() includes a second remote script on second step');
        });

        casper.run(function() {
            test.done();
        });
    }
});
