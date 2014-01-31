.. _debugging:

.. index:: Bugs, Debugging

=========
Debugging
=========

.. contents:: A few tips for debugging your casper scripts:
   :local:


Use the :index:`verbose` mode
-----------------------------

By default & by design, a ``Casper`` instance won't print anything to the console. This can be very limitating & frustrating when creating or debugging scripts, so a good practice is to always start coding a script using these :index:`settings`::

    var casper = require('casper').create({
        verbose: true,
        logLevel: "debug"
    });

The ``verbose`` setting will tell Casper to write every logged message at the ``logLevel`` logging level onto the standard output, so you'll be able to trace every step made.

.. warning::

   Output will then be pretty verbose, and will potentially display sensitive informations onto the console. **Use with care on production.**


Hook in the deep using :index:`events`
--------------------------------------

:doc:`Events <events-filters>` are a very powerful features of CasperJS, and you should probably give it a look if you haven't already.

Some interesting events you may eventually use to debug your scripts:

- The ``http.status.XXX`` event will be emitted everytime a resource is sent with the `HTTP code <http://en.wikipedia.org/wiki/List_of_HTTP_status_codes>`_ corresponding to ``XXX``;
- The ``remote.alert`` everytime an ``alert()`` call is performed client-side;
- ``remote.message`` everytime a message is sent to the client-side console;
- ``step.added`` everytime a step is added to the stack;
- etc…

Listening to an event is dead easy::

    casper.on('http.status.404', function(resource) {
        this.log('Hey, this one is 404: ' + resource.url, 'warning');
    });

Ensure to check the :ref:`full list <events_list>` of all the other available events.


.. _debugging_dump:

Dump serialized values to the console
-------------------------------------

Sometimes it's helpful to inspect a variable, especially Object contents. The :ref:`utils_dump() <utils_dump>` function can achieve just that::

    require('utils').dump({
        foo: {
            bar: 42
        },
    });

.. note::

   :ref:`utils_dump() <utils_dump>` won't be able to serialize function nor complex cyclic structures though.


Localize yourself in modules
----------------------------

.. warning::

   .. deprecated:: 1.1

   As of 1.1, CasperJS uses PhantomJS' builtin `require` and won't expose the `__file__` variable anymore.

If you're creating Casper modules, a cool thing to know is that there's a special built-in variable available in every module, ``__file__``, which contains the absolute path to current javascript file (the module file).


Name your closures
------------------

Probably one of the most easy but effective best practice, always name your closures:

**Hard to track:**

::

    casper.start('http://foo.bar/', function() {
        this.evaluate(function() {
            // ...
        });
    });

**Easier:**

::

    casper.start('http://foo.bar/', function afterStart() {
        this.evaluate(function evaluateStuffAfterStart() {
            // ...
        });
    });

That way, everytime one is failing, its name will be printed out in the :index:`stack trace`, **so you can more easily locate it within your code**.

.. note::

   This one also applies for all your other Javascript works, of course ;)
