/*global casper*/
/*jshint strict:false, maxstatements:99*/

casper.test.begin('HTTP authentication tests', 8, function(test) {
    casper.start('tests/site/index.html');

    casper.configureHttpAuth('http://localhost/');
    test.assertEquals(casper.page.settings.userName, undefined);
    test.assertEquals(casper.page.settings.password, undefined);

    casper.configureHttpAuth('http://niko:plop@localhost/');
    test.assertEquals(casper.page.settings.userName, 'niko');
    test.assertEquals(casper.page.settings.password, 'plop');

    casper.configureHttpAuth('http://localhost/', {username: 'john', password: 'doe'});
    test.assertEquals(casper.page.settings.userName, 'john');
    test.assertEquals(casper.page.settings.password, 'doe');

    casper.configureHttpAuth('http://niko:plop@localhost/', {username: 'john', password: 'doe'});
    test.assertEquals(casper.page.settings.userName, 'niko');
    test.assertEquals(casper.page.settings.password, 'plop');

    casper.run(function() {
        test.done();
    });
});
