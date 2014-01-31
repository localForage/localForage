.. _cli:

.. index:: Command line, CLI, PhantomJS, Shell, arguments, options

======================
Using the command line
======================

CasperJS ships with a built-in command line parser on top of PhantomJS' one, located in the ``cli`` module; it exposes passed arguments as **positional ones** and **named options**

But no worries for manipulating the ``cli`` module parsing API, a ``Casper`` instance always contains a ready to use ``cli`` property, allowing easy access of all these parameters.

Let's consider this simple casper script::

    var casper = require("casper").create();

    casper.echo("Casper CLI passed args:");
    require("utils").dump(casper.cli.args);

    casper.echo("Casper CLI passed options:");
    require("utils").dump(casper.cli.options);

    casper.exit();

.. note::

   Please note the two ``casper-path`` and ``cli`` options; these are passed to the casper script through the ``casperjs`` Python executable.

Execution results::

    $ casperjs test.js arg1 arg2 arg3 --foo=bar --plop anotherarg
    Casper CLI passed args: [
        "arg1",
        "arg2",
        "arg3",
        "anotherarg"
    ]
    Casper CLI passed options: {
        "casper-path": "/Users/niko/Sites/casperjs",
        "cli": true,
        "foo": "bar",
        "plop": true
    }

Getting, checking or dropping parameters::

    var casper = require("casper").create();
    casper.echo(casper.cli.has(0));
    casper.echo(casper.cli.get(0));
    casper.echo(casper.cli.has(3));
    casper.echo(casper.cli.get(3));
    casper.echo(casper.cli.has("foo"));
    casper.echo(casper.cli.get("foo"));
    casper.cli.drop("foo");
    casper.echo(casper.cli.has("foo"));
    casper.echo(casper.cli.get("foo"));
    casper.exit();

Execution results:

.. code-block:: text

    $ casperjs test.js arg1 arg2 arg3 --foo=bar --plop anotherarg
    true
    arg1
    true
    anotherarg
    true
    bar
    false
    undefined

.. hint::

   What if you want to check if any arg or option has been passed to your script? Here you go::

       // removing default options passed by the Python executable
       casper.cli.drop("cli");
       casper.cli.drop("casper-path");

       if (casper.cli.args.length === 0 && Object.keys(casper.cli.options).length === 0) {
           casper.echo("No arg nor option passed").exit();
       }

`casperjs` native options
-------------------------

.. versionadded:: 1.1

.. index:: Logging, log levels, SlimerJS

The `casperjs` command has three available options:

- ``--direct``: to prints out log messages to the console
- ``--log-level=[debug|info|warning|error]`` to set the :ref:`logging level <logging>`
- ``--engine=[phantomjs|slimerjs]`` to select the browser engine you want to use. CasperJS
   supports PhantomJS (default) that runs Webkit, and SlimerJS that runs Gecko.

.. warning::

   .. deprecated:: 1.1

   ``--direct`` option has been renamed to ``--verbose``, though ``--direct`` will still works, while is to be considered deprecated.

Example:

.. code-block:: text

    $ casperjs --verbose --log-level=debug myscript.js

Last but not least, you can still use all PhantomJS standard CLI options as you would do with any other phantomjs script:

.. code-block:: text

    $ casperjs --web-security=no --cookies-file=/tmp/mycookies.txt myscript.js

.. hint::

   To remember what the native phantomjs available cli options are, run the ``phantomjs --help`` command.
   SlimerJS supports almost same options as PhantomJS.

.. index:: Raw values

Raw parameter values
--------------------

.. versionadded:: 1.0

By default, the cli object will process every passed argument & cast them to the appropriate detected type; example script::

    var casper = require('casper').create();
    var utils = require('utils');

    utils.dump(casper.cli.get('foo'));

    casper.exit();

If you run this script:

.. code-block:: text

    $ casperjs c.js --foo=01234567
    1234567

As you can see, the ``01234567`` value has been cast to a *Number*.

Sometimes, you just want the original string; then you can use the ``raw`` property of the ``cli`` object, which contains the raw values passed parameters::

    var casper = require('casper').create();
    var utils = require('utils');

    utils.dump(casper.cli.get('foo'));
    utils.dump(casper.cli.raw.get('foo'));

    casper.exit();

Sample usage:

.. code-block:: text

    $ casperjs c.js --foo=01234567
    1234567
    "01234567"

