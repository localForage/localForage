/*global casper*/
/*jshint strict:false*/
casper.test.begin('urls tests', 6, function(test) {
    casper.start('tests/site/urls.html', function() {
        this.clickLabel('raw unicode', 'a');
    });

    casper.then(function() {
        test.assertHttpStatus(200);
        test.assertUrlMatches('Forlì', 'Casper.getCurrentUrl() retrieves a raw unicode URL');
        this.clickLabel('escaped', 'a');
    });

    casper.then(function() {
        test.assertHttpStatus(200);
        test.assertUrlMatches('Forlì', 'Casper.getCurrentUrl() retrieves an escaped URL');
        this.clickLabel('uri encoded', 'a');
    });

    casper.run(function() {
        test.assertHttpStatus(200);
        test.assertUrlMatches('Forlì', 'Casper.getCurrentUrl() retrieves a decoded URL');
        test.done();
    });
});
