/*jshint strict:false*/
/*global CasperError, casper, console, phantom, require*/

var TestCaseResult = require('tester').TestCaseResult,
    TestSuiteResult = require('tester').TestSuiteResult;

function generateCaseResult(options) {
    var i,
        nPasses = options && ~~options.nPasses,
        nFailures = options && ~~options.nFailures,
        caseResult = new TestCaseResult(options);
    for (i = 0; i < nFailures; i++) {
        caseResult.addFailure({}, i * 1000);
    }
    for (i = 0; i < nPasses; i++) {
        caseResult.addSuccess({}, i * 1000);
    }
    return caseResult;
}

casper.test.begin('TestSuiteResult() basic tests', 8, function(test) {
    var suiteResult = new TestSuiteResult();
    test.assertEquals(suiteResult.constructor.name, 'Array', 'TestSuiteResult() is derived from Array');
    test.assertEquals(suiteResult.countTotal(), 0);
    test.assertEquals(suiteResult.countFailed(), 0);
    test.assertEquals(suiteResult.countPassed(), 0);
    test.assertEquals(suiteResult.getAllFailures(), []);
    test.assertEquals(suiteResult.getAllPasses(), []);
    test.assertEquals(suiteResult.getAllResults(), []);
    test.assertEquals(suiteResult.calculateDuration(), 0);
    test.done();
});

casper.test.begin('TestSuiteResult() accumulation tests', 7, function(test) {
    var suiteResult = new TestSuiteResult();
    suiteResult.push(generateCaseResult({
        name: 'foo',
        file: '/tmp/foo',
        nPasses: 4,
        nFailures: 1
    }));
    suiteResult.push(generateCaseResult({
        name: 'bar',
        file: '/tmp/bar',
        nPasses: 3,
        nFailures: 0
    }));
    test.assertEquals(suiteResult.countTotal(), 8);
    test.assertEquals(suiteResult.countFailed(), 1);
    test.assertEquals(suiteResult.countPassed(), 7);
    test.assertEquals(suiteResult.getAllFailures().length, 1);
    test.assertEquals(suiteResult.getAllPasses().length, 7);
    test.assertEquals(suiteResult.getAllResults().length, 8);
    test.assertEquals(suiteResult.calculateDuration(), 9000);
    test.done();
});
