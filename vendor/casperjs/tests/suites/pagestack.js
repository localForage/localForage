/*global casper*/
/*jshint strict:false, maxstatements:99*/
var pagestack = require('pagestack');
var utils = require('utils');
var webpage = require('webpage');

casper.test.begin('pagestack module tests', 14, function(test) {
    var stack = pagestack.create();
    var page1 = webpage.create();
    page1.url = 'page1.html';
    stack.push(page1);
    test.assertEquals(stack.length, 1);
    test.assert(utils.isWebPage(stack[0]));
    test.assertEquals(stack[0], page1);
    test.assertEquals(stack.list().length, 1);
    test.assertEquals(stack.list()[0], page1.url);

    var page2 = webpage.create();
    page2.url = 'page2.html';
    stack.push(page2);
    test.assertEquals(stack.length, 2);
    test.assert(utils.isWebPage(stack[1]));
    test.assertEquals(stack[1], page2);
    test.assertEquals(stack.list().length, 2);
    test.assertEquals(stack.list()[1], page2.url);

    test.assertEquals(stack.clean(page1), 1);
    test.assertEquals(stack[0], page2);
    test.assertEquals(stack.list().length, 1);
    test.assertEquals(stack.list()[0], page2.url);

    test.done();
});
