/*global casper*/
/*jshint strict:false*/

var setUp, tearDown;

casper.test.setUp(function(done) {
    setTimeout(function() {
        setUp = true;
        done();
    }, 50);
});

casper.test.tearDown(function(done) {
    setTimeout(function() {
        tearDown = true;
        done();
        // reset
        casper.test.setUp();
        casper.test.tearDown();
    }, 50);
});

casper.test.begin('setUp() tests', 1, function(test) {
    test.assertTrue(setUp, 'Tester.setUp() executed the async setup function');
    test.done();
});

casper.test.begin('tearDown() tests', 1, function(test) {
    test.assertTrue(tearDown, 'Tester.tearDown() executed the async tear down function');
    test.done();
});
