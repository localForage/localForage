.. _clientutils_module:

.. index:: Client utils, __utils__, DOM

==========================
The ``clientutils`` module
==========================

Casper ships with a few client-side utilities which are injected in the remote DOM environment, and accessible from there through the ``__utils__`` object instance of the ``ClientUtils`` class from the ``clientutils`` module::

    casper.evaluate(function() {
      __utils__.echo("Hello World!");
    });

.. note::

   These tools are provided to avoid coupling CasperJS to any third-party library like :index:`jQuery`, Mootools or something; but you can always include these and have them available client-side using the :ref:`Casper.options.clientScripts <casper_option_clientscripts>` option.

.. _bookmarklet:

.. index:: bookmarklet, DOM, Debugging

Bookmarklet
+++++++++++

A bookmarklet is also available to help injecting Casper's client-side utilities in the DOM of your favorite browser.

Just drag the following link onto your favorites toobar; when clicking it, a ``__utils__`` object will be available within the console of your browser:

.. raw:: html

    <div class="bookmarklet">
        <a href="javascript:(function(){void(function(){if(!document.getElementById('CasperUtils')){var%20CasperUtils=document.createElement('script');CasperUtils.id='CasperUtils';CasperUtils.src='https://raw.github.com/n1k0/casperjs/master/modules/clientutils.js';document.documentElement.appendChild(CasperUtils);var%20interval=setInterval(function(){if(typeof%20ClientUtils==='function'){window.__utils__=new%20window.ClientUtils();clearInterval(interval);}},50);}}());})();">CasperJS Utils</a>
    </div>

.. note::

   CasperJS and PhantomJS being based on `Webkit <http://webkit.org/>`_, you're strongly encouraged to use a recent Webkit compatible browser to use this bookmarklet (Chrome, Safari, etc…)


.. _clientutils_prototype:

``ClientUtils`` prototype
+++++++++++++++++++++++++

.. index:: echo

``echo()``
-------------------------------------------------------------------------------

**Signature:** ``echo(String message)``

.. versionadded:: 1.0

Print a message out to the casper console from the remote page DOM environment::

    casper.start('http://foo.ner/').thenEvaluate(function() {
        __utils__.echo('plop'); // this will be printed to your shell at runtime
    });

.. index:: Base64

``encode()``
-------------------------------------------------------------------------------

**Signature:** ``encode(String contents)``

Encodes a string using the `base64 algorithm <http://en.wikipedia.org/wiki/Base64>`_. For the records, CasperJS doesn't use builtin ``window.btoa()`` function because it can't deal efficiently with strings encoded using >8b characters::

    var base64;
    casper.start('http://foo.bar/', function() {
        base64 = this.evaluate(function() {
            return __utils__.encode("I've been a bit cryptic recently");
        });
    });

    casper.run(function() {
        this.echo(base64).exit();
    });

.. index:: DOM

``exists()``
-------------------------------------------------------------------------------

**Signature:** ``exists(String selector)``

Checks if a DOM element matching a given :ref:`selector expression <selectors>` exists::

    var exists;
    casper.start('http://foo.bar/', function() {
        exists = this.evaluate(function() {
            return __utils__.exists('#some_id');
        });
    });

    casper.run(function() {
        this.echo(exists).exit();
    });

``findAll()``
-------------------------------------------------------------------------------

**Signature:** ``findAll(String selector)``

Retrieves all DOM elements matching a given :ref:`selector expression <selectors>`::

    var links;
    casper.start('http://foo.bar/', function() {
        links = this.evaluate(function() {
            var elements = __utils__.findAll('a.menu');
            return Array.prototype.forEach.call(elements, function(e) {
                return e.getAttribute('href');
            });
        });
    });

    casper.run(function() {
        this.echo(JSON.stringify(links)).exit();
    });

``findOne()``
-------------------------------------------------------------------------------

**Signature:** ``findOne(String selector)``

Retrieves a single DOM element by a :ref:`selector expression <selectors>`::

    var href;
    casper.start('http://foo.bar/', function() {
        href = this.evaluate(function() {
            return __utils__.findOne('#my_id').getAttribute('href');
        });
    });

    casper.run(function() {
        this.echo(href).exit();
    });

.. index:: Base64

``getBase64()``
-------------------------------------------------------------------------------

**Signature:** ``getBase64(String url[, String method, Object data])``

This method will retrieved a base64 encoded version of any resource behind a url. For example, let's imagine we want to retrieve the base64 representation of some website's logo::

    var logo = null;
    casper.start('http://foo.bar/', function() {
        logo = this.evaluate(function() {
            var imgUrl = document.querySelector('img.logo').getAttribute('src');
            return __utils__.getBase64(imgUrl);
        });
    });

    casper.run(function() {
        this.echo(logo).exit();
    });

.. index:: Binary

``getBinary()``
-------------------------------------------------------------------------------

**Signature:** ``getBinary(String url[, String method, Object data])``

This method will retrieved the raw contents of a given binary resource; unfortunately though, PhantomJS cannot process these data directly so you'll have to process them within the remote DOM environment. If you intend to download the resource, use `getBase64()`_ or :ref:`Casper.base64encode() <casper_base64encode>` instead::

    casper.start('http://foo.bar/', function() {
        this.evaluate(function() {
            var imgUrl = document.querySelector('img.logo').getAttribute('src');
            console.log(__utils__.getBinary(imgUrl));
        });
    });

    casper.run();

``getDocumentHeight()``
-------------------------------------------------------------------------------

**Signature:** ``getDocumentHeight()``

.. versionadded:: 1.0

Retrieves current document height::

    var documentHeight;

    casper.start('http://google.com/', function() {
        documentHeight = this.evaluate(function() {
            return __utils__.getDocumentHeight();
        });
        this.echo('Document height is ' + documentHeight + 'px');
    });

    casper.run();

``getElementBounds()``
-------------------------------------------------------------------------------

**Signature:** ``getElementBounds(String selector)``

Retrieves boundaries for a DOM elements matching the provided :ref:`selector <selectors>`.

It returns an Object with four keys: ``top``, ``left``, ``width`` and ``height``, or ``null`` if the selector doesn't exist.

``getElementsBounds()``
-------------------------------------------------------------------------------

**Signature:** ``getElementsBounds(String selector)``

Retrieves boundaries for all DOM element matching the provided :ref:`selector <selectors>`.

It returns an array of objects each having four keys: ``top``, ``left``, ``width`` and ``height``.

.. index:: XPath

``getElementByXPath()``
-------------------------------------------------------------------------------

**Signature:** ``getElementByXPath(String expression [, HTMLElement scope])``

Retrieves a single DOM element matching a given :ref:`XPath expression <selectors>`.

.. versionadded:: 1.0

The ``scope`` argument allow to set the context for executing the XPath query::

    // will be performed against the whole document
    __utils__.getElementByXPath('.//a');

    // will be performed against a given DOM element
    __utils__.getElementByXPath('.//a', __utils__.findOne('div.main'));

.. index:: XPath

``getElementsByXPath()``
-------------------------------------------------------------------------------

**Signature:** ``getElementsByXPath(String expression [, HTMLElement scope])``

Retrieves all DOM elements matching a given :ref:`XPath expression <selectors>`, if any.

.. versionadded:: 1.0

The ``scope`` argument allows to set the context for executing the XPath query.

.. _clientutils_getfieldvalue:

.. index:: Form

``getFieldValue()``
-------------------------------------------------------------------------------

**Signature:** ``getFieldValue(String inputName[, Object options])``

.. versionadded:: 1.0

Retrieves the value from the field named against the ``inputNamed`` argument:

.. code-block:: html

    <form>
        <input type="text" name="plop" value="42">
    </form>

Using the ``getFieldValue()`` method for ``plop``::

    __utils__.getFieldValue('plop'); // 42

Options:

- ``formSelector``: allows to set the selector for the form containing the target field.

.. index:: Form

``getFormValues()``
-------------------------------------------------------------------------------

**Signature:** ``getFormValues(String selector)``

.. versionadded:: 1.0

Retrieves a given form and all of its field values:

.. code-block:: html

    <form id="login" action="/login">
        <input type="text" name="username" value="foo">
        <input type="text" name="password" value="bar">
        <input type="submit">
    </form>

To get the form values::

    __utils__.getFormValues('form#login'); // {username: 'foo', password: 'bar'}

.. index:: log

``log()``
-------------------------------------------------------------------------------

**Signature:** ``log(String message[, String level])``

Logs a message with an optional level. Will format the message a way CasperJS will be able to log phantomjs side. Default level is ``debug``::

    casper.start('http://foo.ner/').thenEvaluate(function() {
        __utils__.log("We've got a problem on client side", 'error');
    });

``mouseEvent()``
-------------------------------------------------------------------------------

**Signature:** ``mouseEvent(String type, String selector)``

Dispatches a mouse event to the DOM element behind the provided selector.

Supported events are ``mouseup``, ``mousedown``, ``click``, ``mousemove``, ``mouseover`` and ``mouseout``.

.. index:: XPath

``removeElementsByXPath()``
-------------------------------------------------------------------------------

**Signature:** ``removeElementsByXPath(String expression)``

Removes all DOM elements matching a given :ref:`XPath expression <selectors>`.

.. index:: AJAX

``sendAJAX()``
-----------------------------------------------------------------------------

**Signature:** ``sendAJAX(String url[, String method, Object data, Boolean async, Object settings])``

.. versionadded:: 1.0

Sends an AJAX request, using the following parameters:

- ``url``: The url to request.
- ``method``: The HTTP method (default: ``GET``).
- ``data``: Request parameters (default: ``null``).
- ``async``: Flag for an asynchroneous request? (default: ``false``)
- ``settings``: Other settings when perform the AJAX request (default: ``null``)

.. warning::

   Don't forget to pass the ``--web-security=no`` option in your CLI call in order to perform cross-domains requests when needed::

       var data, wsurl = 'http://api.site.com/search.json';

       casper.start('http://my.site.com/', function() {
           data = this.evaluate(function(wsurl) {
               return JSON.parse(__utils__.sendAJAX(wsurl, 'GET', null, false));
           }, {wsurl: wsurl});
       });

       casper.then(function() {
           require('utils').dump(data);
       });

``visible()``
-------------------------------------------------------------------------------

**Signature:** ``visible(String selector)``

Checks if an element is visible::

    var logoIsVisible = casper.evaluate(function() {
        return __utils__.visible('h1');
    });

