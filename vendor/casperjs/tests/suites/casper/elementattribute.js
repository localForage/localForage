/*global casper*/
/*jshint strict:false*/
var x = require('casper').selectXPath;

casper.test.begin('getElementAttribute() tests', 4, function(test) {
    casper.start('tests/site/elementattribute.html', function() {
        test.assertEquals(this.getElementAttribute('.testo', 'data-stuff'),
            'beautiful string', 'Casper.getElementAttribute() works with a CSS selector');
        test.assertEquals(this.getElementAttribute(x('//div[@class]'), 'data-stuff'),
            'beautiful string', 'Casper.getElementAttribute() works with a XPath selector');
    }).then(function() {
        test.assertEquals(this.getElementsAttribute('.testo', 'data-stuff'),
            ['beautiful string', 'not as beautiful string'],
            'Casper.getElementsAttribute() works with a CSS selector');
        test.assertEquals(this.getElementsAttribute(x('//div[@class]'), 'data-stuff'),
            ['beautiful string', 'not as beautiful string'],
            'Casper.getElementsAttribute() works with a XPath selector');
    }).run(function() {
        test.done();
    });
});
