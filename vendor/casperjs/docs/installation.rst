.. _installation:
.. index:: Installation

============
Installation
============

CasperJS can be installed on Mac OSX, Windows and most Linuxes.

Prerequisites
-------------

.. index:: PhantomJS, Python, SlimerJS

- PhantomJS_ 1.8.1 or greater. Installation instructions can be found `here <http://phantomjs.org/download.html>`_
- Python_ 2.6 or greater for ``casperjs`` in the ``bin/`` directory
- .NET Framework 3.5 or greater (or Mono_ 2.10.8 or greater) for ``casperjs.exe`` in the ``bin/`` directory

.. versionadded:: 1.1

- **Experimental:** as of 1.1-beta1, SlimerJS_ 0.8 or greater to run your tests against Gecko (Firefox) instead of Webkit. To see PhantomJS API compatibility of SlimerJS, please `refer to this page <https://github.com/laurentj/slimerjs/blob/master/API_COMPAT.md>`_.

.. warning::

   .. deprecated:: 1.1

   The `Ruby <http://ruby-lang.org/>`_ version of the ``casperjs`` executable also available in the ``rubybin/`` directory has been deprecated as of 1.1-beta, and is not compatible with SlimerJS_.

   The batch version of the ``casperjs`` executable also available in the ``batchbin/`` directory has been deprecated as of 1.1-beta, and is not compatible with SlimerJS_.

.. index:: Homebrew

Installing from Homebrew (OSX)
------------------------------

Installation of both PhantomJS and CasperJS can be achieved using Homebrew_, a popular package manager for Mac OS X.

Above all, don't forget to update Formulaes::

    $ brew update
   
For the 1.1 development version (recommended)::

    $ brew install casperjs --devel

For the 1.0.x stable version::

    $ brew install casperjs
    
If you have already installed casperjs and want to have the last release (stable|devel), use ``upgrade``::

    $ brew upgrade casperjs
   
Upgrade only update to the latest release branch (1.0.x|1.1-dev).

.. index:: git

Installing from git
-------------------

Installation can be achieved using `git <http://git-scm.com/>`_. The code is mainly hosted on `Github <https://github.com/n1k0/casperjs>`_.

From the master branch
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: text

    $ git clone git://github.com/n1k0/casperjs.git
    $ cd casperjs
    $ ln -sf `pwd`/bin/casperjs /usr/local/bin/casperjs

Once PhantomJS and CasperJS installed on your machine, you should obtain something like this:

.. code-block:: text

    $ phantomjs --version
    1.8.1
    $ casperjs
    CasperJS version 1.1.0-DEV at /Users/niko/Sites/casperjs, using phantomjs version 1.8.1
    # ...

Or if SlimerJS is your thing:

.. code-block:: text

    $ slimerjs --version
    Innophi SlimerJS 0.8pre, Copyright 2012-2013 Laurent Jouanneau & Innophi
    $ casperjs
    CasperJS version 1.1.0-DEV at /Users/niko/Sites/casperjs, using slimerjs version 0.8.0

You are now ready to write your :doc:`first script <quickstart>`!


Installing from an archive
--------------------------

You can download tagged archives of CasperJS code:

**Latest stable version:**

- https://github.com/n1k0/casperjs/zipball/1.0.3 (zip)
- https://github.com/n1k0/casperjs/tarball/1.0.3 (tar.gz)

**Latest development version (master branch):**

- https://github.com/n1k0/casperjs/zipball/master (zip)
- https://github.com/n1k0/casperjs/tarball/master (tar.gz)

Operations are then the same as with a git checkout.


.. index:: Windows

CasperJS on Windows
-------------------

Phantomjs installation additions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Append ``";C:\phantomjs"`` to your ``PATH`` environment variable.
- Modify this path appropriately if you installed PhantomJS to a different location.

Casperjs installation additions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**CasperJS, as of 1.1-beta3, ships with a .NET application so you don't need Python nor Ruby to use it.**

.. versionadded:: 1.1-beta3

- Append ``";C:\casperjs\bin"`` to your ``PATH`` environment variable.
- Modify this path appropriately if you installed CasperJS to a different location.

You can now run any regular casper scripts that way:

.. code-block:: text

    C:> casperjs myscript.js

Earlier versions of CasperJS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**CasperJS, as of 1.0.0-RC3, ships with a Batch script so you don't need Python nor Ruby to use it.**

- Append ``";C:\casperjs\batchbin"`` to your ``PATH`` environment variable.
- Modify this path appropriately if you installed CasperJS to a different location.

You can now run any regular casper scripts that way:

.. code-block:: text

    C:> casperjs.bat myscript.js

**Before 1.0.0-RC3, you had to setup your casper scripts that way::**

    phantom.casperPath = 'C:\\casperjs-1.1';
    phantom.injectJs(phantom.casperPath + '\\bin\\bootstrap.js');

    var casper = require('casper').create();

    // do stuff

Run the script using the ``phantom.exe`` program:

.. code-block:: text

    C:> phantomjs.exe myscript.js

.. note::

   .. versionadded:: 1.1-beta1

   Windows users will get colorized output if ansicon_ is installed.


.. index:: Bugs, REPL

Known Bugs & Limitations
------------------------

- Due to its asynchronous nature, CasperJS doesn't work well with `PhantomJS' REPL <http://code.google.com/p/phantomjs/wiki/InteractiveModeREPL>`_.

.. _Homebrew: http://mxcl.github.com/homebrew/
.. _PhantomJS: http://phantomjs.org/
.. _Python: http://python.org/
.. _SlimerJS: http://slimerjs.org/
.. _ansicon: https://github.com/adoxa/ansicon
.. _Mono: http://www.mono-project.com/
