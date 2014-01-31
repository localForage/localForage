/*global casper*/
/*jshint strict:false, maxstatements:99*/
var utils = require('utils'),
    t = casper.test,
    x = require('casper').selectXPath;

casper.test.begin('utils.betterTypeOf() tests', 10,  function(test) {
    var testCases = [
        {subject: 1, expected: 'number'},
        {subject: '1', expected: 'string'},
        {subject: {}, expected: 'object'},
        {subject: [], expected: 'array'},
        {subject: undefined, expected: 'undefined'},
        {subject: null, expected: 'null'},
        {subject: function(){}, expected: 'function'},
        {subject: window, expected: 'domwindow'},
        {subject: new Date(), expected: 'date'},
        {subject: new RegExp(), expected: 'regexp'}
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(utils.betterTypeOf(testCase.subject), testCase.expected,
            utils.format('betterTypeOf() detects expected type "%s"', testCase.expected));
    });
    test.done();
});

casper.test.begin('utils.betterInstanceOf() tests', 13,  function(test) {
    /*global XMLDocument*/
    // need two objects to test inheritance
    function Cow(){} var daisy = new Cow();
    function SuperCow(){} SuperCow.prototype = new Cow(); var superDaisy = new SuperCow();
    var date = new Date(); var regex = new RegExp(); var xmlDoc = document.implementation.createDocument("<y>", "x", null);
    var testCases = [
        {subject: 1, fn: Number, expected: true},
        {subject: '1', fn: String, expected: true},
        {subject: {}, fn: Object, expected: true},
        {subject: [], fn: Array, expected: true},
        {subject: undefined, fn: Array, expected: false},
        {subject: null, fn: Array, expected: false},
        {subject: function(){}, fn: Function, expected: true},
        {subject: date, fn: Date, expected: true},
        {subject: regex, fn: RegExp, expected: true},
        {subject: xmlDoc, fn: XMLDocument, expected: true},
        {subject: daisy, fn: Cow, expected: true},
        {subject: superDaisy, fn: SuperCow, expected: true},
        {subject: superDaisy, fn: Cow, expected: true}
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(utils.betterInstanceOf(testCase.subject, testCase.fn), testCase.expected,
            utils.format('betterInstanceOf() detects expected constructor "%s"', testCase.fn.name));
    });
    test.done();
});

casper.test.begin('utils.cleanUrl() tests', 11, function(test) {
    var testCases = {
        'http://google.com/': 'http://google.com/',
        'http://google.com': 'http://google.com/',
        'http://www.google.com/': 'http://www.google.com/',
        'http://www.google.com/?plop=2': 'http://www.google.com/?plop=2',
        'https://google.com/': 'https://google.com/',
        'https://google.com': 'https://google.com/',
        'https://www.google.com/': 'https://www.google.com/',
        'https://www.google.com/?plop=2': 'https://www.google.com/?plop=2',
        'https://www.google.com?plop=2': 'https://www.google.com/?plop=2',
        'file:///Users/toto/toto.html': 'file:///Users/toto/toto.html',
        '/100': '/100'
    };
    for (var testCase in testCases) {
        test.assertEquals(utils.cleanUrl(testCase), testCases[testCase], 'cleanUrl() cleans an URL');
    }
    test.done();
});

casper.test.begin('utils.clone() tests', 2, function(test) {
    var a = {a: 1, b: 2, c: [1, 2]};
    test.assertEquals(utils.clone(a), a);
    var b = [1, 2, 3, a];
    test.assertEquals(utils.clone(b), b);
    test.done();
});

if (utils.gteVersion(phantom.version, '1.9.0')) {
    casper.test.begin('utils.computeModifier() tests', 7, function(test) {
        var modifiers = require('webpage').create().event.modifier;
        test.assertType(modifiers, "object");
        test.assertEquals(utils.computeModifier("", modifiers), 0,
            'computeModifier() computes a "none" modifier');
        test.assertEquals(utils.computeModifier("alt", modifiers),
                          modifiers.alt,
                         'computeModifier() computes an "alt" modifier');
        test.assertEquals(utils.computeModifier("ctrl+alt", modifiers),
                          modifiers.ctrl | modifiers.alt,
                         'computeModifier() computes a "ctrl+alt" modifier');
        test.assertEquals(utils.computeModifier("ctrl+alt+shift", modifiers),
                          modifiers.ctrl | modifiers.alt | modifiers.shift,
                         'computeModifier() computes a "ctrl+alt+shift" modifier');
        test.assertThrows(utils.computeModifier, ["chucknorris", modifiers],
                         'computeModifier() checks for a valid modifier');
        test.assertThrows(utils.computeModifier, ["chuck+norris", modifiers],
                         'computeModifier() checks for a valid complex modifier');
        test.done();
    });
}

casper.test.begin('decodeUrl() tests', 4, function(test) {
    /* global escape */
    test.assertEquals(utils.decodeUrl('foo'), 'foo');
    test.assertEquals(utils.decodeUrl('Forlì'), 'Forlì');
    test.assertEquals(utils.decodeUrl(encodeURIComponent('Forlì')), 'Forlì');
    test.assertEquals(utils.decodeUrl(escape('Forlì')), 'Forlì');
    test.done();
});

casper.test.begin('equals() tests', 23, function(test) {
    test.assert(utils.equals(null, null), 'equals() null equality');
    test.assertNot(utils.equals(null, undefined), 'equals() null vs. undefined inequality');
    test.assert(utils.equals("hi", "hi"), 'equals() string equality');
    test.assertNot(utils.equals("hi", "ih"), 'equals() string inequality');
    test.assert(utils.equals(5, 5), 'equals() number equality');
    test.assertNot(utils.equals("5", 5), 'equals() number equality without implicit cast');
    test.assert(utils.equals(5, 5.0), 'equals() number equality with cast');
    test.assertNot(utils.equals(5, 10), 'equals() number inequality');
    test.assert(utils.equals([], []), 'equals() empty array equality');
    test.assert(utils.equals([1,2], [1,2]), 'equals() array equality');
    test.assert(utils.equals([1,2,[1,2,function(){}]], [1,2,[1,2,function(){}]]),
        'equals() complex array equality');
    test.assertNot(utils.equals([1,2,[1,2,function(a){}]], [1,2,[1,2,function(b){}]]),
        'equals() complex array inequality');
    test.assertNot(utils.equals([1,2], [2,1]), 'equals() shuffled array inequality');
    test.assertNot(utils.equals([1,2], [1,2,3]), 'equals() array length inequality');
    test.assert(utils.equals({}, {}), 'equals() empty object equality');
    test.assert(utils.equals({a:1,b:2}, {a:1,b:2}), 'equals() object length equality');
    test.assert(utils.equals({a:1,b:2}, {b:2,a:1}), 'equals() shuffled object keys equality');
    test.assertNot(utils.equals({a:1,b:2}, {a:1,b:3}), 'equals() object inequality');
    test.assert(utils.equals({1:{name:"bob",age:28}, 2:{name:"john",age:26}},
                             {1:{name:"bob",age:28}, 2:{name:"john",age:26}}),
        'equals() complex object equality');
    test.assertNot(utils.equals({1:{name:"bob",age:28}, 2:{name:"john",age:26}},
                                {1:{name:"bob",age:28}, 2:{name:"john",age:27}}),
        'equals() complex object inequality');
    test.assert(utils.equals(function(x){return x;}, function(x){return x;}),
        'equals() function equality');
    test.assertNot(utils.equals(function(x){return x;}, function(y){return y+2;}),
        'equals() function inequality');
    test.assert(utils.equals([{a:1, b:2}, {c:3, d:4}], [{a:1, b:2}, {c:3, d:4}]),
        'equals() arrays of objects');
    test.done();
});

casper.test.begin('fileExt() tests', 6, function(test) {
    var testCases = {
        'foo.ext':    'ext',
        'FOO.EXT':    'ext',
        'a.ext':      'ext',
        '.ext':       'ext',
        'toto.':      '',
        ' plop.ext ': 'ext'
    };
    for (var testCase in testCases) {
        test.assertEquals(utils.fileExt(testCase), testCases[testCase],
            'fileExt() extract file extension');
    }
    test.done();
});

casper.test.begin('fillBlanks() tests', 3, function(test) {
    var testCases = {
        'foo':         'foo       ',
        '  foo bar ':  '  foo bar ',
        '  foo bar  ': '  foo bar  '
    };
    for (var testCase in testCases) {
        test.assertEquals(utils.fillBlanks(testCase, 10), testCases[testCase],
            'fillBlanks() fills blanks');
    }
    test.done();
});

casper.test.begin('getPropertyPath() tests', 7, function(test) {
    var testCases = [
        {
            input:  utils.getPropertyPath({}, 'a.b.c'),
            output: undefined
        },
        {
            input:  utils.getPropertyPath([1, 2, 3], 'a.b.c'),
            output: undefined
        },
        {
            input:  utils.getPropertyPath({ a: { b: { c: 1 } }, c: 2 }, 'a.b.c'),
            output: 1
        },
        {
            input:  utils.getPropertyPath({ a: { b: { c: 1 } }, c: 2 }, 'a.b.x'),
            output: undefined
        },
        {
            input:  utils.getPropertyPath({ a: { b: { c: 1 } }, c: 2 }, 'a.b'),
            output: { c: 1 }
        },
        {
            input:  utils.getPropertyPath({ 'a-b': { 'c-d': 1} }, 'a-b.c-d'),
            output: 1
        },
        {
            input:  utils.getPropertyPath({ 'a.b': { 'c.d': 1} }, 'a.b.c.d'),
            output: undefined
        }
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(testCase.input, testCase.output,
            'getPropertyPath() gets a property using a path');
    });
    test.done();
});

casper.test.begin('isArray() tests', 3, function(test) {
    test.assertEquals(utils.isArray([]), true, 'isArray() checks for an Array');
    test.assertEquals(utils.isArray({}), false, 'isArray() checks for an Array');
    test.assertEquals(utils.isArray("foo"), false, 'isArray() checks for an Array');
    test.done();
});

casper.test.begin('isClipRect() tests', 5, function(test) {
    var testCases = [
        [{},                                              false],
        [{top: 2},                                        false],
        [{top: 2, left: 2, width: 2, height: 2},          true],
        [{top: 2, left: 2, height: 2, width: 2},          true],
        [{top: 2, left: 2, width: 2, height: new Date()}, false]
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(utils.isClipRect(testCase[0]), testCase[1],
            'isClipRect() checks for a ClipRect');
    });
    test.done();
});

casper.test.begin('isHTTPResource() tests', 6, function(test) {
    var testCases = [
        [{},                              false],
        [{url: 'file:///var/www/i.html'}, false],
        [{url: 'mailto:plop@plop.com'},   false],
        [{url: 'ftp://ftp.plop.com'},     false],
        [{url: 'HTTP://plop.com/'},       true],
        [{url: 'https://plop.com/'},      true]
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(utils.isHTTPResource(testCase[0]), testCase[1],
            'isHTTPResource() checks for an HTTP resource');
    });
    test.done();
});

casper.test.begin('isObject() tests', 8, function(test) {
    test.assertEquals(utils.isObject({}), true, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject([]), true, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject(1), false, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject("1"), false, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject(function(){}), false, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject(new Function('return {};')()), true, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject(require('webpage').create()), true, 'isObject() checks for an Object');
    test.assertEquals(utils.isObject(null), false, 'isObject() checks for an Object');
    test.done();
});

casper.test.begin('isValidSelector() tests', 10, function(test) {
    t.assertEquals(utils.isValidSelector({}), false,
        'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector(""), false,
        'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector("a"), true,
        'isValidSelector() checks for a valid selector');
    t.assert(
        utils.isValidSelector('div#plop form[name="form"] input[type="submit"]'),
        'isValidSelector() checks for a valid selector'
    );
    t.assertEquals(utils.isValidSelector(x('//a')), true,
        'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector({
        type: "css",
        path: 'div#plop form[name="form"] input[type="submit"]'
    }), true, 'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector({
        type: "xpath",
        path: '//a'
    }), true, 'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector({
        type: "css"
    }), false, 'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector({
        type: "xpath"
    }), false, 'isValidSelector() checks for a valid selector');
    t.assertEquals(utils.isValidSelector({
        type: "css3",
        path: "a"
    }), false, 'isValidSelector() checks for a valid selector');
    test.done();
});

casper.test.begin('isWebPage() tests', 3, function(test) {
    var pageModule = require('webpage');
    test.assertEquals(utils.isWebPage(pageModule), false,
        'isWebPage() checks for a WebPage instance');
    test.assertEquals(utils.isWebPage(pageModule.create()), true,
        'isWebPage() checks for a WebPage instance');
    test.assertEquals(utils.isWebPage(null), false,
        'isWebPage() checks for a WebPage instance');
    test.done();
});

casper.test.begin('isJsFile() tests', 5, function(test) {
    var testCases = {
        '':             false,
        'toto.png':     false,
        'plop':         false,
        'gniii.coffee': true,
        'script.js':    true
    };
    for (var testCase in testCases) {
        test.assertEquals(utils.isJsFile(testCase), testCases[testCase],
            'isJsFile() checks for js file');
    }
    test.done();
});


casper.test.begin('mergeObjects() tests', 10, function(test) {
    /* jshint eqeqeq:false */
    var testCases = [
        {
            obj1: {a: 1}, obj2: {b: 2}, merged: {a: 1, b: 2}
        },
        {
            obj1: {}, obj2: {a: 1}, merged: {a: 1}
        },
        {
            obj1: {}, obj2: {a: {b: 2}}, merged: {a: {b: 2}}
        },
        {
            obj1: {a: 1}, obj2: {}, merged: {a: 1}
        },
        {
            obj1: {a: 1}, obj2: {a: 2}, merged: {a: 2}
        },
        {
            obj1:   {x: 0, double: function(){return this.x*2;}},
            obj2:   {triple: function(){return this.x*3;}},
            merged: {
                x: 0,
                double: function(){return this.x*2;},
                triple: function(){return this.x*3;}
            }
        }
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(
            utils.mergeObjects(testCase.obj1, testCase.obj2),
            testCase.merged,
            'mergeObjects() can merge objects'
        );
    });
    var obj = {x: 1},
        qtruntimeobject = {foo: 'baz'};

    var merged1 = utils.mergeObjects({}, {a: obj});
    merged1.a.x = 2;
    test.assertEquals(obj.x, 1, 'mergeObjects() creates deep clones #1');

    var merged2 = utils.mergeObjects({a: {}}, {a: obj});
    merged2.a.x = 2;
    test.assertEquals(obj.x, 1, 'mergeObjects() creates deep clones #2');

    var refObj = {a: qtruntimeobject};
    var merged3 = utils.mergeObjects({}, refObj, {keepReferences: false});
    test.assertFalsy(merged3.a == refObj.a, 'disabling references should not point to same object');

    var merged4 = utils.mergeObjects({}, refObj, {keepReferences: true});
    test.assert(merged4.a == refObj.a, 'enabling references should point to same object');

    test.done();
});

casper.test.begin('objectValues() tests', 2, function(test) {
    test.assertEquals(utils.objectValues({}), [],
        'objectValues() can extract object values');
    test.assertEquals(utils.objectValues({a: 1, b: 2}), [1, 2],
        'objectValues() can extract object values');
    test.done();
});

casper.test.begin('quoteXPathAttributeString() tests', 2, function(test) {
    casper.start('tests/site/click.html', function() {
        var selector = utils.format('//a[text()=%s]',
            utils.quoteXPathAttributeString('Label with double "quotes"'));
        test.assertExists(x(selector), utils.format('Xpath selector "%s" is found on "tests/site/click.html" page', selector));
        selector = utils.format('//a[text()=%s]',
            utils.quoteXPathAttributeString("Label with single 'quotes'"));
        test.assertExists(x(selector), utils.format('Xpath selector "%s" is found on "tests/site/click.html" page', selector));
    }).run(function() {
        test.done();
    });
});

casper.test.begin('unique() tests', 4, function(test) {
    var testCases = [
        {
            input:  [1,2,3],
            output: [1,2,3]
        },
        {
            input:  [1,2,3,2,1],
            output: [1,2,3]
        },
        {
            input:  ["foo", "bar", "foo"],
            output: ["foo", "bar"]
        },
        {
            input:  [],
            output: []
        }
    ];
    testCases.forEach(function(testCase) {
        test.assertEquals(utils.unique(testCase.input), testCase.output,
            'unique() computes unique values of an array');
    });
    test.done();
});

casper.test.begin('cmpVersion() tests', 10, function suite(test) {
    test.assertEquals(utils.cmpVersion('1.0.0', '2.0.0'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('1.0.0-DEV', '2.0.0-BOOM'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('1.0.0', '1.1.0'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('1.1.0', '1.0.0'), 1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('0.0.3', '0.0.4'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('0.0.3', '1.0.3'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion('0.1', '1.0.3.8'), -1,
        'cmpVersion() can compare version strings');
    test.assertEquals(utils.cmpVersion({major: 1, minor: 2, patch: 3},
                                       {major: 1, minor: 2, patch: 4}), -1,
        'cmpVersion() can compare version objects');
    test.assertEquals(utils.cmpVersion({major: 2, minor: 0, patch: 3},
                                       {major: 1, minor: 0, patch: 4}), 1,
        'cmpVersion() can compare version objects');
    test.assertEquals(utils.cmpVersion({major: 0, minor: 0, patch: 3},
                                       {major: 1, minor: 0, patch: 3}), -1,
        'cmpVersion() can compare version objects');
    test.done();
});

casper.test.begin('gteVersion() tests', 4, function suite(test) {
    test.assert(utils.gteVersion('1.1.0', '1.0.0'),
        'gteVersion() checks for a greater or equal version');
    test.assertNot(utils.gteVersion('1.0.0', '1.1.0'),
        'gteVersion() checks for a greater or equal version');
    test.assert(utils.gteVersion({major: 1, minor: 1, patch: 0},
                                 {major: 1, minor: 0, patch: 0}),
        'gteVersion() checks for a greater or equal version');
    test.assertNot(utils.gteVersion({major: 1, minor: 0, patch: 0},
                                    {major: 1, minor: 1, patch: 0}),
        'gteVersion() checks for a greater or equal version');
    test.done();
});

casper.test.begin('ltVersion() tests', 4, function suite(test) {
    test.assert(utils.ltVersion('1.0.0', '1.1.0'),
        'ltVersion() checks for a lesser version');
    test.assertNot(utils.ltVersion('1.1.0', '1.0.0'),
        'ltVersion() checks for a lesser version');
    test.assert(utils.ltVersion({major: 1, minor: 0, patch: 0},
                                {major: 1, minor: 1, patch: 0}),
        'ltVersion() checks for a lesser version');
    test.assertNot(utils.ltVersion({major: 1, minor: 1, patch: 0},
                                   {major: 1, minor: 0, patch: 0}),
        'ltVersion() checks for a lesser version');
    test.done();
});
