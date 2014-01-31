/*global casper*/
/*jshint strict:false*/

var setUp, tearDown;

casper.test.setUp(function() {
    setUp = true;
});

casper.test.tearDown(function() {
    tearDown = true;
    // reset
    casper.test.setUp();
    casper.test.tearDown();
});

casper.test.begin('setUp() tests', 1, function(test) {
    test.assertTrue(setUp, 'Tester.setUp() executed the setup function');
    test.done();
});

casper.test.begin('tearDown() tests', 1, function(test) {
    test.assertTrue(tearDown, 'Tester.tearDown() executed the tear down function');
    test.done();
});
