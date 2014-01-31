/*jshint strict:false, maxstatements:99, maxcomplexity:99*/
/*global CasperError, casper, console, phantom, require*/

var TestCaseResult = require('tester').TestCaseResult;

casper.test.begin('TestCaseResult.constructor() tests', 4, function(test) {
    var caseResult1 = new TestCaseResult();
    test.assertType(caseResult1.name, "undefined", 'TestCaseResult.constructor() name is undefined by default');
    test.assertType(caseResult1.file, "undefined", 'TestCaseResult.constructor() file is undefined by default');
    var caseResult2 = new TestCaseResult({name: 'foo', file: '/tmp/foo'});
    test.assertEquals(caseResult2.name, "foo", 'TestCaseResult.constructor() can set name');
    test.assertEquals(caseResult2.file, "/tmp/foo", 'TestCaseResult.constructor() can set file');
    test.done();
});

casper.test.begin('TestCaseResult.addSuccess() and TestCaseResult.addFailure() tests', 22, function(test) {
    var caseResult = new TestCaseResult({name: 'foo', file: '/tmp/foo'});
    test.assertEquals(caseResult.assertions, 0, 'test case result counts no assertion by default');
    test.assertEquals(caseResult.passed, 0, 'test case result counts no success by default');
    test.assertEquals(caseResult.failed, 0, 'test case result counts no failure by default');
    test.assertEquals(caseResult.calculateDuration(), 0,
        'TestCaseResult.calculateDuration() computes initial tests duration');
    var success = {};
    caseResult.addSuccess(success, 1337);
    test.assertEquals(caseResult.assertions, 1, 'test case result counts one assertion');
    test.assertEquals(caseResult.passed, 1, 'test case result counts one success');
    test.assertEquals(caseResult.failed, 0, 'test case result counts no failure');
    test.assertEquals(caseResult.passes[0], success, 'TestCaseResult.addSuccess() added a success to the stack');
    test.assertEquals(caseResult.passes[0].time, 1337, 'TestCaseResult.addSuccess() added test duration');
    test.assertEquals(caseResult.passes[0].suite, 'foo', 'TestCaseResult.addSuccess() added suite name');
    test.assertEquals(caseResult.calculateDuration(), 1337,
        'TestCaseResult.calculateDuration() computes tests duration');
    var failure = {};
    caseResult.addFailure(failure, 42);
    test.assertEquals(caseResult.assertions, 2, 'test case result counts two assertions');
    test.assertEquals(caseResult.passed, 1, 'test case result counts one success');
    test.assertEquals(caseResult.failed, 1, 'test case result counts no failure');
    test.assertEquals(caseResult.failures[0], failure, 'TestCaseResult.addFailure() added a failure to the stack');
    test.assertEquals(caseResult.failures[0].time, 42, 'TestCaseResult.addFailure() added test duration');
    test.assertEquals(caseResult.failures[0].suite, 'foo', 'TestCaseResult.addFailure() added suite name');
    test.assertEquals(caseResult.calculateDuration(), 1337 + 42,
        'TestCaseResult.calculateDuration() computes new tests duration');
    caseResult.addSuccess({}, 1000);
    test.assertEquals(caseResult.assertions, 3, 'test case result counts three assertions');
    test.assertEquals(caseResult.passed, 2, 'test case result counts two successes');
    test.assertEquals(caseResult.failed, 1, 'test case result counts one failure');
    test.assertEquals(caseResult.calculateDuration(), 1337 + 42 + 1000,
        'TestCaseResult.calculateDuration() computes new tests duration');
    test.done();
});
