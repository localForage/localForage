/*jshint strict:false, maxstatements:99*/
/*global CasperError, casper, console, phantom, require*/
var utils = require('utils');
var x = require('casper').selectXPath;

casper.test.begin('popup tests', 22, function(test) {
    casper.once('popup.created', function(popup) {
        test.pass('"popup.created" event is fired');
        test.assert(utils.isWebPage(popup),
            '"popup.created" event callback get a popup page instance');
    });

    casper.once('popup.loaded', function(popup) {
        test.pass('"popup.loaded" event is fired');
        test.assertEquals(popup.evaluate(function() {
            return document.title;
        }), 'CasperJS test index',
            '"popup.loaded" is triggered when popup content is actually loaded');
    });

    casper.once('popup.closed', function(popup) {
        test.assertEquals(this.popups.length, 0, '"popup.closed" event is fired');
    });

    casper.start('tests/site/popup.html');

    casper.waitForPopup('index.html', function() {
        test.pass('Casper.waitForPopup() waits for a popup being created');
        test.assertEquals(this.popups.length, 1, 'A popup has been added');
        test.assert(utils.isWebPage(this.popups[0]), 'A popup is a WebPage');
    });

    casper.withPopup('index.html', function() {
        test.assertTitle('CasperJS test index',
            'Casper.withPopup() found a popup with expected title');
        test.assertTextExists('three',
            'Casper.withPopup() found a popup with expected text');
        test.assertUrlMatches(/index\.html$/,
            'Casper.withPopup() switched to popup as current active one');
        test.assertEval(function() {
            return '__utils__' in window;
        }, 'Casper.withPopup() has client utils injected');
        test.assertExists('h1',
            'Casper.withPopup() can perform assertions on the DOM');
        test.assertExists(x('//h1'),
            'Casper.withPopup() can perform assertions on the DOM using XPath');
    });

    casper.then(function() {
        test.assertUrlMatches(/popup\.html$/,
            'Casper.withPopup() has reverted to main page after using the popup');
    });

    casper.thenClick('.close', function() {
        test.assertEquals(this.popups.length, 0, 'Popup is removed when closed');
    });

    casper.thenOpen('tests/site/popup.html');

    casper.waitForPopup(/index\.html$/, function() {
        test.pass('Casper.waitForPopup() waits for a popup being created');
    });

    casper.withPopup(/index\.html$/, function() {
        test.assertTitle('CasperJS test index',
            'Casper.withPopup() can use a regexp to identify popup');
    });

    casper.thenClick('.close', function() {
        test.assertUrlMatches(/popup\.html$/,
            'Casper.withPopup() has reverted to main page after using the popup');
        test.assertEquals(this.popups.length, 0, 'Popup is removed when closed');
        this.removeAllListeners('popup.created');
        this.removeAllListeners('popup.loaded');
        this.removeAllListeners('popup.closed');
    });

    casper.thenClick('a[target="_blank"]');

    casper.waitForPopup('form.html', function() {
        test.pass('Casper.waitForPopup() waits when clicked on a link with target=_blank');
    });

    casper.withPopup('form.html', function() {
        test.assertTitle('CasperJS test form');
    });

    casper.run(function() {
        test.done();
    });
});
