/*jshint strict:false*/
/*global CasperError, casper, console, phantom, require*/
var utils = require('utils');

casper.test.begin('sendKeys() tests', 4, function(test) {
    casper.start('tests/site/form.html', function() {
        this.sendKeys('input[name="email"]', 'duke@nuk.em');
        this.sendKeys('input[name="language"]', 'fr', {keepFocus: true});
        this.click('#autocomplete li:first-child');
        this.sendKeys('textarea', "Damn, I’m looking good.");
        var values = this.getFormValues('form[action="result.html"]');
        test.assertEquals(values.email, 'duke@nuk.em',
            'Casper.sendKeys() sends keys to given input');
        test.assertEquals(values.language, 'french',
            'Casper.sendKeys() sends keys to given input and keeps focus afterweards');
        test.assertEquals(values.content, "Damn, I’m looking good.",
            'Casper.sendKeys() sends keys to given textarea');

        this.sendKeys('input[name="notype"]', "I have no type.");
        values = this.getFormValues('form#no-type-test-form');
        test.assertEquals(values.notype, "I have no type.",
            'Casper.sendKeys() sends keys to given input without type attribute');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('sendKeys() works on content-editable elements', function(test) {
    casper.start('tests/site/elementattribute.html', function() {
        this.click('#content-editable-div');
        this.sendKeys('#content-editable-div', 'A Clockwork Orange');
    }).then(function() {
        test.assertSelectorHasText('#content-editable-div','A Clockwork Orange');
    }).run(function() {
        test.done();
    });
});

if (utils.gteVersion(phantom.version, '1.9.0')) {
    casper.test.begin('sendKeys() key modifiers tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent([
                '<input>',
                '<script>var keys = []; window.addEventListener("keypress", function(e) {',
                '   keys.push({code: e.which, alt: e.altKey, ctrl: e.ctrlKey});',
                '})</script>'
            ].join(''));
            this.sendKeys('input', 'k');
            this.sendKeys('input', 'k', {modifiers: "ctrl"});
            this.sendKeys('input', 'k', {modifiers: "ctrl+alt"});
            test.assertEquals(this.getGlobal('keys'),
                [
                    {code: 107, alt: false, ctrl: false},
                    {code: 107, alt: false, ctrl: true},
                    {code: 107, alt: true, ctrl: true}
                ], 'sendKeys() uses key modifiers');
        }).run(function() {
            test.done();
        });
    });
}

casper.test.begin('sendKeys() reset option', 1, function(test) {
    casper.start('tests/site/form.html', function() {
        this.sendKeys('textarea', 'foo');
        this.sendKeys('textarea', 'bar', {reset: true});
        var values = this.getFormValues('form[action="result.html"]');
        test.assertEquals(values.content, "bar");
    }).run(function() {
        test.done();
    });
});
