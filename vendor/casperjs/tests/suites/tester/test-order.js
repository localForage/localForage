/*jshint strict:false*/
/*global CasperError, casper, console, phantom, require*/
var fs = require('fs');

casper.test.begin('Tester.sortFiles()', 1, function suite(test) {
    var testDirRoot = fs.pathJoin(phantom.casperPath, 'tests', 'testdir');
    var files = test.findTestFiles(testDirRoot);
    var expected = [
        "01_a/abc.js",
        "01_a/def.js",
        "02_b/abc.js",
        "03_a.js",
        "03_b.js",
        "04/01_init.js",
        "04/02_do.js"
    ].map(function(entry) {
        return fs.pathJoin.apply(fs, [testDirRoot].concat(entry.split('/')));
    });
    test.assertEquals(files, expected, 'findTestFiles() find test files and sort them');
    test.done();
});
