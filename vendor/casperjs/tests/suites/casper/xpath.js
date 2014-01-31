/*global casper, __utils__*/
/*jshint strict:false*/
var x = require('casper').selectXPath;

casper.test.begin('XPath tests', 6, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assertExists({
            type: 'xpath',
            path: '/html/body/ul/li[2]'
        }, 'XPath selector can find an element');
        test.assertDoesntExist({
            type: 'xpath',
            path: '/html/body/ol/li[2]'
        }, 'XPath selector does not retrieve a nonexistent element');
        test.assertExists(x('/html/body/ul/li[2]'), 'selectXPath() shortcut can find an element as well');
        test.assertEvalEquals(function() {
            return __utils__.findAll({type: 'xpath', path: '/html/body/ul/li'}).length;
        }, 3, 'Correct number of elements are found');
    });

    casper.thenClick(x('/html/body/a[2]'), function() {
        test.assertTitle('CasperJS test form', 'Clicking XPath works as expected');
        this.fill(x('/html/body/form'), {
            email: 'chuck@norris.com'
        });
        test.assertEvalEquals(function() {
            return document.querySelector('input[name="email"]').value;
        }, 'chuck@norris.com', 'Casper.fill() can fill an input[type=text] form field');
    });

    casper.run(function() {
        test.done();
    });
});
