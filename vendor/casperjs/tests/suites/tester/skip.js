/*global casper*/
/*jshint strict:false*/
casper.test.begin('Skip tests', 4, function(test) {
    test.assert(true, 'First test executed');
    test.assert(true, 'Second test executed');
    test.skip(2, 'Two tests skipped');
    test.done();
});

casper.test.begin('Skip tests after', 4, function(test) {
    test.skip(2, 'Two tests skipped');
    test.assert(true, 'Third test executed');
    test.assert(true, 'Fourth test executed');
    test.done();
});

casper.test.begin('Skip tests (asynchronous)', 1, function(test) {
    casper.start('tests/site/index.html', function() {
        test.skip(1);
    }).run(function() {
        test.done();
    });
});
