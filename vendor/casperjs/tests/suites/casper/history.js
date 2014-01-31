/*global casper*/
/*jshint strict:false*/
casper.test.begin('handling navigation history', 4, function(test) {
    casper.start('tests/site/page1.html');
    casper.thenOpen('tests/site/page2.html');
    casper.thenOpen('tests/site/page3.html');
    casper.back();
    casper.then(function() {
        test.assertMatch(this.getCurrentUrl(), /page2\.html$/,
            'Casper.back() can go back an history step');
    });
    casper.forward();
    casper.then(function() {
        test.assertMatch(this.getCurrentUrl(), /page3\.html$/,
            'Casper.forward() can go forward an history step');
    });
    casper.run(function() {
        test.assert(this.history.length > 0, 'Casper.history contains urls');
        test.assertMatch(this.history[0], /page1\.html$/,
            'Casper.history has the correct first url');
        test.done();
    });
});
