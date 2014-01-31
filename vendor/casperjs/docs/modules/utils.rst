.. _utils_module:

.. index:: Utilities, Helpers

====================
The ``utils`` module
====================

This module provides simple helper functions, some of them being very specific to CasperJS though.

Functions reference
+++++++++++++++++++

Usage is pretty much straightforward::

    var utils = require('utils');

    utils.dump({plop: 42});

``betterTypeOf()``
-------------------------------------------------------------------------------

**Signature:** ``betterTypeOf(input)``

Provides a better ``typeof`` operator equivalent, eg. able to retrieve the ``Array`` type.

``betterInstanceOf()``
-------------------------------------------------------------------------------

.. versionadded:: 1.1

**Signature:** ``betterInstanceOf(input, constructor)``

Provides a better ``instanceof`` operator equivalent, is able to retrieve the ``Array`` instance or to deal with inheritance.

.. index:: dump, Serialization, Debugging, JSON

.. _utils_dump:

``dump()``
-------------------------------------------------------------------------------

**Signature:** ``dump(value)``

Dumps a JSON_ representation of passed argument to the standard output. Useful for :ref:`debugging your scripts <debugging_dump>`.

``fileExt()``
-------------------------------------------------------------------------------

**Signature:** ``fileExt(file)``

Retrieves the extension of passed filename.

``fillBlanks()``
-------------------------------------------------------------------------------

**Signature:** ``fillBlanks(text, pad)``

Fills a string with trailing spaces to match ``pad`` length.

.. index:: String formatting

``format()``
-------------------------------------------------------------------------------

**Signature:** ``format(f)``

Formats a string against passed args. ``sprintf`` equivalent.

.. note::

   This is a port of nodejs ``util.format()``.

``getPropertyPath()``
-------------------------------------------------------------------------------

**Signature:** ``getPropertyPath(Object obj, String path)``

.. versionadded:: 1.0

Retrieves the value of an Object foreign property using a dot-separated path string::

    var account = {
        username: 'chuck',
        skills: {
            kick: {
                roundhouse: true
            }
        }
    }
    utils.getPropertyPath(account, 'skills.kick.roundhouse'); // true

.. warning::

   This function doesn't handle object key names containing a dot.

.. index:: inheritance

``inherits()``
-------------------------------------------------------------------------------

**Signature:** ``inherits(ctor, superCtor)``

Makes a constructor inheriting from another. Useful for subclassing and :doc:`extending <../extending>`.

.. note::

   This is a port of nodejs ``util.inherits()``.

``isArray()``
-------------------------------------------------------------------------------

**Signature:** ``isArray(value)``

Checks if passed argument is an instance of ``Array``.

``isCasperObject()``
-------------------------------------------------------------------------------

**Signature:** ``isCasperObject(value)``

Checks if passed argument is an instance of ``Casper``.

``isClipRect()``
-------------------------------------------------------------------------------

**Signature:** ``isClipRect(value)``

Checks if passed argument is a ``cliprect`` object.

.. index:: falsiness

``isFalsy()``
-------------------------------------------------------------------------------

**Signature:** ``isFalsy(subject)``

.. versionadded:: 1.0

Returns subject `falsiness <http://11heavens.com/falsy-and-truthy-in-javascript>`_.

``isFunction()``
-------------------------------------------------------------------------------

**Signature:** ``isFunction(value)``

Checks if passed argument is a function.

``isJsFile()``
-------------------------------------------------------------------------------

**Signature:** ``isJsFile(file)``

Checks if passed filename is a Javascript one (by checking if it has a ``.js`` or ``.coffee`` file extension).

``isNull()``
-------------------------------------------------------------------------------

**Signature:** ``isNull(value)``

Checks if passed argument is a ``null``.

``isNumber()``
-------------------------------------------------------------------------------

**Signature:** ``isNumber(value)``

Checks if passed argument is an instance of ``Number``.

``isObject()``
-------------------------------------------------------------------------------

**Signature:** ``isObject(value)``

Checks if passed argument is an object.

``isString()``
-------------------------------------------------------------------------------

**Signature:** ``isString(value)``

Checks if passed argument is an instance of ``String``.

.. index:: truthiness

``isTruthy()``
-------------------------------------------------------------------------------

**Signature:** ``isTruthy(subject)``

.. versionadded:: 1.0

Returns subject `truthiness <http://11heavens.com/falsy-and-truthy-in-javascript>`_.

``isType()``
-------------------------------------------------------------------------------

**Signature:** ``isType(what, type)``

Checks if passed argument has its type matching the ``type`` argument.

``isUndefined()``
-------------------------------------------------------------------------------

**Signature:** ``isUndefined(value)``

Checks if passed argument is ``undefined``.

``isWebPage()``
-------------------------------------------------------------------------------

**Signature:** ``isWebPage(what)``

Checks if passed argument is an instance of native PhantomJS' ``WebPage`` object.

``mergeObjects()``
-------------------------------------------------------------------------------

**Signature:** ``mergeObjects(origin, add[, Object opts])``

Merges two objects recursively.

Add ``opts.keepReferences`` if cloning of internal objects is not needed.

.. index:: DOM

``node()``
-------------------------------------------------------------------------------

**Signature:** ``node(name, attributes)``

Creates an (HT\|X)ML element, having optional ``attributes`` added.

.. index:: JSON

``serialize()``
-------------------------------------------------------------------------------

**Signature:** ``serialize(value)``

Serializes a value using JSON_ format. Will serialize functions as strings. Useful for :doc:`debugging <../debugging>` and comparing objects.

``unique()``
-------------------------------------------------------------------------------

**Signature:** ``unique(array)``

Retrieves unique values from within a given ``Array``.

.. _JSON: http://json.org/
