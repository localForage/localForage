.. _faq:

.. index:: FAQ, Help

===
FAQ
===

.. contents:: Here's a selection of the most frequently asked questions by CasperJS newcomers:
   :local:
   :backlinks: top

.. index:: Node.js

Is CasperJS a `node.js <http://nodejs.org/>`_ library?
------------------------------------------------------

**No.** CasperJS is written on top of PhantomJS_, which is a node-independent Qt_/WebKit_ based library. If you try to run your CasperJS script with node, it just won't work out of the box.

.. hint:: If you want to drive CasperJS from node, try `SpookyJS <https://github.com/WaterfallEngineering/SpookyJS>`_.


.. index:: Bugs, Contributing, error

I'm stuck! I think there's a bug! What can I do?
------------------------------------------------

Before rage-tweeting:

1. Read the `docs <http://casperjs.org/>`_
2. Check if an `issue <https://github.com/n1k0/casperjs/issues>`_ has been open about your problem already
3. Check you're running the `latest stable tag <https://github.com/n1k0/casperjs/tags>`_
4. Check you're running the `latest version <http://code.google.com/p/phantomjs/downloads/list>`_ of PhantomJS_
5. Ask on the `project mailing list <https://groups.google.com/forum/#!forum/casperjs>`_:

   a. try to post a reproducible, minimal test case
   b. compare casperjs results with native phantomjs ones
   c. if the problem also occurs with native phantomjs, ask on `phantomjs mailing list <https://groups.google.com/forum/#!forum/phantomjs>`_

6. Eventually, `file an issue <https://github.com/n1k0/casperjs/issues/new>`_.


.. index:: Testing

The ``casper.test`` property is undefined, I can't write any test!
------------------------------------------------------------------

That's because as of 1.1, the ``casper.test`` property is only set to a :doc:`Tester <modules/tester>` instance when using the ``casperjs test`` subcommand.

You may want to read the :doc:`testing documentation <testing>` for more information.


.. index:: Code reuse

I keep copy and pasting stuff in my test scripts, that's boring
---------------------------------------------------------------

Have a look at `this gist <https://gist.github.com/3813361>`_, it might help.

Also, don't forget that CasperJS supports a `CommonJS-compliant module pattern <http://wiki.commonjs.org/wiki/Modules/1.1>`_ implementation.

.. note::

    CasperJS' implementation of ``require()`` differs a bit from the one provided by PhantomJS_, but I personnaly never really encountered any functional difference.


.. index:: Versionning

What is the versioning policy of CasperJS?
------------------------------------------

Releases will follow the `SemVer standard <http://semver.org/>`_; they
will be numbered with the follow format:

.. code-block:: text

    <major>.<minor>.<patch>[-<identifier>]

And constructed with the following guidelines:

- Breaking backwards compatibility bumps the major
- New additions without breaking backwards compatibility bumps the minor
- Bug fixes and misc changes bump the patch
- Unstable, special and trunk versions will have a proper identifier


.. index:: jQuery

Can I use jQuery with CasperJS?
-------------------------------

Sure, you can use `jQuery <http://jquery.com/>`_, as every single other javascript library on Earth.

A first solution is to inject it into the remote DOM environment by hand using the standard ``WebPage.injectJs()`` method::

    casper.page.injectJs('/path/to/jquery.js');

If you need jQuery being available everytime, you can also make it being injected in every received response by setting the ``clientScripts`` option of CasperJS::

    var casper = require('casper').create({
        clientScripts: ["includes/jquery.min.js"]
    });

.. note::

   You can't *inject* scripts using the HTTP protocol, you actually have to use a relative/absolute filesystem path to the script resource.


.. index:: Windows, Python, Ruby

Can I use CasperJS without using the ``casperjs`` executable?
-------------------------------------------------------------

Yes, you can call a CasperJS script directly with the ``phantomjs``
executable, but if you do so, you must set the ``phantom.casperPath``
property to the path where the library root is located on your system::

    // casperscript.js
    phantom.casperPath = '/path/to/casperjs';
    phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

    var casper = require('casper').create();
    // ...

You can run such a script like any other standard PhantomJS_ script::

    $ phantomjs casperscript.js

**If you're on Windows**, this is the way you may manage to get casper
working the most easily::

    phantom.casperPath = 'C:\\path\\to\\your\\repo\\lib\\casperjs-0.6.X';
    phantom.injectJs(phantom.casperPath + '\\bin\\bootstrap.js');

    var casper = require('casper').create();

    // do stuff


.. index:: HTTP

How can I catch HTTP 404 and other status codes?
------------------------------------------------

You can define your own `HTTP status
code <http://en.wikipedia.org/wiki/List_of_HTTP_status_codes>`_ handlers
by using the ``httpStatusHandlers`` option of the Casper object. You can
also catch other HTTP status codes as well, as demoed below::

    var casper = require('casper').create();

    casper.on('http.status.404', function(resource) {
        this.echo('wait, this url is 404: ' + resource.url);
    });

    casper.on('http.status.500', function(resource) {
        this.echo('woops, 500 error: ' + resource.url);
    });

    casper.start('http://mywebsite/404', function() {
        this.echo('We suppose this url return an HTTP 404');
    });

    casper.thenOpen('http://mywebsite/500', function() {
        this.echo('We suppose this url return an HTTP 500');
    });

    casper.run(function() {
        this.echo('Done.').exit();
    });

.. hint::

   Check out all the other cool :doc:`events <events-filters>` you may use as well.


.. index:: log, Logging

Where does CasperJS write its logfile?
--------------------------------------

Nowhere. CasperJS doesn't write logs on the filesystem. You have to implement this by yourself if needed.


.. index:: __utils__, AJAX

What's this mysterious ``__utils__`` object?
--------------------------------------------

The ``__utils__`` object is actually a :ref:`ClientUtils object <clientutils_prototype>` which have been automatically injected into the page DOM and is therefore alway available.

So everytime to perform an :ref:`evaluate() <casper_evaluate>` call, you have this instance available to perform common operation like:

- fetching nodes using CSS3 or XPath selectors,
- retrieving information about element properties (attributes, size, bounds, etc.),
- sending AJAX requests,
- triggering DOM events

Check out the :doc:`whole API <modules/clientutils>`. You even have :ref:`a bookmarklet <bookmarklet>` to play around with this ``__utils__`` instance right within your browser console!

.. note::

   You're not obliged at all to use the ``__utils__`` instance in your scripts. It's just there because it's used by CasperJS internals.


.. index:: Step stack, Asynchronicity

How does ``then()`` and the step stack work?
--------------------------------------------

Disclaimer This entry is based on an `answer I made on Stack Overflow <http://stackoverflow.com/a/11957919/330911>`_.

The ``then()`` method basically adds a new navigation step in a stack. A step is a javascript function which can do two different things:

1. waiting for the previous step - if any - being executed
2. waiting for a requested url and related page to load

Let's take a simple navigation scenario::

    var casper = require('casper').create();

    casper.start();

    casper.then(function step1() {
        this.echo('this is step one');
    });

    casper.then(function step2() {
        this.echo('this is step two');
    });

    casper.thenOpen('http://google.com/', function step3() {
        this.echo('this is step 3 (google.com is loaded)');
    });

You can print out all the created steps within the stack like this::

    require('utils').dump(casper.steps.map(function(step) {
        return step.toString();
    }));

That gives::

    $ casperjs test-steps.js
    [
        "function step1() { this.echo('this is step one'); }",
        "function step2() { this.echo('this is step two'); }",
        "function _step() { this.open(location, settings); }",
        "function step3() { this.echo('this is step 3 (google.com is loaded)'); }"
    ]

Notice the ``_step()`` function which has been added automatically by CasperJS to load the url for us; when the url is loaded, the next step available in the stack — which is ``step3()`` — is *then* called.

When you have defined your navigation steps, ``run()`` executes them one by one sequentially::

    casper.run();

.. note:: The callback/listener stuff is an implementation of the `Promise pattern <http://blog.thepete.net/blog/2011/07/02/javascript-promises/>`_.

.. _faq_web_security:

.. index:: Web security, download, CORS

I'm having hard times downloading files using ``download()``
------------------------------------------------------------

You should try to disable `web security`. Using the ``--web-security`` command line option:

.. code-block:: text

    $ casperjs --web-security=no myscript.js

Within code::

    var casper = require('casper').create({
        pageSettings: {
            webSecurityEnabled: false
        }
    });

Or anytime::

    casper.page.settings.webSecurityEnabled = false;

Is it possible to achieve parallel browsing using CasperJS?
-----------------------------------------------------------

`Officially no <https://groups.google.com/d/topic/casperjs/Scx4Cjqp7hE/discussion>`_, but you may want to try.


Can I access & manipulate DOM elements directly from the CasperJS environment?
------------------------------------------------------------------------------

No. Like in PhantomJS, you have to use :ref:`Casper#evaluate() <casper_evaluate>` to access actual page DOM and manipulate elements.

For example, you **can't** do this::

    // this won't work
    casper.then(function() {
        var titleNode = document.querySelector('h1');
        this.echo('Title is: ' + titleNode.textContent);
        titleNode.textContent = 'New title';
        this.echo('Title is now: ' + titleNode.textContent);
    });

You have to use the :ref:`Casper#evaluate() <casper_evaluate>` method in order to communicate with the page DOM::

    // this will
    casper.then(function() {
        var titleText = this.evaluate(function() {
            return document.querySelector('h1').textContent;
        });
        this.echo('Title is: ' + titleText);
        this.evaluate(function() {
            document.querySelector('h1').textContent = 'New title';
        });
        this.echo('Title is now: ' + this.evaluate(function() {
            return document.querySelector('h1').textContent;
        }));
    });

Of course, it's a whole lot more verbose, but Casper provides convenient methods to ease accessing elements properties, eg. :ref:`Casper#fetchText() <casper_fetchtext>` and :ref:`Casper#getElementInfo() <casper_getelementinfo>`::

    // this will
    casper.then(function() {
        this.echo('Title is: ' + this.fetchText('h1'));
        this.evaluate(function() {
            document.querySelector('h1').textContent = 'New title';
        });
        this.echo('Element HTML is now: ' + this.getElementInfo('h1').html);
    });

.. _faq_test_casper_instance:

Why can't I create a new `casper` instance in a test environment?
-----------------------------------------------------------------

The `casperjs test` :ref:`subcommand <test_subcomand>` is a convenient utility which bootstraps and configures a :ref:`test environment <testing>` for you, so a preconfigured `casper` object is already available in your test script when using this command.

As of 1.1-beta3, you're prevented to override this preconfigured instance at this practice prevents the test runner to work properly. If you try to create a new casper instance in a test script, you'll get an error and CasperJS will exit with an error message with a link pointing to the documentation.

One may argue this is mostly related to some hostorical bad design decision, and she might be true. This behavior is not likely exist anymore in a future 2.0.

.. _faq_javascript:

Okay, honestly, I'm stuck with Javascript.
------------------------------------------

Don't worry, you're not alone. Javascript is a great language, but it's far more difficult to master than one might expect at first look.

Here are some great resources to get started efficiently with the language:

- Learn and practice Javascript online at `Code Academy <http://www.codecademy.com/tracks/javascript>`_
- `Eloquent Javascript <http://eloquentjavascript.net/contents.html>`_
- `JavaScript Enlightenment <http://www.javascriptenlightenment.com/JavaScript_Enlightenment.pdf>`_ (PDF)
- last, a `great tutorial on Advanced Javascript Techniques <http://ejohn.org/apps/learn/>`_ by John Resig, the author of jQuery. If you master this one, you're almost done with the language.

.. _PhantomJS: http://phantomjs.org/
.. _Qt: http://qt.digia.com/
.. _WebKit: http://www.webkit.org/
