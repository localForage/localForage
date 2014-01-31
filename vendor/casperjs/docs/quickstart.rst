.. _quickstart:

==========
Quickstart
==========

Once CasperJS is :doc:`properly installed <installation>`, you can write your first script. You can use plain :ref:`Javascript <quickstart_javascript>` or :ref:`CoffeeScript <quickstart_coffeescript>`.

.. hint::

   If you're not too comfortable with Javascript, a :ref:`dedicated FAQ entry <faq_javascript>` is waiting for you.

.. _quickstart_javascript:

A minimal scraping script
-------------------------

Fire up your favorite editor, create and save a ``sample.js`` file like below::

    var casper = require('casper').create();

    casper.start('http://casperjs.org/', function() {
        this.echo(this.getTitle());
    });

    casper.thenOpen('http://phantomjs.org', function() {
        this.echo(this.getTitle());
    });

    casper.run();

Run it:

.. code-block:: text

    $ casperjs sample.js

You should get something like this:

.. code-block:: text

    $ casperjs sample.js
    CasperJS, a navigation scripting and testing utility for PhantomJS
    PhantomJS: Headless WebKit with JavaScript API

.. topic:: What did we just do?

   1. we created a new :ref:`Casper <casper_module>` instance
   2. we started it and opened ``http://casperjs.org/``
   3. *once* the page has been loaded, we asked to print the title of that webpage (the content of its ``<title>`` tag)
   4. *then* we opened another url, ``http://phantomjs.org/``
   5. *once* the new page has been loaded, we asked to print its title too
   6. we executed the whole process


Now let's scrape Google!
------------------------

In the following example, we'll query google for two terms consecutively, *"casperjs"* and *"phantomjs"*, aggregate the result links in a standard ``Array`` and output the result to the console.

Fire up your favorite editor and save the javascript code below in a
``googlelinks.js`` file::

    var links = [];
    var casper = require('casper').create();

    function getLinks() {
        var links = document.querySelectorAll('h3.r a');
        return Array.prototype.map.call(links, function(e) {
            return e.getAttribute('href');
        });
    }

    casper.start('http://google.fr/', function() {
        // search for 'casperjs' from google form
        this.fill('form[action="/search"]', { q: 'casperjs' }, true);
    });

    casper.then(function() {
        // aggregate results for the 'casperjs' search
        links = this.evaluate(getLinks);
        // now search for 'phantomjs' by filling the form again
        this.fill('form[action="/search"]', { q: 'phantomjs' }, true);
    });

    casper.then(function() {
        // aggregate results for the 'phantomjs' search
        links = links.concat(this.evaluate(getLinks));
    });

    casper.run(function() {
        // echo results in some pretty fashion
        this.echo(links.length + ' links found:');
        this.echo(' - ' + links.join('\n - ')).exit();
    });

Run it:

.. code-block:: text

    $ casperjs googlelinks.js
    20 links found:
     - https://github.com/n1k0/casperjs
     - https://github.com/n1k0/casperjs/issues/2
     - https://github.com/n1k0/casperjs/tree/master/samples
     - https://github.com/n1k0/casperjs/commits/master/
     - http://www.facebook.com/people/Casper-Js/100000337260665
     - http://www.facebook.com/public/Casper-Js
     - http://hashtags.org/tag/CasperJS/
     - http://www.zerotohundred.com/newforums/members/casper-js.html
     - http://www.yellowpages.com/casper-wy/j-s-enterprises
     - http://local.trib.com/casper+wy/j+s+chinese+restaurant.zq.html
     - http://www.phantomjs.org/
     - http://code.google.com/p/phantomjs/
     - http://code.google.com/p/phantomjs/wiki/QuickStart
     - http://svay.com/blog/index/post/2011/08/31/Paris-JS-10-%3A-Introduction-%C3%A0-PhantomJS
     - https://github.com/ariya/phantomjs
     - http://dailyjs.com/2011/01/28/phantoms/
     - http://css.dzone.com/articles/phantom-js-alternative
     - http://pilvee.com/blog/tag/phantom-js/
     - http://ariya.blogspot.com/2011/01/phantomjs-minimalistic-headless-webkit.html
     - http://www.readwriteweb.com/hack/2011/03/phantomjs-the-power-of-webkit.php


.. _quickstart_coffeescript:

.. index:: coffeescript

CoffeeScript version
--------------------

You can also write Casper scripts using the `CoffeeScript syntax <http://jashkenas.github.com/coffee-script/>`_:

.. code-block:: coffeescript

    getLinks = ->
      links = document.querySelectorAll "h3.r a"
      Array::map.call links, (e) -> e.getAttribute "href"

    links = []
    casper = require('casper').create()

    casper.start "http://google.fr/", ->
      # search for 'casperjs' from google form
      @fill "form[action='/search']", q: "casperjs", true

    casper.then ->
      # aggregate results for the 'casperjs' search
      links = @evaluate getLinks
      # search for 'phantomjs' from google form
      @fill "form[action='/search']", q: "phantomjs", true

    casper.then ->
      # concat results for the 'phantomjs' search
      links = links.concat @evaluate(getLinks)

    casper.run ->
      # display results
      @echo links.length + " links found:"
      @echo(" - " + links.join("\n - ")).exit()

Just remember to suffix your script with the ``.coffee`` extension.

A minimal testing script
------------------------

CasperJS is also a :ref:`testing framework <testing>`; test scripts are slightly different than scraping ones, though they share most of the API.

A simplest test script::

    // hello-test.js
    casper.test.begin("Hello, Test!", 1, function(test) {
      test.assert(true);
      test.done();
    });

Run it using the ``casperjs test`` subcommand:

.. code-block:: text

    $ casperjs test hello-test.js
    Test file: hello-test.js
    # Hello, Test!
    PASS Subject is strictly true
    PASS 1 test executed in 0.023s, 1 passed, 0 failed, 0 dubious, 0 skipped.

.. note::

   As you can see, there's no need to create a ``casper`` instance in a test script as a preconfigured one has already made available for you.

   You can read more about testing in the :ref:`dedicated section <testing>`.
