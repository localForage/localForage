/*global casper*/
/*jshint strict:false*/
var fs = require('fs');
var x = require('casper').selectXPath;

function fakeDocument(html) {
    window.document.body.innerHTML = html;
}

casper.test.begin('ClientUtils.encode() tests', 6, function(test) {
    var clientutils = require('clientutils').create(),
        testCases = {
            'an empty string': '',
            'a word':          'plop',
            'a null char':     'a\u0000',
            'an utf8 string':  'ÀÁÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ',
            'song lyrics':     ("Voilà l'été, j'aperçois le soleil\n" +
                                "Les nuages filent et le ciel s'éclaircit\n" +
                                "Et dans ma tête qui bourdonnent?\n" +
                                "Les abeilles!"),
            'a file contents': fs.read(phantom.casperPath + '/tests/site/alert.html')
        };
    for (var what in testCases) {
        test.assertEquals(
            clientutils.decode(clientutils.encode(testCases[what])),
            testCases[what],
            'ClientUtils.encode() encodes and decodes ' + what
        );
    }
    test.done();
});

casper.test.begin('ClientUtils.exists() tests', 5, function(test) {
    var clientutils = require('clientutils').create();
    fakeDocument('<ul class="foo"><li>bar</li><li>baz</li></ul>');
    test.assert(clientutils.exists('ul'),
        'ClientUtils.exists() checks that an element exist');
    test.assertNot(clientutils.exists('ol'),
        'ClientUtils.exists() checks that an element exist');
    test.assert(clientutils.exists('ul.foo li'),
        'ClientUtils.exists() checks that an element exist');
    // xpath
    test.assert(clientutils.exists(x('//ul')),
        'ClientUtils.exists() checks that an element exist using XPath');
    test.assertNot(clientutils.exists(x('//ol')),
        'ClientUtils.exists() checks that an element exist using XPath');
    fakeDocument(null);
    test.done();
});

casper.test.begin('ClientUtils.findAll() tests', 7, function(test) {
    var clientutils = require('clientutils').create();
    fakeDocument('<ul class="foo"><li>bar</li><li>baz</li></ul>');
    test.assertType(clientutils.findAll('li'), 'array',
        'ClientUtils.findAll() can find matching DOM elements');
    test.assertEquals(clientutils.findAll('li').length, 2,
        'ClientUtils.findAll() can find matching DOM elements');
    test.assertType(clientutils.findAll('ol'), 'array',
        'ClientUtils.findAll() can find matching DOM elements');
    test.assertEquals(clientutils.findAll('ol').length, 0,
        'ClientUtils.findAll() can find matching DOM elements');
    // scoped
    var scope = clientutils.findOne('ul');
    test.assertType(clientutils.findAll('li', scope), 'array',
        'ClientUtils.findAll() can find matching DOM elements within a given scope');
    test.assertEquals(clientutils.findAll('li', scope).length, 2,
        'ClientUtils.findAll() can find matching DOM elements within a given scope');
    test.assertType(clientutils.findAll(x('//li'), scope), 'array',
        'ClientUtils.findAll() can find matching DOM elements using XPath within a given scope');
    fakeDocument(null);
    test.done();
});

casper.test.begin('ClientUtils.findOne() tests', 4, function(test) {
    var clientutils = require('clientutils').create();
    fakeDocument('<ul class="foo"><li>bar</li><li>baz</li></ul>');
    test.assertType(clientutils.findOne('ul'), 'htmlulistelement',
        'ClientUtils.findOne() can find a matching DOM element');
    test.assertNot(clientutils.findOne('ol'),
        'ClientUtils.findOne() can find a matching DOM element');
    // scoped
    var scope = clientutils.findOne('ul');
    test.assertType(clientutils.findOne('li', scope), 'htmllielement',
        'ClientUtils.findOne() can find a matching DOM element within a given scope');
    test.assertType(clientutils.findOne(x('//li'), scope), 'htmllielement',
        'ClientUtils.findOne() can find a matching DOM element using XPath within a given scope');
    fakeDocument(null);
    test.done();
});


casper.test.begin('ClientUtils.processSelector() tests', 6, function(test) {
    var clientutils = require('clientutils').create();
    // CSS3 selector
    var cssSelector = clientutils.processSelector('html body > ul.foo li');
    test.assertType(cssSelector, 'object',
        'ClientUtils.processSelector() can process a CSS3 selector');
    test.assertEquals(cssSelector.type, 'css',
        'ClientUtils.processSelector() can process a CSS3 selector');
    test.assertEquals(cssSelector.path, 'html body > ul.foo li',
        'ClientUtils.processSelector() can process a CSS3 selector');
    // XPath selector
    var xpathSelector = clientutils.processSelector(x('//li[text()="blah"]'));
    test.assertType(xpathSelector, 'object',
        'ClientUtils.processSelector() can process a XPath selector');
    test.assertEquals(xpathSelector.type, 'xpath',
        'ClientUtils.processSelector() can process a XPath selector');
    test.assertEquals(xpathSelector.path, '//li[text()="blah"]',
        'ClientUtils.processSelector() can process a XPath selector');
    test.done();
});

casper.test.begin('ClientUtils.getElementBounds() tests', 3, function(test) {
    casper.start().then(function() {
        this.page.content = '<div id="b1" style="position:fixed;top:10px;left:11px;width:50px;height:60px"></div>';
        test.assertEquals(
            this.getElementBounds('#b1'),
            { top: 10, left: 11, width: 50, height: 60 },
            'ClientUtils.getElementBounds() retrieves element boundaries'
        );
    });
    casper.then(function() {
        var html  = '<div id="boxes">';
            html += '  <div style="position:fixed;top:10px;left:11px;width:50px;height:60px"></div>';
            html += '  <div style="position:fixed;top:20px;left:21px;width:70px;height:80px"></div>';
            html += '</div>';
        this.page.content = html;
        var bounds = this.getElementsBounds('#boxes div');
        test.assertEquals(
            bounds[0],
            { top: 10, left: 11, width: 50, height: 60 },
            'ClientUtils.getElementsBounds() retrieves multiple elements boundaries'
        );
        test.assertEquals(
            bounds[1],
            { top: 20, left: 21, width: 70, height: 80 },
            'ClientUtils.getElementsBounds() retrieves multiple elements boundaries'
        );
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('ClientUtils.getElementInfo() tests', 10, function(test) {
    casper.page.content = '<a href="plop" class="plip plup"><i>paf</i></a>';
    var info = casper.getElementInfo('a.plip');
    test.assertEquals(info.nodeName, 'a', 'ClientUtils.getElementInfo() retrieves element name');
    test.assertEquals(info.attributes, {
        'href': 'plop',
        'class': 'plip plup'
    }, 'ClientUtils.getElementInfo() retrieves element attributes');
    test.assertEquals(info.html, '<i>paf</i>', 'ClientUtils.getElementInfo() retrieves element html content');
    test.assertEquals(info.text, 'paf', 'ClientUtils.getElementInfo() retrieves element text');
    test.assert(info.x > 0, 'ClientUtils.getElementInfo() retrieves element x pos');
    test.assert(info.y > 0, 'ClientUtils.getElementInfo() retrieves element y pos');
    test.assert(info.width > 0, 'ClientUtils.getElementInfo() retrieves element width');
    test.assert(info.height > 0, 'ClientUtils.getElementInfo() retrieves element height');
    test.assert(info.visible, 'ClientUtils.getElementInfo() retrieves element visibility');
    test.assertEquals(info.tag, '<a href="plop" class="plip plup"><i>paf</i></a>',
        'ClientUtils.getElementInfo() retrieves element whole tag contents');
    test.done();
});

casper.test.begin('ClientUtils.getElementsInfo() first element tests', 10, function(test) {
    casper.page.content = '<a href="plop" class="plip plup"><i>paf</i></a><a href="plap" class="plip plup"><i>puf</i></a>';
    var info = casper.getElementsInfo('a.plip');
    test.assertEquals(info[0].nodeName, 'a', 'ClientUtils.getElementsInfo() retrieves first element name');
    test.assertEquals(info[0].attributes, {
        'href': 'plop',
        'class': 'plip plup'
    }, 'ClientUtils.getElementsInfo() retrieves first element attributes');
    test.assertEquals(info[0].html, '<i>paf</i>', 'ClientUtils.getElementsInfo() retrieves first element html content');
    test.assertEquals(info[0].text, 'paf', 'ClientUtils.getElementsInfo() retrieves first element text');
    test.assert(info[0].x > 0, 'ClientUtils.getElementsInfo() retrieves first element x pos');
    test.assert(info[0].y > 0, 'ClientUtils.getElementsInfo() retrieves first element y pos');
    test.assert(info[0].width > 0, 'ClientUtils.getElementsInfo() retrieves first element width');
    test.assert(info[0].height > 0, 'ClientUtils.getElementsInfo() retrieves first element height');
    test.assert(info[0].visible, 'ClientUtils.getElementsInfo() retrieves first element visibility');
    test.assertEquals(info[0].tag, '<a href="plop" class="plip plup"><i>paf</i></a>',
        'ClientUtils.getElementsInfo() retrieves first element whole tag contents');
    test.done();
});

casper.test.begin('ClientUtils.getElementsInfo() second element tests', 10, function(test) {
    casper.page.content = '<a href="plop" class="plip plup"><i>paf</i></a><a href="plap" class="plip plup"><i>puf</i></a>';
    var info = casper.getElementsInfo('a.plip');
    test.assertEquals(info[1].nodeName, 'a', 'ClientUtils.getElementsInfo() retrieves second element name');
    test.assertEquals(info[1].attributes, {
        'href': 'plap',
        'class': 'plip plup'
    }, 'ClientUtils.getElementsInfo() retrieves second element attributes');
    test.assertEquals(info[1].html, '<i>puf</i>', 'ClientUtils.getElementsInfo() retrieves second element html content');
    test.assertEquals(info[1].text, 'puf', 'ClientUtils.getElementsInfo() retrieves second element text');
    test.assert(info[1].x > 0, 'ClientUtils.getElementsInfo() retrieves second element x pos');
    test.assert(info[1].y > 0, 'ClientUtils.getElementsInfo() retrieves second element y pos');
    test.assert(info[1].width > 0, 'ClientUtils.getElementsInfo() retrieves second element width');
    test.assert(info[1].height > 0, 'ClientUtils.getElementsInfo() retrieves second element height');
    test.assert(info[1].visible, 'ClientUtils.getElementsInfo() retrieves second element visibility');
    test.assertEquals(info[1].tag, '<a href="plap" class="plip plup"><i>puf</i></a>',
        'ClientUtils.getElementsInfo() retrieves second element whole tag contents');
    test.done();
});
