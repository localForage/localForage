/*global casper*/
/*jshint strict:false*/
casper.test.begin('start() tests', 4, function(test) {
    casper.start('tests/site/index.html', function() {
        test.pass('Casper.start() can chain a next step');
        test.assertTitle('CasperJS test index', 'Casper.start() opened the passed url');
        test.assertEval(function() {
            return typeof(__utils__) === "object";
        }, 'Casper.start() injects ClientUtils instance within remote DOM');
    });

    test.assert(casper.started, 'Casper.start() started');

    casper.run(function() {
        test.done();
    });
});
