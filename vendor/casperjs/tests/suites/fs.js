/*global casper*/
/*jshint strict:false*/
var fs = require('fs');

casper.test.begin('fs.dirname() tests', 8, function(test) {
    var tests = {
        '/local/plop/foo.js':      '/local/plop',
        'local/plop/foo.js':       'local/plop',
        './local/plop/foo.js':     './local/plop',
        'c:\\local\\plop\\foo.js': 'c:/local/plop',
        'D:\\local\\plop\\foo.js': 'D:/local/plop',
        'D:\\local\\plop\\':       'D:/local/plop',
        'c:\\':                    'c:',
        'c:':                      'c:'
    };
    for (var testCase in tests) {
        test.assertEquals(fs.dirname(testCase), tests[testCase], 'fs.dirname() does its job for ' + testCase);
    }
    test.done();
});

casper.test.begin('fs.isWindows() tests', 6, function(test) {
    var tests = {
        '/':                       false,
        '/local/plop/foo.js':      false,
        'D:\\local\\plop\\':       true,
        'c:\\':                    true,
        'c:':                      true,
        '\\\\Server\\Plop':        true
    };
    for (var testCase in tests) {
        test.assertEquals(fs.isWindows(testCase), tests[testCase], 'fs.isWindows() does its job for ' + testCase);
    }
    test.done();
});
