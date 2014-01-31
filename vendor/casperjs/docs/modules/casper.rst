.. _casper_module:

=====================
The ``casper`` module
=====================

.. index:: Casper

The ``Casper`` class
++++++++++++++++++++

The easiest way to get a casper instance is to use the module's ``create()`` method::

    var casper = require('casper').create();

But you can also retrieve the main Function and instantiate it by yourself::

    var casper = new require('casper').Casper();

.. hint::

   Also, check out :doc:`how to extend Casper with your own methods <../extending>`.

Both the ``Casper`` constructor and the ``create()`` function accept a single ``options`` argument which is a standard javascript object::

    var casper = require('casper').create({
        verbose: true,
        logLevel: "debug"
    });

.. _casper_options:

.. index:: Casper options, options

``Casper.options``
++++++++++++++++++

An ``options`` object can be passed to the ``Casper`` constructor, eg.::

    var casper = require('casper').create({
        clientScripts:  [
            'includes/jquery.js',      // These two scripts will be injected in remote
            'includes/underscore.js'   // DOM on every request
        ],
        pageSettings: {
            loadImages:  false,        // The WebPage instance used by Casper will
            loadPlugins: false         // use these settings
        },
        logLevel: "info",              // Only "info" level messages will be logged
        verbose: true                  // log messages will be printed out to the console
    });

You can also alter options at runtime::

    var casper = require('casper').create();
    casper.options.waitTimeout = 1000;

The whole list of available options is detailed below.

.. index:: Client scripts

.. _casper_option_clientscripts:

``clientScripts``
-------------------------------------------------------------------------------

**Type:** ``Array``

**Default:** ``[]``

A collection of script filepaths to include in every page loaded

.. index:: exit, error

``exitOnError``
-------------------------------------------------------------------------------

**Type:** ``Boolean``

**Default:** ``true``

Sets if CasperJS must exit when an uncaught error has been thrown by the script.

.. index:: HTTP

``httpStatusHandlers``
-------------------------------------------------------------------------------

**Type:** ``Object``

**Default:** ``{}``

A javascript Object containing functions to call when a requested resource has a given HTTP status code. A dedicated sample is provided as an example.

.. index:: Logging

``logLevel``
-------------------------------------------------------------------------------

**Type:** ``String``

**Default:** ``"error"``

Logging level (see the logging section for more information)

``onAlert``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be called when a javascript alert() is triggered

``onDie``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be called when Casper#die() is called

.. index:: error, Error handling

``onError``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be called when an "error" level event occurs

.. index:: error, Error handling

``onLoadError``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be called when a requested resource cannot be loaded

``onPageInitialized``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be called after ``WebPage`` instance has been initialized

.. index:: HTTP

``onResourceReceived``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

Proxy method for PhantomJS' ``WebPage#onResourceReceived()`` callback, but the current Casper instance is passed as first argument.

.. index:: HTTP

``onResourceRequested``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

Proxy method for PhantomJS' WebPage#onResourceRequested() callback, but the current Casper instance is passed as first argument.

.. index:: Step stack

``onStepComplete``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``null``

A function to be executed when a step function execution is finished.

.. index:: Step stack, Error handling, timeout

``onStepTimeout``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``Function``

A function to be executed when a step function execution time exceeds the value of the stepTimeout option, if any has been set.

By default, on timeout the script will exit displaying an error, except in test environment where it will just add a failure to the suite results.

.. index:: Error handling, timeout

``onTimeout``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``Function``

A function to be executed when script execution time exceeds the value of the timeout option, if any has been set.

By default, on timeout the script will exit displaying an error, except in test environment where it will just add a failure to the suite results.

.. index:: Error handling, timeout

``onWaitTimeout``
-------------------------------------------------------------------------------

**Type:** ``Function``

**Default:** ``Function``

A function to be executed when a ``waitFor*`` function execution time exceeds the value of the waitTimeout option, if any has been set.

By default, on timeout the script will exit displaying an error, except in test environment where it will just add a failure to the suite results.

``page``
-------------------------------------------------------------------------------

**Type:** ``WebPage``

**Default:** ``null``

An existing PhantomJS ``WebPage`` instance

.. index:: settings, PhantomJS, SSL, auth, XSS

``pageSettings``
-------------------------------------------------------------------------------

**Type:** ``Object``

**Default:** ``{}``

PhantomJS's WebPage settings object. Available settings are:

- ``javascriptEnabled`` defines whether to execute the script in the page or not (default to ``true``)
- ``loadImages`` defines whether to load the inlined images or not
- ``loadPlugins`` defines whether to load NPAPI plugins (Flash, Silverlight, …) or not
- ``localToRemoteUrlAccessEnabled`` defines whether local resource (e.g. from file) can access remote URLs or not (default to ``false``)
- ``userAgent`` defines the user agent sent to server when the web page requests resources
- ``userName`` sets the user name used for HTTP authentication
- ``password`` sets the password used for HTTP authentication
- ``XSSAuditingEnabled`` defines whether load requests should be monitored for cross-site scripting attempts (default to ``false``)

.. index:: Remote scripts

``remoteScripts``
-------------------------------------------------------------------------------

**Type:** ``Array``

**Default:** ``[]``

.. versionadded:: 1.0

A collection of remote script urls to include in every page loaded

.. index:: Logging

``safeLogs``
-------------------------------------------------------------------------------

**Type:** ``Boolean``

**Default:** ``true``

.. versionadded:: 1.0

When this option is set to true — which is the default, any password information entered in <input type="password"> will be obfuscated in log messages. Set safeLogs to false to disclose passwords in plain text (not recommended).

.. index:: Step stack, timeout

``silentErrors``
-------------------------------------------------------------------------------

**Type:** ``Boolean``

**Default:** ``false``

When this option is enabled, caught step errors are not thrown (though related events are still emitted). Mostly used internally in a testing context.

.. index:: timeout

``stepTimeout``
-------------------------------------------------------------------------------

**Type:** ``Number``

**Default:** ``null``

Max step timeout in milliseconds; when set, every defined step function will have to execute before this timeout value has been reached. You can define the onStepTimeout() callback to catch such a case. By default, the script will die() with an error message.

.. index:: timeout

``timeout``
-------------------------------------------------------------------------------

**Type:** ``Number``

**Default:** ``null``

Max timeout in milliseconds

.. index:: verbose

``verbose``
-------------------------------------------------------------------------------

**Type:** ``Boolean``

**Default:** ``false``

Realtime output of log messages

.. index:: viewport

``viewportSize``
-------------------------------------------------------------------------------

**Type:** ``Object``

**Default:** ``null``

Viewport size, eg. ``{width: 800, height: 600}``

.. note::

   PhantomJS ships with a default viewport of 400x300, and CasperJS won't override it by default.

.. index:: timeout

``retryTimeout``
-------------------------------------------------------------------------------

**Type:** ``Number``

**Default:** ``100``

Default delay between attempts, for ``wait*`` family functions.

``waitTimeout``
-------------------------------------------------------------------------------

**Type:** ``Number``

**Default:** ``5000``

Default wait timeout, for ``wait*`` family functions.


``Casper`` prototype
++++++++++++++++++++

``back()``
-------------------------------------------------------------------------------

**Signature:** ``back()``

Moves back a step in browser's history::

    casper.start('http://foo.bar/1')
    casper.thenOpen('http://foo.bar/2');
    casper.thenOpen('http://foo.bar/3');
    casper.back();
    casper.run(function() {
        console.log(this.getCurrentUrl()); // 'http://foo.bar/2'
    });

Also have a look at `forward()`_.

.. _casper_base64encode:

.. index:: Base64

``base64encode()``
-------------------------------------------------------------------------------

**Signature:** ``base64encode(String url [, String method, Object data])``

Encodes a resource using the base64 algorithm synchronously using
client-side XMLHttpRequest.

.. note::

   We cannot use ``window.btoa()`` because it fails miserably in the version of WebKit shipping with PhantomJS.

Example: retrieving google logo image encoded in base64::

    var base64logo = null;
    casper.start('http://www.google.fr/', function() {
        base64logo = this.base64encode('http://www.google.fr/images/srpr/logo3w.png');
    });

    casper.run(function() {
        this.echo(base64logo).exit();
    });

You can also perform an HTTP POST request to retrieve the contents to
encode::

    var base64contents = null;
    casper.start('http://domain.tld/download.html', function() {
        base64contents = this.base64encode('http://domain.tld/', 'POST', {
            param1: 'foo',
            param2: 'bar'
        });
    });

    casper.run(function() {
        this.echo(base64contents).exit();
    });

.. index:: bypass, Step stack

``bypass()``
-------------------------------------------------------------------------------

**Signature:** ``bypass(Numbr nb)``

.. versionadded:: 1.1

Bypasses a given number of defined navigation steps::

    casper.start();
    casper.then(function() {
        // This step will be executed
    });
    casper.then(function() {
        this.bypass(2);
    });
    casper.then(function() {
        // This test won't be executed
    });
    casper.then(function() {
        // Nor this one
    });
    casper.run();

.. _casper_click:

.. index:: click

``click()``
-------------------------------------------------------------------------------

**Signature:** ``click(String selector)``

Performs a click on the element matching the provided :doc:`selector expression <../selectors>`. The method tries two strategies sequentially:

1. trying to trigger a MouseEvent in Javascript
2. using native QtWebKit event if the previous attempt failed

Example::

    casper.start('http://google.fr/');

    casper.thenEvaluate(function(term) {
        document.querySelector('input[name="q"]').setAttribute('value', term);
        document.querySelector('form[name="f"]').submit();
    }, 'CasperJS');

    casper.then(function() {
        // Click on 1st result link
        this.click('h3.r a');
    });

    casper.then(function() {
        console.log('clicked ok, new location is ' + this.getCurrentUrl());
    });

    casper.run();

.. index:: click

``clickLabel()``
-------------------------------------------------------------------------------

**Signature:** ``clickLabel(String label[, String tag])``

.. versionadded:: 0.6.1

Clicks on the first DOM element found containing ``label`` text. Optionaly ensures that the element node name is ``tag``::

    // <a href="...">My link is beautiful</a>
    casper.then(function() {
        this.clickLabel('My link is beautiful', 'a');
    });

    // <button type="submit">But my button is sexier</button>
    casper.then(function() {
        this.clickLabel('But my button is sexier', 'button');
    });

.. index:: screenshot

``capture()``
-------------------------------------------------------------------------------

**Signature:** ``capture(String targetFilepath, [Object clipRect, Object imgOptions])``

Proxy method for PhantomJS' ``WebPage#render``. Adds a ``clipRect`` parameter for automatically setting page ``clipRect`` setting and reverts it back once done::

    casper.start('http://www.google.fr/', function() {
        this.capture('google.png', {
            top: 100,
            left: 100,
            width: 500,
            height: 400
        });
    });

    casper.run();

.. versionadded:: 1.1

The ``imgOptions`` object allows to specify two options:

- ``format`` to set the image format manually, avoiding relying on the filename
- ``quality`` to set the image quality, from 1 to 100

Example::

    casper.start('http://foo', function() {
        this.capture('foo', undefined, {
            format: 'jpg',
            quality: 75
        });
    });

.. index:: screenshot, Base64

``captureBase64()``
-------------------------------------------------------------------------------

**Signature:** ``captureBase64(String format[, Mixed area])``

.. versionadded:: 0.6.5

Computes the `Base64 <http://en.wikipedia.org/wiki/Base64>`_ representation of a binary image capture of the current page, or an area within the page, in a given format.

Supported image formats are ``bmp``, ``jpg``, ``jpeg``, ``png``, ``ppm``, ``tiff``, ``xbm`` and ``xpm``.

The ``area`` argument can be either of the following types:

- ``String``: area is a CSS3 selector string, eg. ``div#plop form[name="form"] input[type="submit"]``
- ``clipRect``: area is a clipRect object, eg. ``{"top":0,"left":0,"width":320,"height":200}``
- ``Object``: area is a :doc:`selector object <../selectors>`, eg. an XPath selector

Example::

    casper.start('http://google.com', function() {
        // selector capture
        console.log(this.captureBase64('png', '#lga'));
        // clipRect capture
        console.log(this.captureBase64('png', {
            top: 0,
            left: 0,
            width: 320,
            height: 200
        }));
        // whole page capture
        console.log(this.captureBase64('png'));
    });

    casper.run();

.. _casper_captureselector:

.. index:: screenshot

``captureSelector()``
-------------------------------------------------------------------------------

**Signature:** ``captureSelector(String targetFile, String selector [, Object imgOptions])``

Captures the page area containing the provided selector and saves it to ``targetFile``::

    casper.start('http://www.weather.com/', function() {
        this.captureSelector('weather.png', '#wx-main');
    });

    casper.run();

.. versionadded:: 1.1

The ``imgOptions`` object allows to specify two options:

- ``format`` to set the image format manually, avoiding relying on the target filename
- ``quality`` to set the image quality, from 1 to 100

``clear()``
-------------------------------------------------------------------------------

**Signature:** ``clear()``

.. versionadded:: 0.6.5

Clears the current page execution environment context. Useful to avoid having previously loaded DOM contents being still active.

Think of it as a way to stop javascript execution within the remote DOM environment::

    casper.start('http://www.google.fr/', function() {
        this.clear(); // javascript execution in this page has been stopped
    });

    casper.then(function() {
        // ...
    });

    casper.run();

.. index:: Debugging

``debugHTML()``
-------------------------------------------------------------------------------

**Signature:** ``debugHTML([String selector, Boolean outer])``

Outputs the results of `getHTML()`_ directly to the console. It takes the same arguments as ``getHTML()``.

.. index:: Debugging

``debugPage()``
-------------------------------------------------------------------------------

**Signature:** ``debugPage()``

Logs the textual contents of the current page directly to the standard output, for debugging purpose::

    casper.start('http://www.google.fr/', function() {
        this.debugPage();
    });

    casper.run();

``die()``
-------------------------------------------------------------------------------

**Signature:** ``die(String message[, int status])``

Exits phantom with a logged error message and an optional exit status code::

    casper.start('http://www.google.fr/', function() {
        this.die("Fail.", 1);
    });

    casper.run();

.. _casper_download:

.. index:: download

``download()``
-------------------------------------------------------------------------------

**Signature:** ``download(String url, String target[, String method, Object data])``

Saves a remote resource onto the filesystem. You can optionally set the HTTP method using the ``method`` argument, and pass request arguments through the ``data`` object (see `base64encode()`_)::

    casper.start('http://www.google.fr/', function() {
        var url = 'http://www.google.fr/intl/fr/about/corporate/company/';
        this.download(url, 'google_company.html');
    });

    casper.run(function() {
        this.echo('Done.').exit();
    });

.. note::

   If you have some troubles downloading files, try to :ref:`disable web security <faq_web_security>`.

``each()``
-------------------------------------------------------------------------------

**Signature:** ``each(Array array, Function fn)``

Iterates over provided array items and execute a callback::

    var links = [
        'http://google.com/',
        'http://yahoo.com/',
        'http://bing.com/'
    ];

    casper.start().each(links, function(self, link) {
        self.thenOpen(link, function() {
            this.echo(this.getTitle());
        });
    });

    casper.run();

.. hint::

   Have a look at the `googlematch.js <https://github.com/n1k0/casperjs/blob/master/samples/googlematch.js>`_ sample script for a concrete use case.

``eachThen()``
-------------------------------------------------------------------------------

**Signature:** ``eachThen(Array array, Function then)``

.. versionadded:: 1.1

Iterates over provided array items and adds a step to the stack with current data attached to it::

    casper.start().eachThen([1, 2, 3], function(response) {
        this.echo(response.data);
    }).run();

Here's an example for opening an array of urls::

    var casper = require('casper').create();
    var urls = ['http://google.com/', 'http://yahoo.com/'];

    casper.start().eachThen(urls, function(response) {
      this.thenOpen(response.data, function(response) {
        console.log('Opened', response.url);
      });
    });

    casper.run();

.. note::

   Current item will be stored in the ``response.data`` property.

.. _casper_echo:

.. index:: echo, Printing

``echo()``
-------------------------------------------------------------------------------

**Signature:** ``echo(String message[, String style])``

Prints something to stdout, optionally with some fancy color (see the :ref:`colorizer module <colorizer_module>` for more information)::

    casper.start('http://www.google.fr/', function() {
        this.echo('Page title is: ' + this.evaluate(function() {
            return document.title;
        }), 'INFO'); // Will be printed in green on the console
    });

    casper.run();

.. index:: evaluate, DOM

.. _casper_evaluate:

``evaluate()``
-------------------------------------------------------------------------------

**Signature:** ``evaluate(Function fn[, arg1[, arg2[, …]]])``

Basically `PhantomJS' WebPage#evaluate <https://github.com/ariya/phantomjs/wiki/API-Reference#wiki-webpage-evaluate>`_ equivalent. Evaluates an expression **in the current page DOM context**::

    casper.evaluate(function(username, password) {
        document.querySelector('#username').value = username;
        document.querySelector('#password').value = password;
        document.querySelector('#submit').click();
    }, 'sheldon.cooper', 'b4z1ng4');

.. note::

   For filling and submitting forms, rather use the `fill()`_ method.

.. warning::

   The pre-1.0 way of passing arguments using an object has been kept for BC purpose, though it may `not work in some case <https://github.com/n1k0/casperjs/issues/349>`_; so you're encouraged to use the method described above.

.. topic:: Understanding ``evaluate()``

   The concept behind this method is probably the most difficult to understand when discovering CasperJS. As a reminder, think of the ``evaluate()`` method as a *gate* between the CasperJS environment and the one of the page you have opened; everytime you pass a closure to ``evaluate()``, you're entering the page and execute code as if you were using the browser console.

   Here's a quickly drafted diagram trying to basically explain the separation of concerns:

   .. figure:: ../_static/images/evaluate-diagram.png
      :align: center

``evaluateOrDie()``
-------------------------------------------------------------------------------

**Signature:** ``evaluateOrDie(Function fn[, String message])``

Evaluates an expression within the current page DOM and ``die()`` if it returns anything but ``true``::

    casper.start('http://foo.bar/home', function() {
        this.evaluateOrDie(function() {
            return /logged in/.match(document.title);
        }, 'not authenticated');
    });

    casper.run();

.. index:: exit

``exit()``
-------------------------------------------------------------------------------

**Signature:** ``exit([int status])``

Exits PhantomJS with an optional exit status code.

.. index:: DOM

``exists()``
-------------------------------------------------------------------------------

**Signature:** ``exists(String selector)``

Checks if any element within remote DOM matches the provided :doc:`selector <../selectors>`::

    casper.start('http://foo.bar/home', function() {
        if (this.exists('#my_super_id')) {
            this.echo('found #my_super_id', 'INFO');
        } else {
            this.echo('#my_super_id not found', 'ERROR');
        }
    });

    casper.run();

.. _casper_fetchtext:

``fetchText()``
-------------------------------------------------------------------------------

**Signature:** ``fetchText(String selector)``

Retrieves text contents matching a given :doc:`selector expression <../selectors>`. If you provide one matching more than one element, their textual contents will be concatenated::

    casper.start('http://google.com/search?q=foo', function() {
        this.echo(this.fetchText('h3'));
    }).run();

``forward()``
-------------------------------------------------------------------------------

**Signature:** ``forward()``

Moves a step forward in browser's history::

    casper.start('http://foo.bar/1')
    casper.thenOpen('http://foo.bar/2');
    casper.thenOpen('http://foo.bar/3');
    casper.back();    // http://foo.bar/2
    casper.back();    // http://foo.bar/1
    casper.forward(); // http://foo.bar/2
    casper.run();

Also have a look at `back()`_.

.. _casper_log:

.. index:: Logging

``log()``
-------------------------------------------------------------------------------

**Signature:** ``log(String message[, String level, String space])``

Logs a message with an optional level in an optional space. Available levels are ``debug``, ``info``, ``warning`` and ``error``. A space is a kind of namespace you can set for filtering your logs. By default, Casper logs messages in two distinct spaces: ``phantom`` and ``remote``, to distinguish what happens in the PhantomJS environment from the remote one::

    casper.start('http://www.google.fr/', function() {
        this.log("I'm logging an error", "error");
    });

    casper.run();

.. _casper_fill:

.. index:: Form

``fill()``
-------------------------------------------------------------------------------

**Signature:** ``fill(String selector, Object values[, Boolean submit])``

Fills the fields of a form with given values and optionally submits it. Fields
are referenced by their ``name`` attribute.

.. versionchanged:: 1.1 To use :doc:`CSS3 or XPath selectors <../selectors>` instead, check the `fillSelectors()`_ and `fillXPath()`_ methods.

Example with this sample html form:

.. code-block :: html

    <form action="/contact" id="contact-form" enctype="multipart/form-data">
        <input type="text" name="subject"/>
        <textearea name="content"></textearea>
        <input type="radio" name="civility" value="Mr"/> Mr
        <input type="radio" name="civility" value="Mrs"/> Mrs
        <input type="text" name="name"/>
        <input type="email" name="email"/>
        <input type="file" name="attachment"/>
        <input type="checkbox" name="cc"/> Receive a copy
        <input type="submit"/>
    </form>

A script to fill and submit this form::

    casper.start('http://some.tld/contact.form', function() {
        this.fill('form#contact-form', {
            'subject':    'I am watching you',
            'content':    'So be careful.',
            'civility':   'Mr',
            'name':       'Chuck Norris',
            'email':      'chuck@norris.com',
            'cc':         true,
            'attachment': '/Users/chuck/roundhousekick.doc'
        }, true);
    });

    casper.then(function() {
        this.evaluateOrDie(function() {
            return /message sent/.test(document.body.innerText);
        }, 'sending message failed');
    });

    casper.run(function() {
        this.echo('message sent').exit();
    });

.. warning::

   1. The ``fill()`` method currently can't fill **file fields using XPath selectors**; PhantomJS natively only allows the use of CSS3 selectors in its ``uploadFile()`` method, hence this limitation.
   2. Please Don't use CasperJS nor PhantomJS to send spam, or I'll be calling the Chuck. More seriously, please just don't.

``fillSelectors()``
-------------------------------------------------------------------------------

**Signature:** ``fillSelectors(String selector, Object values[, Boolean submit])``

.. versionadded:: 1.1

Fills form fields with given values and optionally submits it. Fields
are referenced by ``CSS3`` selectors::

    casper.start('http://some.tld/contact.form', function() {
        this.fillSelectors('form#contact-form', {
            'input[name="subject"]':    'I am watching you',
            'input[name="content"]':    'So be careful.',
            'input[name="civility"]':   'Mr',
            'input[name="name"]':       'Chuck Norris',
            'input[name="email"]':      'chuck@norris.com',
            'input[name="cc"]':         true,
            'input[name="attachment"]': '/Users/chuck/roundhousekick.doc'
        }, true);
    });


``fillXPath()``
-------------------------------------------------------------------------------

**Signature:** ``fillXPath(String selector, Object values[, Boolean submit])``

.. versionadded:: 1.1

Fills form fields with given values and optionally submits it. While the ``form`` element is always referenced by a CSS3 selector, fields are referenced by ``XPath`` selectors::

    casper.start('http://some.tld/contact.form', function() {
        this.fillXPath('form#contact-form', {
            '//input[@name="subject"]':    'I am watching you',
            '//input[@name="content"]':    'So be careful.',
            '//input[@name="civility"]':   'Mr',
            '//input[@name="name"]':       'Chuck Norris',
            '//input[@name="email"]':      'chuck@norris.com',
            '//input[@name="cc"]':         true,
        }, true);
    });

.. warning::

   The ``fillXPath()`` method currently can't fill **file fields using XPath selectors**; PhantomJS natively only allows the use of CSS3 selectors in its ``uploadFile()`` method, hence this limitation.

.. index:: URL

``getCurrentUrl()``
-------------------------------------------------------------------------------

**Signature:** ``getCurrentUrl()``

Retrieves current page URL. Note that the url will be url-decoded::

    casper.start('http://www.google.fr/', function() {
        this.echo(this.getCurrentUrl()); // "http://www.google.fr/"
    });

    casper.run();

.. index:: DOM

``getElementAttribute()``
-------------------------------------------------------------------------------

**Signature:** ``getElementAttribute(String selector, String attribute)``

.. versionadded:: 1.0

Retrieves the value of an attribute on the first element matching the provided :doc:`selector <../selectors>`::

    var casper = require('casper').create();

    casper.start('http://www.google.fr/', function() {
        require('utils').dump(this.getElementAttribute('div[title="Google"]', 'title')); // "Google"
    });

    casper.run();

.. index:: DOM

``getElementsAttribute()``
-------------------------------------------------------------------------------

**Signature:** ``getElementsAttribute(String selector, String attribute)``

.. versionadded:: 1.1

Retrieves the values of an attribute on each element matching the provided :doc:`selector <../selectors>`::

    var casper = require('casper').create();

    casper.start('http://www.google.fr/', function() {
        require('utils').dump(this.getElementsAttribute('div[title="Google"]', 'title')); // "['Google']"
    });

    casper.run();

.. index:: DOM

``getElementBounds()``
-------------------------------------------------------------------------------

**Signature:** ``getElementBounds(String selector)``

Retrieves boundaries for a DOM element matching the provided :doc:`selector <../selectors>`.

It returns an Object with four keys: ``top``, ``left``, ``width`` and ``height``, or ``null`` if the selector doesn't exist::

    var casper = require('casper').create();

    casper.start('http://www.google.fr/', function() {
        require('utils').dump(this.getElementBounds('div[title="Google"]'));
    });

    casper.run();

This will output something like::

    {
        "height": 95,
        "left": 352,
        "top": 16,
        "width": 275
    }

.. index:: DOM

``getElementsBounds()``
-------------------------------------------------------------------------------

**Signature:** ``getElementsBounds(String selector)``

.. versionadded:: 1.0

Retrieves a list of boundaries for all DOM elements matching the provided :doc:`selector <../selectors>`.

It returns an array of objects with four keys: ``top``, ``left``, ``width`` and ``height`` (see `getElementBounds()`_).

.. _casper_getelementinfo:

.. index:: DOM

``getElementInfo()``
-------------------------------------------------------------------------------

**Signature:** ``getElementInfo(String selector)``

.. versionadded:: 1.0

Retrieves information about the first element matching the provided :doc:`selector <../selectors>`::

    casper.start('http://google.fr/', function() {
        require('utils').dump(this.getElementInfo('#hplogo'));
    });

Gives something like::

    {
        "attributes": {
            "align": "left",
            "dir": "ltr",
            "id": "hplogo",
            "onload": "window.lol&&lol()",
            "style": "height:110px;width:276px;background:url(/images/srpr/logo1w.png) no-repeat",
            "title": "Google"
        },
        "height": 110,
        "html": "<div nowrap=\"nowrap\" style=\"color:#777;font-size:16px;font-weight:bold;position:relative;left:214px;top:70px\">France</div>",
        "nodeName": "div",
        "tag": "<div dir=\"ltr\" title=\"Google\" align=\"left\" id=\"hplogo\" onload=\"window.lol&amp;&amp;lol()\" style=\"height:110px;width:276px;background:url(/images/srpr/logo1w.png) no-repeat\"><div nowrap=\"nowrap\" style=\"color:#777;font-size:16px;font-weight:bold;position:relative;left:214px;top:70px\">France</div></div>",
        "text": "France\n",
        "visible": true,
        "width": 276,
        "x": 62,
        "y": 76
    }

.. index:: DOM

``getElementsInfo()``
-------------------------------------------------------------------------------

**Signature:** ``getElementsInfo(String selector)``

.. versionadded:: 1.1

Retrieves information about all elements matching the provided :doc:`selector <../selectors>`::

    casper.start('http://google.fr/', function() {
        require('utils').dump(this.getElementsInfo('#hplogo'));
    });

Gives something like::

    [
        {
            "attributes": {
                "align": "left",
                "dir": "ltr",
                "id": "hplogo",
                "onload": "window.lol&&lol()",
                "style": "height:110px;width:276px;background:url(/images/srpr/logo1w.png) no-repeat",
                "title": "Google"
            },
            "height": 110,
            "html": "<div nowrap=\"nowrap\" style=\"color:#777;font-size:16px;font-weight:bold;position:relative;left:214px;top:70px\">France</div>",
            "nodeName": "div",
            "tag": "<div dir=\"ltr\" title=\"Google\" align=\"left\" id=\"hplogo\" onload=\"window.lol&amp;&amp;lol()\" style=\"height:110px;width:276px;background:url(/images/srpr/logo1w.png) no-repeat\"><div nowrap=\"nowrap\" style=\"color:#777;font-size:16px;font-weight:bold;position:relative;left:214px;top:70px\">France</div></div>",
            "text": "France\n",
            "visible": true,
            "width": 276,
            "x": 62,
            "y": 76
        }
    ]

.. index:: Form

``getFormValues()``
-------------------------------------------------------------------------------

**Signature:** ``getFormValues(String selector)``

.. versionadded:: 1.0

Retrieves a given form all of its field values::

    casper.start('http://www.google.fr/', function() {
        this.fill('form', {q: 'plop'}, false);
        this.echo(this.getFormValues('form').q); // 'plop'
    });

    casper.run();

.. index:: Globals, window

``getGlobal()``
-------------------------------------------------------------------------------

**Signature:** ``getGlobal(String name)``

Retrieves a global variable value within the remote DOM environment by its name. Basically, ``getGlobal('foo')`` will retrieve the value of ``window.foo`` from the page::

    casper.start('http://www.google.fr/', function() {
        this.echo(this.getGlobal('innerWidth')); // 1024
    });

    casper.run();

.. index:: Debugging

``getHTML()``
-------------------------------------------------------------------------------

**Signature:** ``getHTML([String selector, Boolean outer])``

.. versionadded:: 1.0

Retrieves HTML code from the current page. By default, it outputs the whole page HTML contents::

    casper.start('http://www.google.fr/', function() {
        this.echo(this.getHTML());
    });

    casper.run();

The ``getHTML()`` method can also dump HTML contents matching a given :doc:`selector <../selectors>`; for example with this HTML code:

.. code-block:: html

    <html>
        <body>
            <h1 id="foobar">Plop</h1>
        </body>
    </html>

You can fetch those contents using::

    casper.start('http://www.site.tld/', function() {
        this.echo(this.getHTML('h1#foobar')); // => 'Plop'
    });

The ``outer`` argument allows to retrieve the outer HTML contents of the matching element::

    casper.start('http://www.site.tld/', function() {
        this.echo(this.getHTML('h1#foobar', true)); // => '<h1 id="foobar">Plop</h1>'
    });

``getPageContent()``
-------------------------------------------------------------------------------

**Signature:** ``getPageContent()``

.. versionadded:: 1.0

Retrieves current page contents, dealing with exotic other content types than HTML::

    var casper = require('casper').create();

    casper.start().then(function() {
        this.open('http://search.twitter.com/search.json?q=casperjs', {
            method: 'get',
            headers: {
                'Accept': 'application/json'
            }
        });
    });

    casper.run(function() {
        require('utils').dump(JSON.parse(this.getPageContent()));
        this.exit();
    });

.. index:: DOM

``getTitle()``
-------------------------------------------------------------------------------

**Signature:** ``getTitle()``

Retrieves current page title::

    casper.start('http://www.google.fr/', function() {
        this.echo(this.getTitle()); // "Google"
    });

    casper.run();

.. _casper_mouseevent:

.. index:: events

``mouseEvent()``
-------------------------------------------------------------------------------

**Signature:** ``mouseEvent(String type, String selector)``

.. versionadded:: 0.6.9

Triggers a mouse event on the first element found matching the provided selector.

Supported events are ``mouseup``, ``mousedown``, ``click``, ``mousemove``, ``mouseover`` and ``mouseout``::

    casper.start('http://www.google.fr/', function() {
        this.mouseEvent('click', 'h2 a');
    });

    casper.run();

.. index:: HTTP, HTTP Request, HTTP Method, HTTP Headers

``open()``
-------------------------------------------------------------------------------

**Signature:** ``open(String location, Object Settings)``

Performs an HTTP request for opening a given location. You can forge ``GET``, ``POST``, ``PUT``, ``DELETE`` and ``HEAD`` requests.

Example for a standard ``GET`` request::

    casper.start();

    casper.open('http://www.google.com/').then(function() {
        this.echo('GOT it.');
    });

    casper.run();

Example for a ``POST`` request::

    casper.start();

    casper.open('http://some.testserver.com/post.php', {
        method: 'post',
        data:   {
            'title': 'Plop',
            'body':  'Wow.'
        }
    });

    casper.then(function() {
        this.echo('POSTED it.');
    });

    casper.run();

To pass nested parameters arrays::

    casper.open('http://some.testserver.com/post.php', {
           method: 'post',
           data: {
                'standard_param': 'foo',
                'nested_param[]': [       // please note the use of square brackets!
                    'Something',
                    'Something else'
                ]
           }
    });

.. versionadded:: 1.0

You can also set custom request headers to send when performing an outgoing request, passing the ``headers`` option::

    casper.open('http://some.testserver.com/post.php', {
        method: 'post',
        data:   {
            'title': 'Plop',
            'body':  'Wow.'
        },
        headers: {
            'Accept-Language': 'fr,fr-fr;q=0.8,en-us;q=0.5,en;q=0.3'
        }
    });

``reload()``
-------------------------------------------------------------------------------

**Signature:** ``reload([Function then])``

.. versionadded:: 1.0

Reloads current page location::

    casper.start('http://google.com', function() {
        this.echo("loaded");
        this.reload(function() {
            this.echo("loaded again");
        });
    });

    casper.run();

``repeat()``
-------------------------------------------------------------------------------

**Signature:** ``repeat(int times, Function then)``

Repeats a navigation step a given number of times::

    casper.start().repeat(3, function() {
        this.echo("Badger");
    });

    casper.run();

.. _casper_resourceexists:

.. index:: HTTP

``resourceExists()``
-------------------------------------------------------------------------------

**Signature:** ``resourceExists(String|Function|RegExp test)``

Checks if a resource has been loaded. You can pass either a function, a string or a ``RegExp`` instance to perform the test::

    casper.start('http://www.google.com/', function() {
        if (this.resourceExists('logo3w.png')) {
            this.echo('Google logo loaded');
        } else {
            this.echo('Google logo not loaded', 'ERROR');
        }
    });

    casper.run();

.. note::

   If you want to wait for a resource to be loaded, use the `waitForResource()`_ method.

.. index:: Step stack, run

``run()``
-------------------------------------------------------------------------------

**Signature:** ``run(fn onComplete[, int time])``

Runs the whole suite of steps and optionally executes a callback when they've all been done. Obviously, **calling this method is mandatory** in order to run the Casper navigation suite.

Casper suite **won't run**::

    casper.start('http://foo.bar/home', function() {
        // ...
    });

    // hey, it's missing .run() here!

Casper suite **will run**::

    casper.start('http://foo.bar/home', function() {
        // ...
    });

    casper.run();

``Casper.run()`` also accepts an ``onComplete`` callback, which you can consider as a custom final step to perform when all the other steps have been executed. Just don't forget to ``exit()`` Casper if you define one!::

    casper.start('http://foo.bar/home', function() {
        // ...
    });

    casper.then(function() {
        // ...
    });

    casper.run(function() {
        this.echo('So the whole suite ended.');
        this.exit(); // <--- don't forget me!
    });

Binding a callback to ``complete.error`` will trigger when the ``onComplete`` callback fails.

.. index:: Scroll

``scrollTo()``
-------------------------------------------------------------------------------

**Signature:** ``scrollTo(Number x, Number y)``

.. versionadded:: 1.1-beta3

Scrolls current document to the coordinates defined by the value of ``x`` and ``y``::

    casper.start('http://foo.bar/home', function() {
        this.scrollTo(500, 300);
    });

.. note:: This operation is synchronous.

.. index:: Scroll

``scrollToBottom()``
-------------------------------------------------------------------------------

**Signature:** ``scrollToBottom()``

.. versionadded:: 1.1-beta3

Scrolls current document to its bottom::

    casper.start('http://foo.bar/home', function() {
        this.scrollToBottom();
    });

.. note:: This operation is synchronous.

.. index:: Form

``sendKeys()``
-------------------------------------------------------------------------------

**Signature:** ``sendKeys(Selector selector, String keys[, Object options])``

.. versionadded:: 1.0

Sends native keyboard events to the element matching the provided :doc:`selector <../selectors>`::

    casper.then(function() {
        this.sendKeys('form.contact input#name', 'Duke');
        this.sendKeys('form.contact textarea#message', "Damn, I'm looking good.");
        this.click('form.contact input[type="submit"]');
    });

.. versionadded:: 1.1

The currently supported HTMLElements that can receive keyboard events from ``sendKeys`` are ``<input>``, ``<textarea>``, and any HTMLElement with attribute ``contenteditable="true"``.

Options
~~~~~~~

- ``(Boolean) reset``:

  .. versionadded:: 1.1-beta3

  When set to ``true``, this option will first empty the current field value. By default, it's set to ``false`` and ``sendKeys()`` will just append string to the current field value.

- ``(Boolean) keepFocus``:

  ``sendKeys()`` by default will remove the focus on text input fields, which   will typically close autocomplete widgets. If you want to maintain focus, use   the ``keepFocus`` option. For example, if using jQuery-UI, you can click on   the first autocomplete suggestion using::

      casper.then(function() {
          this.sendKeys('form.contact input#name', 'action', {keepFocus: true});
          this.click('form.contact ul.ui-autocomplete li.ui-menu-item:first-  child a');
      });

- ``(String) modifiers``:

  ``sendKeys()`` accepts a ``modifiers`` option to support key modifiers. The   options is a string representing the composition of modifiers to use,   separated by the ``+`` character::

      casper.then(function() {
          this.sendKeys('document', 's', {modifiers: 'ctrl+alt+shift'});
      });

  Available modifiers are:

  - ``ctrl``
  - ``alt``
  - ``shift``
  - ``meta``
  - ``keypad``


.. index:: auth

``setHttpAuth()``
-------------------------------------------------------------------------------

**Signature:** ``setHttpAuth(String username, String password)``

Sets ``HTTP_AUTH_USER`` and ``HTTP_AUTH_PW`` values for HTTP based authentication systems::

    casper.start();

    casper.setHttpAuth('sheldon.cooper', 'b4z1ng4');

    casper.thenOpen('http://password-protected.domain.tld/', function() {
        this.echo("I'm in. Bazinga.");
    })
    casper.run();

Of course you can directly pass the auth string in the url to open::

    var url = 'http://sheldon.cooper:b4z1ng4@password-protected.domain.tld/';

    casper.start(url, function() {
        this.echo("I'm in. Bazinga.");
    })

    casper.run();

.. index:: start, initialization

``start()``
-------------------------------------------------------------------------------

**Signature:** ``start(String url[, Function then])``

Configures and starts Casper, then open the provided ``url`` and optionally adds the step provided by the ``then`` argument::

    casper.start('http://google.fr/', function() {
        this.echo("I'm loaded.");
    });

    casper.run();

Alternatively::

    casper.start('http://google.fr/');

    casper.then(function() {
        this.echo("I'm loaded.");
    });

    casper.run();

Or alternatively::

    casper.start('http://google.fr/');

    casper.then(function() {
        casper.echo("I'm loaded.");
    });

    casper.run();

Matter of taste!

.. note::

   You must call the ``start()`` method in order to be able to add navigation steps and run the suite. If you don't you'll get an error message inviting you to do so anyway.

``status()``
-------------------------------------------------------------------------------

**Signature:** ``status(Boolean asString)``

.. versionadded:: 1.0

Returns the status of current Casper instance::

    casper.start('http://google.fr/', function() {
        this.echo(this.status(true));
    });

    casper.run();

.. index:: Step stack, Asynchronicity

``then()``
-------------------------------------------------------------------------------

**Signature:** ``then(Function then)``

This method is the standard way to add a new navigation step to the stack, by providing a simple function::

    casper.start('http://google.fr/');

    casper.then(function() {
        this.echo("I'm in your google.");
    });

    casper.then(function() {
        this.echo('Now, let me write something');
    });

    casper.then(function() {
        this.echo('Oh well.');
    });

    casper.run();

You can add as many steps as you need. Note that the current ``Casper`` instance automatically binds the ``this`` keyword for you within step functions.

To run all the steps you defined, call the `run()`_ method, and voila.

.. index:: HTTP Response

.. note::

   You must `start()`_ the casper instance in order to use the ``then()`` method.

.. topic:: Accessing the current HTTP response

    .. versionadded:: 1.0

    You can access the current HTTP response object using the first parameter of your step callback::

        casper.start('http://www.google.fr/', function(response) {
            require('utils').dump(response);
        });

    That gives:

    .. code-block:: text

        $ casperjs dump-headers.js
        {
            "contentType": "text/html; charset=UTF-8",
            "headers": [
                {
                    "name": "Date",
                    "value": "Thu, 18 Oct 2012 08:17:29 GMT"
                },
                {
                    "name": "Expires",
                    "value": "-1"
                },
                // ... lots of other headers
            ],
            "id": 1,
            "redirectURL": null,
            "stage": "end",
            "status": 200,
            "statusText": "OK",
            "time": "2012-10-18T08:17:37.068Z",
            "url": "http://www.google.fr/"
        }

    So to fetch a particular header by its name::

        casper.start('http://www.google.fr/', function(response) {
            this.echo(response.headers.get('Date'));
        });

    That gives:

    .. code-block:: text

        $ casperjs dump-headers.js
        Thu, 18 Oct 2012 08:26:34 GMT

.. index:: bypass, Step stack

``thenBypass()``
-------------------------------------------------------------------------------

**Signature:** ``thenBypass(Number nb)``

.. versionadded:: 1.1

Adds a navigation step which will bypass a given number of following steps::

    casper.start('http://foo.bar/');
    casper.thenBypass(2);
    casper.then(function() {
        // This test won't be executed
    });
    casper.then(function() {
        // Nor this one
    });
    casper.then(function() {
        // While this one will
    });
    casper.run();

``thenBypassIf()``
-------------------------------------------------------------------------------

**Signature:** ``thenBypassIf(Mixed condition, Number nb)``

.. versionadded:: 1.1

Bypass a given number of navigation steps if the provided condition is truthy or is a function that returns a truthy value::

    var universe = {
        answer: 42
    };
    casper.start('http://foo.bar/');
    casper.thenBypassIf(function() {
        return universe && universe.answer === 42;
    }, 2);
    casper.then(function() {
        // This step won't be executed as universe.answer is 42
    });
    casper.then(function() {
        // Nor this one
    });
    casper.then(function() {
        // While this one will
    });
    casper.run();

``thenBypassUnless()``
-------------------------------------------------------------------------------

**Signature:** ``thenBypassUnless(Mixed condition, Number nb)``

.. versionadded:: 1.1

Opposite of `thenBypassIf()`_.

``thenClick()``
-------------------------------------------------------------------------------

**Signature:** ``thenClick(String selector[, Function then])``

Adds a new navigation step to click a given selector and optionally add a new navigation step in a single operation::

    // Click the first link in the casperJS page
    casper.start('http://casperjs.org/').thenClick('a', function() {
        this.echo("I clicked on first link found, the page is now loaded.");
    });

    casper.run();

This method is basically a convenient a shortcut for chaining a `then()`_ and an `click()`_ calls.

``thenEvaluate()``
-------------------------------------------------------------------------------

**Signature:** ``thenEvaluate(Function fn[, arg1[, arg2[, …]]])``

Adds a new navigation step to perform code evaluation within the current retrieved page DOM::

    // Querying for "Chuck Norris" on Google
    casper.start('http://google.fr/').thenEvaluate(function(term) {
        document.querySelector('input[name="q"]').setAttribute('value', term);
        document.querySelector('form[name="f"]').submit();
    }, 'Chuck Norris');

    casper.run();

This method is basically a convenient a shortcut for chaining a `then()`_ and an `evaluate()`_ calls.

``thenOpen()``
-------------------------------------------------------------------------------

**Signature:** ``thenOpen(String location[, mixed options])``

Adds a new navigation step for opening a new location, and optionally add a next step when its loaded::

    casper.start('http://google.fr/').then(function() {
        this.echo("I'm in your google.");
    });

    casper.thenOpen('http://yahoo.fr/', function() {
        this.echo("Now I'm in your yahoo.")
    });

    casper.run();

.. versionadded:: 1.0

You can also specify request settings by passing a setting object (see `open()`_) as the second argument::

    casper.start().thenOpen('http://url.to/some/uri', {
        method: "post",
        data: {
            username: 'chuck',
            password: 'n0rr15'
        }
    }, function() {
        this.echo("POST request has been sent.")
    });

    casper.run();

``thenOpenAndEvaluate()``
-------------------------------------------------------------------------------

**Signature:** ``thenOpenAndEvaluate(String location[, Function then[, arg1[, arg2[, …]]])``

Basically a shortcut for opening an url and evaluate code against remote DOM environment::

    casper.start('http://google.fr/').then(function() {
        this.echo("I'm in your google.");
    });

    casper.thenOpenAndEvaluate('http://yahoo.fr/', function() {
        var f = document.querySelector('form');
        f.querySelector('input[name=q]').value = 'chuck norris';
        f.submit();
    });

    casper.run(function() {
        this.debugPage();
        this.exit();
    });

``toString()``
-------------------------------------------------------------------------------

**Signature:** ``toString()``

.. versionadded:: 1.0

Returns a string representation of current Casper instance::

    casper.start('http://google.fr/', function() {
        this.echo(this); // [object Casper], currently at http://google.fr/
    });

    casper.run();

``unwait()``
-------------------------------------------------------------------------------

**Signature:** ``unwait()``

.. versionadded:: 1.1

Abort all current waiting processes, if any.

.. index:: User Agent

``userAgent()``
-------------------------------------------------------------------------------

**Signature:** ``userAgent(String agent)``

.. versionadded:: 1.0

Sets the `User-Agent string <http://en.wikipedia.org/wiki/User-Agent>`_ to send through headers when performing requests::

    casper.start();

    casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)');

    casper.thenOpen('http://google.com/', function() {
        this.echo("I'm a Mac.");
        this.userAgent('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');
    });

    casper.thenOpen('http://google.com/', function() {
        this.echo("I'm a PC.");
    });

    casper.run();

.. index:: viewport

``viewport()``
-------------------------------------------------------------------------------

**Signature:** ``viewport(Number width, Number height[, Function then])``

Changes current viewport size::

    casper.viewport(1024, 768);

To be sure page reflowing has occured, you have to use it asynchronously::

    casper.viewport(1024, 768).then(function() {
        // new view port is now effective
    });

.. versionadded:: 1.1

As of 1.1 you can pass a `then` step function directly to ``viewport()``::

    casper.viewport(1024, 768, function() {
        // new view port is effective
    });

.. note::

   PhantomJS comes with a default viewport size of 400x300, and CasperJS doesn't override it by default.

.. index:: DOM

``visible()``
-------------------------------------------------------------------------------

**Signature:** ``visible(String selector)``

Checks if the DOM element matching the provided :doc:`selector expression <../selectors>` is visible in remote page::

    casper.start('http://google.com/', function() {
        if (this.visible('#hplogo')) {
            this.echo("I can see the logo");
        } else {
            this.echo("I can't see the logo");
        }
    });

.. index:: wait, sleep

``wait()``
-------------------------------------------------------------------------------

**Signature:** ``wait(Number timeout[, Function then])``

Pause steps suite execution for a given amount of time, and optionally execute a step on done::

    casper.start('http://yoursite.tld/', function() {
        this.wait(1000, function() {
            this.echo("I've waited for a second.");
        });
    });

    casper.run();

You can also write the same thing like this::

    casper.start('http://yoursite.tld/');

    casper.wait(1000, function() {
        this.echo("I've waited for a second.");
    });

    casper.run();

.. index:: Asynchronicity

``waitFor()``
-------------------------------------------------------------------------------

**Signature:** ``waitFor(Function testFx[, Function then, Function onTimeout, Number timeout, Object details])``

Waits until a function returns true to process any next step.

You can also set a callback on timeout using the ``onTimeout`` argument, and set the timeout using the ``timeout`` one, in milliseconds. The default timeout is set to 5000ms::

    casper.start('http://yoursite.tld/');

    casper.waitFor(function check() {
        return this.evaluate(function() {
            return document.querySelectorAll('ul.your-list li').length > 2;
        });
    }, function then() {
        this.captureSelector('yoursitelist.png', 'ul.your-list');
    });

    casper.run();

Example using the ``onTimeout`` callback::

    casper.start('http://yoursite.tld/');

    casper.waitFor(function check() {
        return this.evaluate(function() {
            return document.querySelectorAll('ul.your-list li').length > 2;
        });
    }, function then() {    // step to execute when check() is ok
        this.captureSelector('yoursitelist.png', 'ul.your-list');
    }, function timeout() { // step to execute if check has failed
        this.echo("I can't haz my screenshot.").exit();
    });

    casper.run();

``details`` is a property bag of various information that will be passed to the ``waitFor.timeout`` event, if it is emitted.
This can be used for better error messages or to conditionally ignore some timeout events.

.. _casper_waitforpopup:

.. index:: Popups, New window, window.open, Tabs

``waitForPopup()``
-------------------------------------------------------------------------------

**Signature:** ``waitForPopup(String|RegExp urlPattern[, Function then, Function onTimeout, Number timeout])``

.. versionadded:: 1.0

Waits for a popup having its url matching the provided pattern to be opened and loaded.

The currently loaded popups are available in the ``Casper.popups`` array-like property::

    casper.start('http://foo.bar/').then(function() {
        this.test.assertTitle('Main page title');
        this.clickLabel('Open me a popup');
    });

    // this will wait for the popup to be opened and loaded
    casper.waitForPopup(/popup\.html$/, function() {
        this.test.assertEquals(this.popups.length, 1);
    });

    // this will set the popup DOM as the main active one only for time the
    // step closure being executed
    casper.withPopup(/popup\.html$/, function() {
        this.test.assertTitle('Popup title');
    });

    // next step will automatically revert the current page to the initial one
    casper.then(function() {
        this.test.assertTitle('Main page title');
    });

.. index:: HTTP, Asynchronicity

``waitForResource()``
-------------------------------------------------------------------------------

**Signature:** ``waitForResource(String|Function|RegExp testFx[, Function then, Function onTimeout, Number timeout])``

Wait until a resource that matches a resource matching constraints defined by ``testFx`` are satisfief to process a next step.

The ``testFx`` argument can be either a string, a function or a ``RegExp`` instance::

    casper.waitForResource("foobar.png", function() {
        this.echo('foobar.png has been loaded.');
    });

Using a regexp::

    casper.waitForResource(/foo(bar|baz)\.png$/, function() {
        this.echo('foobar.png or foobaz.png has been loaded.');
    });

Using a function::

    casper.waitForResource(function testResource(resource) {
        return resource.url.indexOf("https") === 0;
    }, function onReceived() {
        this.echo('a secure resource has been loaded.');
    });

.. _casper_waitforurl:

.. index:: URL

``waitForUrl()``
-------------------------------------------------------------------------------

**Signature:** ``waitForUrl(String|RegExp url[, Function then, Function onTimeout, Number timeout])``

.. versionadded:: 1.1

Waits for the current page url to match the provided argument (``String`` or ``RegExp``)::

    casper.start('http://foo/').waitForUrl(/login\.html$/, function() {
        this.echo('redirected to login.html');
    });

    casper.run();

.. index:: selector

``waitForSelector()``
-------------------------------------------------------------------------------

**Signature:** ``waitForSelector(String selector[, Function then, Function onTimeout, Number timeout])``

Waits until an element matching the provided :doc:`selector expression <../selectors>` exists in remote DOM to process any next step. Uses `waitFor()`_::

    casper.start('https://twitter.com/#!/n1k0');

    casper.waitForSelector('.tweet-row', function() {
        this.captureSelector('twitter.png', 'html');
    });

    casper.run();

.. index:: selector

``waitWhileSelector()``
-------------------------------------------------------------------------------

**Signature:** ``waitWhileSelector(String selector[, Function then, Function onTimeout, Number timeout])``

Waits until an element matching the provided :doc:`selector expression <../selectors>` does not exist in remote DOM to process a next step. Uses `waitFor()`_::

    casper.start('http://foo.bar/');

    casper.waitWhileSelector('.selector', function() {
        this.echo('.selector is no more!');
    });

    casper.run();

``waitForSelectorTextChange()``
-------------------------------------------------------------------------------

**Signature:** ``waitForSelectorTextChange(String selectors[, Function then, Function onTimeout, Number timeout])``

Waits until the text on an element matching the provided :doc:`selector expression <../selectors>`
is changed to a different value before processing the next step. Uses `waitFor()`_::

    casper.start('http://foo.bar/');

    casper.waitForSelectorTextChange('.selector', function() {
        this.echo('The text on .selector has been changed.);
    });

    casper.run();

``waitForText()``
-------------------------------------------------------------------------------

**Signature:** ``waitForText(String text[, Function then, Function onTimeout, Number timeout])``

.. versionadded:: 1.0

Waits until the passed text is present in the page contents before processing the immediate next step. Uses `waitFor()`_::

    casper.start('http://why.univer.se/').waitForText("42", function() {
        this.echo('Found the answer.');
    });

    casper.run();

``waitUntilVisible()``
-------------------------------------------------------------------------------

**Signature:** ``waitUntilVisible(String selector[, Function then, Function onTimeout, Number timeout])``

Waits until an element matching the provided :doc:`selector expression <../selectors>` is visible in the remote DOM to process a next step. Uses `waitFor()`_.

``waitWhileVisible()``
-------------------------------------------------------------------------------

**Signature:** ``waitWhileVisible(String selector[, Function then, Function onTimeout, Number timeout])``

Waits until an element matching the provided :doc:`selector expression <../selectors>` is no longer visible in remote DOM to process a next step. Uses `waitFor()`_.

``warn()``
-------------------------------------------------------------------------------

**Signature:** ``warn(String message)``

Logs and prints a warning message to the standard output::

    casper.warn("I'm a warning message.");

.. note::

   Calling ``warn()`` will trigger the ``warn`` :ref:`event <events_filters>`.

.. index:: Frames, Iframes, Framesets

``withFrame()``
-------------------------------------------------------------------------------

**Signature:** ``withFrame(String|Number frameInfo, Function then)``

.. versionadded:: 1.0

Switches the main page to the frame having the name or frame index number matching the passed argument, and processes a step.

The page context switch only lasts until the step execution is finished::

    casper.start('tests/site/frames.html', function() {
        this.test.assertTitle('FRAMESET TITLE');
    });

    casper.withFrame('frame1', function() {
        this.test.assertTitle('FRAME TITLE');
    });

    casper.withFrame(0, function() {
        this.test.assertTitle('FRAME TITLE');
    });

    casper.then(function() {
        this.test.assertTitle('FRAMESET TITLE');
    });

.. _casper_withpopup:

.. index:: Popups, New window, window.open, Tabs

``withPopup()``
-------------------------------------------------------------------------------

**Signature:** ``withPopup(Mixed popupInfo, Function then)``

.. versionadded:: 1.0

Switches the main page to a popup matching the information passed as argument, and processes a step. The page context switch only lasts until the step execution is finished::

    casper.start('http://foo.bar/').then(function() {
        this.test.assertTitle('Main page title');
        this.clickLabel('Open me a popup');
    });

    // this will wait for the popup to be opened and loaded
    casper.waitForPopup(/popup\.html$/, function() {
        this.test.assertEquals(this.popups.length, 1);
    });

    // this will set the popup DOM as the main active one only for time the
    // step closure being executed
    casper.withPopup(/popup\.html$/, function() {
        this.test.assertTitle('Popup title');
    });

    // next step will automatically revert the current page to the initial one
    casper.then(function() {
        this.test.assertTitle('Main page title');
    });

.. note::

   The currently loaded popups are available in the ``Casper.popups`` array-like property.

.. index:: Zoom

``zoom()``
-------------------------------------------------------------------------------

**Signature:** ``zoom(Number factor)``

.. versionadded:: 1.0

Sets the current page zoom factor::

    var casper = require('casper').create();

    casper.start().zoom(2).thenOpen('http://google.com', function() {
        this.capture('big-google.png');
    });

    casper.run();

