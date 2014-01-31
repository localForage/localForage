/*global casper*/
/*jshint strict:false*/
var fs = require('fs');

casper.test.begin('Casper.capture() tests', 1, {
    testFile: '/tmp/__casper_test_capture.png',

    setUp: function(test) {
        if (fs.exists(this.testFile) && fs.isFile(this.testFile)) {
            try {
                fs.remove(this.testFile);
            } catch (e) {
            }
        }
    },

    tearDown: function(test) {
        try {
            fs.remove(this.testFile);
        } catch(e) {
        }
    },

    test: function(test) {
        var self = this;

        casper.start('tests/site/index.html', function() {
            this.viewport(300, 200);
            this.capture(self.testFile);
            test.assert(fs.isFile(self.testFile), 'Casper.capture() captured a screenshot');
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('Casper.captureBase64() tests', 3, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assert(this.captureBase64('png').length > 0,
            'Casper.captureBase64() rendered a page capture as base64');
        test.assert(this.captureBase64('png', 'ul').length > 0,
            'Casper.captureBase64() rendered a capture from a selector as base64');
        test.assert(this.captureBase64('png', {top: 0, left: 0, width: 30, height: 30}).length > 0,
            'Casper.captureBase64() rendered a capture from a clipRect as base64');
    }).run(function() {
        test.done();
    });
});
