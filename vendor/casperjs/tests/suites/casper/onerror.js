/*global casper*/
/*jshint strict:false*/
casper.test.begin('page.error event tests', 2, function(test) {
    var error = {};
    var expectedMessage;
    if (phantom.casperEngine === 'phantomjs') {
        expectedMessage = "ReferenceError: Can't find variable: plop";
    }
    else {
        expectedMessage = "ReferenceError: plop is not defined";
    }
    casper.once("page.error", function onError(msg, trace) {
        error.msg = msg;
        error.trace = trace;
    });
    casper.start('tests/site/error.html', function() {
        test.assertEquals(error.msg, expectedMessage,
            "page.error event has been caught OK");
        test.assertMatch(error.trace[0].file, /error.html/,
            "page.error retrieves correct stack trace");
    });
    casper.run(function() {
        test.done();
    });
});
