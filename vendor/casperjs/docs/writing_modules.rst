.. _writing_modules:

.. index:: Modules, Modules, Custom module

Writing CasperJS modules
========================

As of 1.1, CasperJS relies on PhantomJS' native ``require()`` function internally though it had to be patched in order to allow requiring casper modules using their full name, eg. ``require('casper')``.

So if you plan to write your own modules and uses casperjs' ones from them, be sure to call the ``patchRequire()`` function::

    // my module, stored in universe.js
    // patching phantomjs' require()
    var require = patchRequire(require);

    // now you're ready to go
    var utils = require('utils');
    var magic = 42;
    exports.answer = function() {
        return utils.format("it's %d", magic);
    };

.. warning::

    When using CoffeeScript ``global.require`` must be passed to ``patchRequire()`` instead of just ``require``.

From your root casper script::

    var universe = require('./universe');
    console.log(universe.answer()); // prints "It's 42"

.. versionadded:: 1.1.

.. hint::

    Like PhantomJS, CasperJS allows using nodejs modules installed through npm_.
   
As an example, let's install the underscore_ library:

.. _npm: https://npmjs.org/
.. _underscore: http://underscorejs.org/

.. code-block:: text

    $ npm install underscore
    
    
Then, ``require`` it like you would with any other nodejs compliant module::
   
    //npm-underscore-test.js
    var _ = require('underscore');
    var casper = require('casper').create();
    var urls = _.uniq([
      'http://google.com/',
      'http://docs.casperjs.org/',
      'http://google.com/'
    ]);
    
    casper.start().eachThen(urls, function(response) {
      this.thenOpen(response.data, function(response) {
        this.echo(this.getTitle());
      });
    });
    
    casper.run();
    
    
Finaly, you’ll probably get something like this:
    
.. code-block:: text

    $ casperjs npm-underscore-test.js
    Google
    CasperJS documentation | CasperJS 1.1.0-DEV documentation
    
    
