.. _extending:

.. index:: extending, inheritance, prototype

=========
Extending
=========

Sometimes it can be convenient to add your own methods to a ``Casper`` object instance; you can easily do so as illustrated in the example below::

    var casper = require('casper').create({
        verbose: true,
        logLevel: "debug"
    });

    var links = {
        'http://edition.cnn.com/': 0,
        'http://www.nytimes.com/': 0,
        'http://www.bbc.co.uk/': 0,
        'http://www.guardian.co.uk/': 0
    };

    casper.countLinks = function() {
        return this.evaluate(function() {
            return __utils__.findAll('a[href]').length;
        });
    };

    casper.renderJSON = function(what) {
        return this.echo(JSON.stringify(what, null, '  '));
    };

    casper.start();

    casper.each(Object.keys(links), function(casper, link) {
        this.thenOpen(link, function() {
            links[link] = this.countLinks();
        });
    });

    casper.run(function() {
        this.renderJSON(links).exit();
    });

But that's just plain old *monkey-patching* the ``casper`` object, and you may probably want a more OO approach… That's where the ``inherits()`` function from the ``utils`` module and ported from `nodejs <http://nodejs.org/>`_ comes handy::

    var Casper = require('casper').Casper;
    var utils = require('utils');
    var links = {
        'http://edition.cnn.com/': 0,
        'http://www.nytimes.com/': 0,
        'http://www.bbc.co.uk/': 0,
        'http://www.guardian.co.uk/': 0
    };

    function Fantomas() {
        Fantomas.super_.apply(this, arguments);
    }

    // Let's make our Fantomas class extending the Casper one
    // please note that at this point, CHILD CLASS PROTOTYPE WILL BE OVERRIDEN
    utils.inherits(Fantomas, Casper);

    Fantomas.prototype.countLinks = function() {
        return this.evaluate(function() {
            return __utils__.findAll('a[href]').length;
        });
    };

    Fantomas.prototype.renderJSON = function(what) {
        return this.echo(JSON.stringify(what, null, '  '));
    };

    var fantomas = new Fantomas({
        verbose: true,
        logLevel: "debug"
    });

    fantomas.start();

    Object.keys(links).forEach(function(url) {
        fantomas.thenOpen(url, function() {
            links[url] = this.countLinks();
        });
    });

    fantomas.run(function() {
        this.renderJSON(links).exit();
    });

.. note::

   The use of the ``super_`` child class property which becomes available once its parent has been defined using ``inherits()``; it contains a reference to the parent constructor.

   **Don't forget to call ``Casper``'s parent constructor!**

   Of course this approach is bit more verbose than the easy *monkey-patching* one, so please ensure you're not just overengineering stuff by subclassing the ``Casper`` class.


.. index:: coffeescript

Using CoffeeScript
~~~~~~~~~~~~~~~~~~

If you're writing your casper scripts using `CoffeeScript <http://coffeescript.org/>`_, extending casper is getting a bit more straightforward:

.. code-block:: coffeescript

    links =
        'http://edition.cnn.com/': 0
        'http://www.nytimes.com/': 0
        'http://www.bbc.co.uk/': 0
        'http://www.guardian.co.uk/': 0

    class Fantomas extends require('casper').Casper
        countLinks: ->
            @evaluate ->
                __utils__.findAll('a').length

        renderJSON: (what) ->
            @echo JSON.stringify what, null, '  '

    fantomas = new Fantomas
        loadImages:  false
        logLevel:    "debug"
        verbose:     true

    fantomas.start()

    for url of links
        do (url) ->
            fantomas.thenOpen url, ->
                links[url] = @countLinks()

    fantomas.run ->
        @renderJSON links
        @exit()

