/*global casper, __utils__*/
/*jshint strict:false*/
var tester = require('tester');
var testpage = require('webpage').create();

casper.test.begin('XUnitReporter() initialization', 1, function suite(test) {
    var xunit = require('xunit').create();
    var results = new tester.TestSuiteResult();
    xunit.setResults(results);
    test.assertTruthy(xunit.getXML());
    test.done();
});

casper.test.begin('XUnitReporter() can hold test suites', 4, function suite(test) {
    var xunit = require('xunit').create();
    var results = new tester.TestSuiteResult();
    var suite1 = new tester.TestCaseResult({
        name: 'foo',
        file: '/foo'
    });
    results.push(suite1);
    var suite2 = new tester.TestCaseResult({
        name: 'bar',
        file: '/bar'
    });
    results.push(suite2);
    xunit.setResults(results);
    casper.start().setContent(xunit.getXML());
    test.assertEvalEquals(function() {
        return __utils__.findAll('testsuite').length;
    }, 2);
    test.assertExists('testsuites[time]');
    test.assertExists('testsuite[name="foo"][package="foo"]');
    test.assertExists('testsuite[name="bar"][package="bar"]');
    test.done();
});

casper.test.begin('XUnitReporter() can hold a suite with a succesful test', 1, function suite(test) {
    var xunit = require('xunit').create();
    var results = new tester.TestSuiteResult();
    var suite1 = new tester.TestCaseResult({
        name: 'foo',
        file: '/foo'
    });
    suite1.addSuccess({
        success: true,
        type: "footype",
        message: "footext",
        file: "/foo"
    });
    results.push(suite1);
    xunit.setResults(results);
    casper.start().setContent(xunit.getXML());
    test.assertExists('testsuite[name="foo"][package="foo"][tests="1"][failures="0"] testcase[name="footext"]');
    test.done();
});

casper.test.begin('XUnitReporter() can handle a failed test', 2, function suite(test) {
    var xunit = require('xunit').create();
    var results = new tester.TestSuiteResult();
    var suite1 = new tester.TestCaseResult({
        name: 'foo',
        file: '/foo'
    });
    suite1.addFailure({
        success: false,
        type: "footype",
        message: "footext",
        file: "/foo"
    });
    results.push(suite1);
    xunit.setResults(results);
    casper.start().setContent(xunit.getXML());
    test.assertExists('testsuite[name="foo"][package="foo"][tests="1"][failures="1"] testcase[name="footext"] failure[type="footype"]');
    test.assertEquals(casper.getElementInfo('failure[type="footype"]').text, 'footext');
    test.done();
});
