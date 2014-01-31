/*global casper*/
/*jshint strict:false, maxstatements:99*/
var fs = require('fs');

casper.test.begin('Common assertions tests', 46, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assertTextExists('form', 'Tester.assertTextExists() checks that page body contains text');
        test.assertTextExist('form', 'Tester.assertTextExist() checks that page body contains text [alias]');
        test.assertTextDoesntExist('blah', "Tester.assertTextDoesntExist() checks that page body doesn't contain provided text");
        test.assertSelectorHasText('h1', 'Title', 'Tester.assertSelectorHasText() works as expected');
        test.assertSelectorDoesntHaveText('h1', 'Subtitle', 'Tester.assertSelectorDoesntHaveText() works as expected');
        test.assert(true, 'Tester.assert() works as expected');
        test.assertTrue(true, 'Tester.assertTrue() works as expected [alias]');
        test.assertTruthy('1', 'Tester.assertTruthy() works as expected');
        test.assertFalsy('', 'Tester.assertFalsy() works as expected');
        test.assertNot(false, 'Tester.assertNot() works as expected');
        test.assertEquals(true, true, 'Tester.assertEquals() works as expected');
        test.assertEqual(true, true, 'Tester.assertEqual() works as expected [alias]');
        test.assertNotEquals(true, false, 'Tester.assertNotEquals() works as expected');
        test.assertEval(function() {
            return true;
        }, 'Tester.assertEval() works as expected');
        test.assertEvaluate(function() {
            return true;
        }, 'Tester.assertEvaluate() works as expected [alias]');
        test.assertEvalEquals(function() {
            return 42;
        }, 42, 'Tester.assertEvalEquals() works as expected');
        test.assertEvalEqual(function() {
            return 42;
        }, 42, 'Tester.assertEvalEqual() works as expected [alias]');
        test.assertElementCount('ul', 1, 'Tester.assertElementCount() works as expected');
        test.assertElementCount('li', 3, 'Tester.assertElementCount() works as expected');
        test.assertElementCount('address', 0, 'Tester.assertElementCount() works as expected');
        test.assertExists('body', 'Tester.assertExists() works as expected');
        test.assertExist('body', 'Tester.assertExist() works as expected [alias]');
        test.assertFail(function() {
            test.assert(false);
        }, 'Tester.assertFail() tests for a failing assertion');
        test.assertSelectorExists('body', 'Tester.assertSelectorExists() works as expected [alias]');
        test.assertSelectorExist('body', 'Tester.assertSelectorExist() works as expected [alias]');
        test.assertDoesntExist('foobar', 'Tester.assertDoesntExist() works as expected');
        test.assertDoesntExist('foobar', 'Tester.assertNotExist() works as expected [alias]');
        // using file:// protocol, HTTP status is always null
        test.assertHttpStatus(200, 'Tester.assertHttpStatus() works as expected');
        test.assertMatch("the lazy dog", /lazy/, 'Tester.assertMatch() works as expected');
        test.assertMatches("the lazy dog", /lazy/, 'Tester.assertMatches() works as expected [alias]');
        test.assertRaises(function() {
            throw new Error('plop');
        }, [], 'Tester.assertRaises() works as expected');
        test.assertRaise(function() {
            throw new Error('plop');
        }, [], 'Tester.assertRaise() works as expected [alias]');
        test.assertThrows(function() {
            throw new Error('plop');
        }, [], 'Tester.assertThrows() works as expected [alias]');
        test.assertResourceExists(/index\.html/, 'Tester.assertResourceExists() works as expected');
        test.assertResourceExist(/index\.html/, 'Tester.assertResourceExist() works as expected [alias]');
        test.assertTitle('CasperJS test index', 'Tester.assertTitle() works as expected');
        test.assertTitleMatch(/test index/, 'Tester.assertTitleMatch() works as expected');
        test.assertTitleMatches(/test index/, 'Tester.assertTitleMatches() works as expected [alias]');
        test.assertType("plop", "string", "Tester.assertType() works as expected");
        test.assertInstanceOf("plop", String, "Tester.assertInstanceOf() works as expected");
        test.assertUrlMatch(/index\.html$/, "Tester.assertUrlMatch() works as expected");
        test.assertUrlMatches(/index\.html$/, "Tester.assertUrlMatches() works as expected [alias]");
        test.assertVisible('img', 'Tester.assertVisible() works as expected');
        test.assertNotVisible('p#hidden', 'Tester.assertNotVisible() works as expected');
        test.assertInvisible('p#hidden', 'Tester.assertInvisible() works as expected [alias]');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): filled inputs', 7, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email':       '',
            'content':     '',
            'check':       false,
            'choice':      '',
            'topic':       '',
            'file':        '',
            'checklist[]': []
        });
        test.assertField('email', '', 'Tester.assertField() works as expected with inputs');
        test.assertField('content', '', 'Tester.assertField() works as expected with textarea');
        test.assertField('check', false, 'Tester.assertField() works as expected with checkboxes');
        test.assertField('choice', null, 'Tester.assertField() works as expected with radios');
        test.assertField('topic', 'foo', 'Tester.assertField() works as expected with selects');
        test.assertField('file', '', 'Tester.assertField() works as expected with file inputs');
        test.assertField('checklist[]', [], 'Tester.assertField() works as expected with check lists');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): unfilled inputs', 7, function(test) {
    var fpath = fs.pathJoin(phantom.casperPath, 'README.md');
    var fileValue = 'README.md';
    if (phantom.casperEngine === 'phantomjs') {
        fileValue = 'C:\\fakepath\\README.md'; // phantomjs/webkit sets that;
    }

    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email':       'chuck@norris.com',
            'content':     'Am watching thou',
            'check':       true,
            'choice':      'no',
            'topic':       'bar',
            'file':        fpath,
            'checklist[]': ['1', '3']
        });
        test.assertField('email', 'chuck@norris.com', 'Tester.assertField() works as expected with inputs');
        test.assertField('content', 'Am watching thou', 'Tester.assertField() works as expected with textarea');
        test.assertField('check', true, 'Tester.assertField() works as expected with checkboxes');
        test.assertField('choice', 'no', 'Tester.assertField() works as expected with radios');
        test.assertField('topic', 'bar', 'Tester.assertField() works as expected with selects');
        test.assertField('file', fileValue,
            'Tester.assertField() works as expected with file inputs');
        test.assertField('checklist[]', ['1', '3'], 'Tester.assertField() works as expected with check lists');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): nonexistent fields', 2, function(test) {
    casper.start('tests/site/form.html', function() {
        test.assertFail(function() {
            test.assertField('nonexistent', '');
        }, 'Tester.assertField() only checks for existing fields');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): CSS selectors', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email': 'albert@camus.com'
        });

        test.assertField({
            type: 'css',
            path: '#email'
        },
            'albert@camus.com',
            'Tester.assertField() works as expected with CSS selectors'
        );
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): XPath selectors', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email': 'albert@camus.com'
        });

        test.assertField({
            type: 'xpath',
            path: '/html/body/form[1]/input[1]'
        },
             'albert@camus.com',
             'Tester.assertField() works as expected with XPath selectors'
        );
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertField(): invalid selectors', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email': 'albert@camus.com'
        });

        test.assertRaise(function() {
            test.assertField({
                type: 'albert'
            },
                 'albert@camus.com',
                 'Tester.assertField() works as expected with XPath selectors'
            );
        }, [], 'should throw an error for an invalid selector');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertFieldCSS(): CSS selectors', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email': 'albert@camus.com'
        });

        test.assertFieldCSS(
            '#email',
            'albert@camus.com',
            'Tester.assertFieldCSS() works as expected with CSS selectors'
        );
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Tester.assertFieldXPath(): XPath selectors', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            'email': 'albert@camus.com'
        });

        test.assertFieldXPath(
             '/html/body/form[1]/input[1]',
             'albert@camus.com',
             'Tester.assertFieldXPath() works as expected with XPath selectors'
        );
    }).run(function() {
        test.done();
    });
});
