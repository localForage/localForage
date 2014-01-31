.. _tester_module:

.. index:: Testing

=====================
The ``tester`` module
=====================

Casper ships with a ``tester`` module and a ``Tester`` class providing an API for unit & functional testing purpose. By default you can access an instance of this class through the ``test`` property of any ``Casper`` class instance.

.. note::

   The best way to learn how to use the Tester API and see it in action is probably to have a look at `CasperJS' own test suites <https://github.com/n1k0/casperjs/blob/master/tests/suites/>`_.


The ``Tester`` prototype
++++++++++++++++++++++++

``assert()``
-------------------------------------------------------------------------------

**Signature:** ``assert(Boolean condition[, String message])``

Asserts that the provided condition strictly resolves to a boolean ``true``::

    casper.test.assert(true, "true's true");
    casper.test.assert(!false, "truth is out");

.. seealso:: `assertNot()`_

.. index:: DOM

``assertDoesntExist()``
-------------------------------------------------------------------------------

**Signature:** ``assertDoesntExist(String selector[, String message])``

Asserts that an element matching the provided :ref:`selector expression <selectors>` doesn't exists within the remote DOM environment::

    casper.test.begin('assertDoesntExist() tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent('<div class="heaven"></div>');
            test.assertDoesntExist('.taxes');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertExists()`_

``assertEquals()``
-------------------------------------------------------------------------------

**Signature:** ``assertEquals(mixed testValue, mixed expected[, String message])``

Asserts that two values are strictly equivalent::

    casper.test.begin('assertEquals() tests', 3, function(test) {
        test.assertEquals(1 + 1, 2);
        test.assertEquals([1, 2, 3], [1, 2, 3]);
        test.assertEquals({a: 1, b: 2}, {a: 1, b: 2});
        test.done();
    });

.. seealso:: `assertNotEquals()`_

.. index:: evaluate

``assertEval()``
-------------------------------------------------------------------------------

**Signature:** ``assertEval(Function fn[, String message, Mixed arguments])``

Asserts that a :ref:`code evaluation in remote DOM <casper_evaluate>` strictly resolves to a boolean ``true``::

    casper.test.begin('assertEval() tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent('<div class="heaven">beer</div>');
            test.assertEval(function() {
                return __utils__.findOne('.heaven').textContent === 'beer';
            });
        }).run(function() {
            test.done();
        });
    });

``assertEvalEquals()``
-------------------------------------------------------------------------------

**Signature:** ``assertEvalEquals(Function fn, mixed expected[, String message, Mixed arguments])``

Asserts that the result of a :ref:`code evaluation in remote DOM <casper_evaluate>` strictly equals to the expected value::

    casper.test.begin('assertEvalEquals() tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent('<div class="heaven">beer</div>');
            test.assertEvalEquals(function() {
                return __utils__.findOne('.heaven').textContent;
            }, 'beer');
        }).run(function() {
            test.done();
        });
    });

.. _tester_assertelementcount:

``assertElementCount()``
-------------------------------------------------------------------------------

**Signature:** ``assertElementCount(String selector, Number count[, String message])``

Asserts that a :ref:`selector expression <selectors>` matches a given number of elements::

    casper.test.begin('assertElementCount() tests', 3, function(test) {
        casper.start().then(function() {
            this.page.content = '<ul><li>1</li><li>2</li><li>3</li></ul>';
            test.assertElementCount('ul', 1);
            test.assertElementCount('li', 3);
            test.assertElementCount('address', 0);
        }).run(function() {
            test.done();
        });
    });

.. index:: DOM

``assertExists()``
-------------------------------------------------------------------------------

**Signature:** ``assertExists(String selector[, String message])``

Asserts that an element matching the provided :ref:`selector expression <selectors>` exists in remote DOM environment::

    casper.test.begin('assertExists() tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent('<div class="heaven">beer</div>');
            test.assertExists('.heaven');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertDoesntExist()`_

.. index:: falsiness

``assertFalsy()``
-------------------------------------------------------------------------------

**Signature:** ``assertFalsy(Mixed subject[, String message])``

.. versionadded:: 1.0

Asserts that a given subject is `falsy <http://11heavens.com/falsy-and-truthy-in-javascript>`_.

.. seealso:: `assertTruthy()`_

.. index:: Form

``assertField()``
-------------------------------------------------------------------------------

**Signature:** ``assertField(String|Object input, String expected[, String message, Object options])``

Asserts that a given form field has the provided value with input name or :ref:`selector expression <selectors>`::

    casper.test.begin('assertField() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            this.fill('form[name="gs"]', { q: 'plop' }, false);
            test.assertField('q', 'plop');
        }).run(function() {
            test.done();
        });
    });

    // Path usage with type 'css'
    casper.test.begin('assertField() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            this.fill('form[name="gs"]', { q: 'plop' }, false);
            test.assertField({type: 'css', path: '.q.foo'}, 'plop');
        }).run(function() {
            test.done();
        });
    });

.. versionadded:: 1.0

This also works with any input type: ``select``, ``textarea``, etc.

.. versionadded:: 1.1

The `options` parameter allows to set the options to use with
:ref:`ClientUtils#getFieldValue() <clientutils_getfieldvalue>`.

`input` parameter introspects whether or not a `type` key is passed in with `xpath` or `css` and a property `path` specified along with it.

``assertFieldName()``
-------------------------------------------------------------------------------

**Signature:** ``assertFieldName(String inputName, String expected[, String message, Object options])``

.. versionadded:: 1.1-beta3

Asserts that a given form field has the provided value::

    casper.test.begin('assertField() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            this.fill('form[name="gs"]', { q: 'plop' }, false);
            test.assertField('q', 'plop', 'did not plop', {formSelector: 'plopper'});
        }).run(function() {
            test.done();
        });
    });

``assertFieldCSS()``
-------------------------------------------------------------------------------

**Signature:** ``assertFieldCSS(String cssSelector, String expected, String message)``

.. versionadded:: 1.1

Asserts that a given form field has the provided value given a CSS selector::

    casper.test.begin('assertField() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            this.fill('form[name="gs"]', { q: 'plop' }, false);
            test.assertField('q', 'plop', 'did not plop', 'input.plop');
        }).run(function() {
            test.done();
        });
    });

``assertFieldXPath()``
-------------------------------------------------------------------------------

**Signature:** ``assertFieldXPath(String xpathSelector, String expected, String message)``

.. versionadded:: 1.1

Asserts that a given form field has the provided value given a XPath selector::

    casper.test.begin('assertField() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            this.fill('form[name="gs"]', { q: 'plop' }, false);
            test.assertField('q', 'plop', 'did not plop', '/html/body/form[0]/input[1]');
        }).run(function() {
            test.done();
        });
    });


.. index:: HTTP, HTTP Status Code

``assertHttpStatus()``
-------------------------------------------------------------------------------

**Signature:** ``assertHttpStatus(Number status[, String message])``

Asserts that current `HTTP status code <http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html>`_ is the same as the one passed as argument::

    casper.test.begin('casperjs.org is up and running', 1, function(test) {
        casper.start('http://casperjs.org/', function() {
            test.assertHttpStatus(200);
        }).run(function() {
            test.done();
        });
    });

``assertMatch()``
-------------------------------------------------------------------------------

**Signature:** ``assertMatch(mixed subject, RegExp pattern[, String message])``

Asserts that a provided string matches a provided javascript ``RegExp`` pattern::

    casper.test.assertMatch('Chuck Norris', /^chuck/i, 'Chuck Norris\' first name is Chuck');

.. seealso::

   - `assertUrlMatch()`_
   - `assertTitleMatch()`_

``assertNot()``
-------------------------------------------------------------------------------

**Signature:** ``assertNot(mixed subject[, String message])``

Asserts that the passed subject resolves to some `falsy value <http://11heavens.com/falsy-and-truthy-in-javascript>`_::

    casper.test.assertNot(false, "Universe is still operational");

.. seealso:: `assert()`_

``assertNotEquals()``
-------------------------------------------------------------------------------

**Signature:** ``assertNotEquals(mixed testValue, mixed expected[, String message])``

.. versionadded:: 0.6.7

Asserts that two values are **not** strictly equals::

    casper.test.assertNotEquals(true, "true");

.. seealso:: `assertEquals()`_

``assertNotVisible()``
-------------------------------------------------------------------------------

**Signature:** ``assertNotVisible(String selector[, String message])``

Asserts that the element matching the provided :ref:`selector expression <selectors>` is not visible::

    casper.test.begin('assertNotVisible() tests', 1, function(test) {
        casper.start().then(function() {
            this.setContent('<div class="foo" style="display:none>boo</div>');
            test.assertNotVisible('.foo');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertVisible()`_

.. index:: error

``assertRaises()``
-------------------------------------------------------------------------------

**Signature:** ``assertRaises(Function fn, Array args[, String message])``

Asserts that the provided function called with the given parameters raises a javascript ``Error``::

    casper.test.assertRaises(function(throwIt) {
        if (throwIt) {
            throw new Error('thrown');
        }
    }, [true], 'Error has been raised.');

    casper.test.assertRaises(function(throwIt) {
        if (throwIt) {
            throw new Error('thrown');
        }
    }, [false], 'Error has been raised.'); // fails

``assertSelectorDoesntHaveText()``
-------------------------------------------------------------------------------

**Signature:** ``assertSelectorDoesntHaveText(String selector, String text[, String message])``

Asserts that given text does not exist in all the elements matching the provided :ref:`selector expression <selectors>`::

    casper.test.begin('assertSelectorDoesntHaveText() tests', 1, function(test) {
        casper.start('http://google.com/', function() {
            test.assertSelectorDoesntHaveText('title', 'Yahoo!');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertSelectorHasText()`_

.. index:: selector, DOM

``assertSelectorHasText()``
-------------------------------------------------------------------------------

**Signature:** ``assertSelectorHasText(String selector, String text[, String message])``

Asserts that given text exists in elements matching the provided :ref:`selector expression <selectors>`::

    casper.test.begin('assertSelectorHasText() tests', 1, function(test) {
        casper.start('http://google.com/', function() {
            test.assertSelectorHasText('title', 'Google');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertSelectorDoesntHaveText()`_

.. index:: HTTP

``assertResourceExists()``
-------------------------------------------------------------------------------

**Signature:** ``assertResourceExists(Function testFx[, String message])``

The ``testFx`` function is executed against all loaded assets and the test passes when at least one resource matches::

    casper.test.begin('assertResourceExists() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertResourceExists(function(resource) {
                return resource.url.match('logo3w.png');
            });
        }).run(function() {
            test.done();
        });
    });

Shorter::

    casper.test.begin('assertResourceExists() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertResourceExists('logo3w.png');
        }).run(function() {
            test.done();
        });
    });

.. hint::

   Check the documentation for :ref:`Casper.resourceExists() <casper_resourceexists>`.

``assertTextExists()``
-------------------------------------------------------------------------------

**Signature:** ``assertTextExists(String expected[, String message])``

Asserts that body **plain text content** contains the given string::

    casper.test.begin('assertTextExists() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertTextExists('google', 'page body contains "google"');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertTextDoesntExist()`_

``assertTextDoesntExist()``
-------------------------------------------------------------------------------

**Signature:** ``assertTextDoesntExist(String unexpected[, String message])``

.. versionadded:: 1.0

Asserts that body **plain text content** doesn't contain the given string::

    casper.test.begin('assertTextDoesntExist() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertTextDoesntExist('bing', 'page body does not contain "bing"');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertTextExists()`_

``assertTitle()``
-------------------------------------------------------------------------------

**Signature:** ``assertTitle(String expected[, String message])``

Asserts that title of the remote page equals to the expected one::

    casper.test.begin('assertTitle() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertTitle('Google', 'google.fr has the correct title');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertTitleMatch()`_

``assertTitleMatch()``
-------------------------------------------------------------------------------

**Signature:** ``assertTitleMatch(RegExp pattern[, String message])``

Asserts that title of the remote page matches the provided RegExp pattern::

    casper.test.begin('assertTitleMatch() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertTitleMatch(/Google/, 'google.fr has a quite predictable title');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertTitle()`_

.. index:: truthiness

``assertTruthy()``
-------------------------------------------------------------------------------

**Signature:** ``assertTruthy(Mixed subject[, String message])``

.. versionadded:: 1.0

Asserts that a given subject is `truthy <http://11heavens.com/falsy-and-truthy-in-javascript>`_.

.. seealso:: `assertFalsy()`_

.. index:: Type

``assertType()``
-------------------------------------------------------------------------------

**Signature:** ``assertType(mixed input, String type[, String message])``

Asserts that the provided input is of the given type::

    casper.test.begin('assertType() tests', 1, function suite(test) {
        test.assertType(42, "number", "Okay, 42 is a number");
        test.assertType([1, 2, 3], "array", "We can test for arrays too!");
        test.done();
    });

.. note:: Type names are always expressed in lower case.

.. index:: InstanceOf

``assertInstanceOf()``
-------------------------------------------------------------------------------

**Signature:** ``assertInstanceOf(mixed input, Function constructor[, String message])``

.. versionadded:: 1.1

Asserts that the provided input is of the given constructor::

    function Cow() {
        this.moo = function moo() {
            return 'moo!';
        };
    }
    casper.test.begin('assertInstanceOf() tests', 2, function suite(test) {
        var daisy = new Cow();
        test.assertInstanceOf(daisy, Cow, "Ok, daisy is a cow.");
        test.assertInstanceOf(["moo", "boo"], Array, "We can test for arrays too!");
        test.done();
    });

.. index:: URL

``assertUrlMatch()``
-------------------------------------------------------------------------------

**Signature:** ``assertUrlMatch(Regexp pattern[, String message])``

Asserts that the current page url matches the provided RegExp pattern::

    casper.test.begin('assertUrlMatch() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertUrlMatch(/^http:\/\//, 'google.fr is served in http://');
        }).run(function() {
            test.done();
        });
    });

.. index:: DOM

``assertVisible()``
-------------------------------------------------------------------------------

**Signature:** ``assertVisible(String selector[, String message])``

Asserts that the element matching the provided :ref:`selector expression <selectors>` is visible::

    casper.test.begin('assertVisible() tests', 1, function(test) {
        casper.start('http://www.google.fr/', function() {
            test.assertVisible('h1');
        }).run(function() {
            test.done();
        });
    });

.. seealso:: `assertNotVisible()`_

.. _tester_begin:

.. index:: Test suite, planned tests, Asynchronicity, Termination

``begin()``
-------------------------------------------------------------------------------

**Signatures:**

- ``begin(String description, Number planned, Function suite)``
- ``begin(String description, Function suite)``
- ``begin(String description, Number planned, Object config)``
- ``begin(String description, Object config)``

.. versionadded:: 1.1

Starts a suite of ``<planned>`` tests (if defined). The ``suite`` callback will get the current ``Tester`` instance as its first argument::

    function Cow() {
        this.mowed = false;
        this.moo = function moo() {
            this.mowed = true; // mootable state: don't do that
            return 'moo!';
        };
    }

    // unit style synchronous test case
    casper.test.begin('Cow can moo', 2, function suite(test) {
        var cow = new Cow();
        test.assertEquals(cow.moo(), 'moo!');
        test.assert(cow.mowed);
        test.done();
    });

.. note::

   The ``planned`` argument is especially useful in case a given test script is abruptly interrupted leaving you with no obvious way to know it and an erroneously successful status.

A more asynchronous example::

    casper.test.begin('Casperjs.org is navigable', 2, function suite(test) {
        casper.start('http://casperjs.org/', function() {
            test.assertTitleMatches(/casperjs/i);
            this.clickLabel('Testing');
        });

        casper.then(function() {
            test.assertUrlMatches(/testing\.html$/);
        });

        casper.run(function() {
            test.done();
        });
    });

.. important::

   `done()`_ **must** be called in order to terminate the suite. This is specially important when doing asynchronous tests so ensure it's called when everything has actually been performed.

.. seealso:: `done()`_

``Tester#begin()`` also accepts a test configuration object, so you can add ``setUp()`` and ``tearDown()`` methods::

    // cow-test.js
    casper.test.begin('Cow can moo', 2, {
        setUp: function(test) {
            this.cow = new Cow();
        },

        tearDown: function(test) {
            this.cow.destroy();
        },

        test: function(test) {
            test.assertEquals(this.cow.moo(), 'moo!');
            test.assert(this.cow.mowed);
            test.done();
        }
    });

.. index:: Colors

``colorize()``
-------------------------------------------------------------------------------

**Signature:** ``colorize(String message, String style)``

Render a colorized output. Basically a proxy method for ``Casper.Colorizer#colorize()``.

``comment()``
-------------------------------------------------------------------------------

**Signature:** ``comment(String message)``

Writes a comment-style formatted message to stdout::

    casper.test.comment("Hi, I'm a comment");

.. _tester_done:

.. index:: Test suite, Asynchronicity, Termination, done()

``done()``
-------------------------------------------------------------------------------

**Signature:** ``done()``

.. versionchanged:: 1.1 ``planned`` parameter is deprecated

Flag a test suite started with `begin()`_ as processed::

    casper.test.begin('my test suite', 2, function(test) {
        test.assert(true);
        test.assertNot(false);
        test.done();
    });

More asynchronously::

    casper.test.begin('Casperjs.org is navigable', 2, function suite(test) {
        casper.start('http://casperjs.org/', function() {
            test.assertTitleMatches(/casperjs/i);
            this.clickLabel('Testing');
        });

        casper.then(function() {
            test.assertUrlMatches(/testing\.html$/);
        });

        casper.run(function() {
            test.done();
        });
    });

.. seealso:: `begin()`_

``error()``
-------------------------------------------------------------------------------

**Signature:** ``error(String message)``

Writes an error-style formatted message to stdout::

    casper.test.error("Hi, I'm an error");

.. index:: Test failure

``fail()``
-------------------------------------------------------------------------------

**Signature:** ``fail(String message)``

Adds a failed test entry to the stack::

    casper.test.fail("Georges W. Bush");

.. seealso:: `pass()`_

``formatMessage()``
-------------------------------------------------------------------------------

**Signature:** ``formatMessage(String message, String style)``

Formats a message to highlight some parts of it. Only used internally by the tester.

``getFailures()``
-------------------------------------------------------------------------------

**Signature:** ``getFailures()``

.. versionadded:: 1.0

.. deprecated:: 1.1

Retrieves failures for current test suite::

    casper.test.assertEquals(true, false);
    require('utils').dump(casper.test.getFailures());
    casper.test.done();

That will give something like this:

.. code-block:: text

    $ casperjs test test-getFailures.js
    Test file: test-getFailures.js
    FAIL Subject equals the expected value
    #    type: assertEquals
    #    subject: true
    #    expected: false
    {
        "length": 1,
        "cases": [
            {
                "success": false,
                "type": "assertEquals",
                "standard": "Subject equals the expected value",
                "file": "test-getFailures.js",
                "values": {
                    "subject": true,
                    "expected": false
                }
            }
        ]
    }
    FAIL 1 tests executed, 0 passed, 1 failed.

    Details for the 1 failed test:

    In c.js:0
       assertEquals: Subject equals the expected value

.. note::

    In CasperJS 1.1, you can store test successes by recording them listening to the tester ``pass`` event::

        var failures = [];

        casper.test.on("fail", function(failure) {
          failures.push(failure);
        });

``getPasses()``
-------------------------------------------------------------------------------

**Signature:** ``getPasses()``

.. versionadded:: 1.0

.. deprecated:: 1.1

Retrieves a report for successful test cases in the current test suite::

    casper.test.assertEquals(true, true);
    require('utils').dump(casper.test.getPasses());
    casper.test.done();

That will give something like this::

    $ casperjs test test-getPasses.js
    Test file: test-getPasses.js
    PASS Subject equals the expected value
    {
        "length": 1,
        "cases": [
            {
                "success": true,
                "type": "assertEquals",
                "standard": "Subject equals the expected value",
                "file": "test-getPasses.js",
                "values": {
                    "subject": true,
                    "expected": true
                }
            }
        ]
    }
    PASS 1 tests executed, 1 passed, 0 failed.

.. note::

   In CasperJS 1.1, you can store test successes by recording them listening to the tester ``pass`` event::

       var successes = [];

       casper.test.on("pass", function(success) {
         successes.push(success);
       });

``info()``
-------------------------------------------------------------------------------

**Signature:** ``info(String message)``

Writes an info-style formatted message to stdout::

    casper.test.info("Hi, I'm an informative message.");

.. index:: Test success

``pass()``
-------------------------------------------------------------------------------

**Signature:** ``pass(String message)``

Adds a successful test entry to the stack::

    casper.test.pass("Barrack Obama");

.. seealso:: `fail()`_

``renderResults()``
-------------------------------------------------------------------------------

**Signature:** ``renderResults(Boolean exit, Number status, String save)``

Render test results, save results in an XUnit formatted file, and optionally exits phantomjs::

    casper.test.renderResults(true, 0, 'test-results.xml');

.. note::

   This method is not to be called when using the ``casperjs test`` command (see documentation for :doc:`testing <../testing>`), where it's done automatically for you.

``setUp()``
-------------------------------------------------------------------------------

**Signature:** ``setUp([Function fn])``

Defines a function which will be executed before every test defined using `begin()`_::

    casper.test.setUp(function() {
        casper.start().userAgent('Mosaic 0.1');
    });

To perform asynchronous operations, use the ``done`` argument::

    casper.test.setUp(function(done) {
        casper.start('http://foo').then(function() {
            // ...
        }).run(done);
    });

.. warning::

   Don't specify the ``done`` argument if you don't intend to use the method asynchronously.

.. seealso:: `tearDown()`_

``skip()``
-------------------------------------------------------------------------------

**Signature:** ``skip(Number nb, String message)``

Skips a given number of planned tests::

    casper.test.begin('Skip tests', 4, function(test) {
        test.assert(true, 'First test executed');
        test.assert(true, 'Second test executed');
        test.skip(2, 'Two tests skipped');
        test.done();
    });

``tearDown()``
-------------------------------------------------------------------------------

**Signature:** ``tearDown([Function fn])``

Defines a function which will be executed before after every test defined using `begin()`_::

    casper.test.tearDown(function() {
        casper.echo('See ya');
    });

To perform asynchronous operations, use the ``done`` argument::

    casper.test.tearDown(function(done) {
        casper.start('http://foo/goodbye').then(function() {
            // ...
        }).run(done);
    });

.. warning::

   Don't specify the ``done`` argument if you don't intend to use the method asynchronously.

.. seealso:: `setUp()`_
