/*global casper, __utils__*/
/*jshint strict:false*/
var fs = require('fs');

function testFormValues(test) {
    test.assertField('email', 'chuck@norris.com',
        'can fill an input[type=text] form field');
    test.assertField('password', 'chuck',
        'can fill an input[type=password] form field')
    test.assertField('content', 'Am watching thou',
        'can fill a textarea form field');
    test.assertField('topic', 'bar',
        'can pick a value from a select form field');
    test.assertField('check', true,
        'can check a form checkbox');
    test.assertEvalEquals(function() {
        return __utils__.findOne('input[name="choice"][value="no"]').checked;
    }, true, 'can check a form radio button 1/2');
    test.assertEvalEquals(function() {
        return __utils__.findOne('input[name="choice"][value="yes"]').checked;
    }, false, 'can check a form radio button 2/2');
    test.assertEvalEquals(function() {
        return (__utils__.findOne('input[name="checklist[]"][value="1"]').checked &&
               !__utils__.findOne('input[name="checklist[]"][value="2"]').checked &&
                __utils__.findOne('input[name="checklist[]"][value="3"]').checked);
    }, true, 'can fill a list of checkboxes');
}

function testUrl(test) {
    test.assertUrlMatch(/email=chuck@norris.com/, 'input[type=email] field was submitted');
    test.assertUrlMatch(/password=chuck/, 'input[type=password] field was submitted');
    test.assertUrlMatch(/content=Am\+watching\+thou/, 'textarea field was submitted');
    test.assertUrlMatch(/check=on/, 'input[type=checkbox] field was submitted');
    test.assertUrlMatch(/choice=no/, 'input[type=radio] field was submitted');
    test.assertUrlMatch(/topic=bar/, 'select field was submitted');
    test.assertUrlMatch(/strange=very/, 'strangely typed input field was submitted');
}

casper.test.begin('fill() & fillNames() tests', 16, function(test) {
    var fpath = fs.pathJoin(phantom.casperPath, 'README.md');

    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            email:         'chuck@norris.com',
            password:      'chuck',
            content:       'Am watching thou',
            check:         true,
            choice:        'no',
            topic:         'bar',
            file:          fpath,
            'checklist[]': ['1', '3'],
            strange:       "very"
        });
        testFormValues(test);
        test.assertEvalEquals(function() {
            return __utils__.findOne('input[name="file"]').files.length === 1;
        }, true, 'can select a file to upload');
    });
    casper.thenClick('input[type="submit"]', function() {
        testUrl(test);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('fillSelectors() tests', 16, function(test) {
    var fpath = fs.pathJoin(phantom.casperPath, 'README.md');

    casper.start('tests/site/form.html', function() {
        this.fillSelectors('form[action="result.html"]', {
            "input[name='email']":        'chuck@norris.com',
            "input[name='password']":     'chuck',
            "textarea[name='content']":   'Am watching thou',
            "input[name='check']":        true,
            "input[name='choice']":       'no',
            "select[name='topic']":       'bar',
            "input[name='file']":         fpath,
            "input[name='checklist[]']":  ['1', '3'],
            "input[name='strange']":      "very"
        });
        testFormValues(test);
        test.assertEvalEquals(function() {
            return __utils__.findOne('input[name="file"]').files.length === 1;
        }, true, 'can select a file to upload');
    });
    casper.thenClick('input[type="submit"]', function() {
        testUrl(test);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('fillXPath() tests', 15, function(test) {
    casper.start('tests/site/form.html', function() {
        this.fillXPath('form[action="result.html"]', {
            '//input[@name="email"]':       'chuck@norris.com',
            '//input[@name="password"]':    'chuck',
            '//textarea[@name="content"]':  'Am watching thou',
            '//input[@name="check"]':       true,
            '//input[@name="choice"]':      'no',
            '//select[@name="topic"]':      'bar',
            '//input[@name="checklist[]"]': ['1', '3'],
            '//input[@name="strange"]':     "very"
        });
        testFormValues(test);
        // note: file inputs cannot be filled using XPath
    });
    casper.thenClick('input[type="submit"]', function() {
        testUrl(test);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('nonexistent fields', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        test.assertRaises(this.fill, ['form[action="result.html"]', {
            nonexistent: 42
        }, true], 'Casper.fill() raises an exception when unable to fill a form');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('multiple forms', 2, function(test) {
    casper.start('tests/site/multiple-forms.html', function() {
        this.fill('form[name="f2"]', {
            yo: "ok"
        }, true);
    }).then(function() {
        test.assertUrlMatch(/\?f=f2&yo=ok$/, 'Casper.fill() handles multiple forms');
    }).then(function() {
        this.fill('form[name="f2"]', {
            yo: "ok"
        });
        test.assertEquals(this.getFormValues('form[name="f2"]'), {
            f: "f2",
            yo: "ok"
        }, 'Casper.getFormValues() retrieves filled values when multiple forms have same field names');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('field array', 1, function(test) {
    // issue #267: array syntax field names
    casper.start('tests/site/field-array.html', function() {
        this.fill('form', {
            'foo[bar]': "bar",
            'foo[baz]': "baz"
        }, true);
    }).then(function() {
        test.assertUrlMatch('?foo[bar]=bar&foo[baz]=baz',
            'Casper.fill() handles array syntax field names');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('getFormValues() tests', 2, function(test) {
    var fpath = fs.pathJoin(phantom.casperPath, 'README.md');
    var fileValue = 'README.md';
    if (phantom.casperEngine === 'phantomjs') {
        fileValue = 'C:\\fakepath\\README.md'; // phantomjs/webkit sets that;
    }

    casper.start('tests/site/form.html', function() {
        this.fill('form[action="result.html"]', {
            email:         'chuck@norris.com',
            password:      'chuck',
            language:      'english',
            content:       'Am watching thou',
            check:         true,
            choice:        'no',
            topic:         'bar',
            file:          fpath,
            'checklist[]': ['1', '3'],
            strange:       "very"
        });
    });
    casper.then(function() {
        test.assertEquals(this.getFormValues('form'), {
            "check": true,
            "checklist[]": ["1", "3"],
            "choice": "no",
            "content": "Am watching thou",
            "email": "chuck@norris.com",
            "file": fileValue,
            "password": "chuck",
            "submit": "submit",
            "language": "english",
            "topic": "bar",
            "strange": "very"
        }, 'Casper.getFormValues() retrieves filled values');
    });
    casper.then(function() {
        this.fill('form[action="result.html"]', {
            email:         'chuck@norris.com',
            password:      'chuck',
            language:      'english',
            content:       'Am watching thou',
            check:         true,
            choice:        'yes',
            topic:         'bar',
            file:          fpath,
            'checklist[]': ['1', '3'],
            strange:       "very"
        });
    });
    casper.then(function() {
        test.assertEquals(this.getFormValues('form'), {
            "check": true,
            "checklist[]": ["1", "3"],
            "choice": "yes",
            "content": "Am watching thou",
            "email": "chuck@norris.com",
            "file": fileValue,
            "password": "chuck",
            "language": "english",
            "submit": "submit",
            "topic": "bar",
            "strange": "very"
        }, 'Casper.getFormValues() correctly retrieves values from radio inputs regardless of order');
    });
    casper.run(function() {
        test.done();
    });
});
