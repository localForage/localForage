.. _selectors:

.. index:: selector, DOM, HTML

=========
Selectors
=========

CasperJS makes an heavy use of selectors in order to work with the `DOM <http://www.w3.org/TR/dom/>`_, and can transparently use either `CSS3 <http://www.w3.org/TR/selectors/>`_ or `XPath <http://www.w3.org/TR/xpath/>`_ expressions.

All the examples below are based on this HTML code:

.. code-block:: html

    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>My page</title>
    </head>
    <body>
        <h1 class="page-title">Hello</h1>
        <ul>
            <li>one</li>
            <li>two</li>
            <li>three</li>
        </ul>
        <footer><p>©2012 myself</p></footer>
    </body>
    </html>

.. index:: CSS, CSS3

CSS3
----

By default, CasperJS accepts `CSS3 selector strings <http://www.w3.org/TR/selectors/#selectors>`_ to check for elements within the DOM.

To check if the ``<h1 class="page-title">`` element exists in the example page, you can use::

    var casper = require('casper').create();

    casper.start('http://domain.tld/page.html', function() {
        if (this.exists('h1.page-title')) {
            this.echo('the heading exists');
        }
    });

    casper.run();

Or if you're using the :doc:`testing framework <testing>`::

    casper.test.begin('The heading exists', 1, function suite(test) {
        casper.start('http://domain.tld/page.html', function() {
            test.assertExists('h1.page-title');
        }).run(function() {
            test.done();
        });
    });

Some other convenient testing methods are relying on selectors::

    casper.test.begin('Page content tests', 3, function suite(test) {
        casper.start('http://domain.tld/page.html', function() {
            test.assertExists('h1.page-title');
            test.assertSelectorHasText('h1.page-title', 'Hello');
            test.assertVisible('footer');
        }).run(function() {
            test.done();
        });
    });

.. index:: XPath

XPath
-----

.. versionadded:: 0.6.8

You can alternatively use `XPath expressions <http://en.wikipedia.org/wiki/XPath>`_ instead::

    casper.start('http://domain.tld/page.html', function() {
        this.test.assertExists({
            type: 'xpath',
            path: '//*[@class="plop"]'
        }, 'the element exists');
    });

To ease the use and reading of XPath expressions, a ``selectXPath`` helper is available from the ``casper`` module::

    var x = require('casper').selectXPath;

    casper.start('http://domain.tld/page.html', function() {
        this.test.assertExists(x('//*[@id="plop"]'), 'the element exists');
    });

.. warning::

   The only limitation of XPath use in CasperJS is in the :ref:`casper.fill() <casper_fill>` method when you want to fill **file fields**; PhantomJS natively only allows the use of CSS3 selectors in its `uploadFile method <https://github.com/ariya/phantomjs/wiki/API-Reference#wiki-webpage-uploadFile>`_, hence this limitation.
