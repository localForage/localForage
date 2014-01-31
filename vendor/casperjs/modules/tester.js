/*!
 * Casper is a navigation utility for PhantomJS.
 *
 * Documentation: http://casperjs.org/
 * Repository:    http://github.com/n1k0/casperjs
 *
 * Copyright (c) 2011-2012 Nicolas Perriault
 *
 * Part of source code is Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*global CasperError, exports, phantom, __utils__, patchRequire, require:true*/

var require = patchRequire(require);
var fs = require('fs');
var events = require('events');
var utils = require('utils');
var f = utils.format;

function AssertionError(msg, result) {
    "use strict";
    Error.call(this);
    this.message = msg;
    this.name = 'AssertionError';
    this.result = result;
}
AssertionError.prototype = new Error();
exports.AssertionError = AssertionError;

function TerminationError(msg) {
    "use strict";
    Error.call(this);
    this.message = msg;
    this.name = 'TerminationError';
}
TerminationError.prototype = new Error();
exports.TerminationError = TerminationError;

function TimedOutError(msg) {
    "use strict";
    Error.call(this);
    this.message = msg;
    this.name = 'TimedOutError';
}
TimedOutError.prototype = new Error();
exports.TimedOutError = TimedOutError;

/**
 * Creates a tester instance.
 *
 * @param  Casper  casper   A Casper instance
 * @param  Object  options  Tester options
 * @return Tester
 */
exports.create = function create(casper, options) {
    "use strict";
    return new Tester(casper, options);
};

/**
 * Casper tester: makes assertions, stores test results and display then.
 *
 * @param  Casper       casper   A valid Casper instance
 * @param  Object|null  options  Options object
 */
var Tester = function Tester(casper, options) {
    "use strict";
    /*jshint maxstatements:99*/
    if (!utils.isCasperObject(casper)) {
        throw new CasperError("Tester needs a Casper instance");
    }

    // self reference
    var self = this;

    // casper reference
    this.casper = casper;

    // public properties
    this._setUp = undefined;
    this._tearDown = undefined;
    this.aborted = false;
    this.executed = 0;
    this.currentTestFile = null;
    this.currentTestStartTime = new Date();
    this.currentSuite = undefined;
    this.currentSuiteNum = 0;
    this.lastAssertTime = 0;
    this.loadIncludes = {
        includes: [],
        pre:      [],
        post:     []
    };
    this.options = utils.mergeObjects({
        concise:  false,  // concise output?
        failFast: false,  // terminates a suite as soon as a test fails?
        failText: "FAIL", // text to use for a failed test
        passText: "PASS", // text to use for a succesful test
        skipText: "SKIP", // text to use for a skipped test
        pad:      80    , // maximum number of chars for a result line
        warnText: "WARN"  // text to use for a dubious test
    }, options);
    this.queue = [];
    this.running = false;
    this.started = false;
    this.suiteResults = new TestSuiteResult();

    this.on('success', function onSuccess(success) {
        var timeElapsed = new Date() - this.currentTestStartTime;
        this.currentSuite.addSuccess(success, timeElapsed - this.lastAssertTime);
        this.lastAssertTime = timeElapsed;
    });

    this.on('skipped', function onSkipped(skipped) {
        var timeElapsed = new Date() - this.currentTestStartTime;
        this.currentSuite.addSkip(skipped, timeElapsed - this.lastAssertTime);
        this.lastAssertTime = timeElapsed;
    });

    this.on('fail', function onFail(failure) {
        // export
        var valueKeys = Object.keys(failure.values),
            timeElapsed = new Date() - this.currentTestStartTime;
        this.currentSuite.addFailure(failure, timeElapsed - this.lastAssertTime);
        this.lastAssertTime = timeElapsed;
        // special printing
        if (failure.type) {
            this.comment('   type: ' + failure.type);
        }
        if (failure.file) {
            this.comment('   file: ' + failure.file + (failure.line ? ':' + failure.line : ''));
        }
        if (failure.lineContents) {
            this.comment('   code: ' + failure.lineContents);
        }
        if (!failure.values || valueKeys.length === 0) {
            return;
        }
        valueKeys.forEach(function(name) {
            this.comment(f('   %s: %s', name, utils.formatTestValue(failure.values[name], name)));
        }.bind(this));
        // check for fast failing
        if (this.options.failFast) {
            return this.terminate('--fail-fast: aborted all remaining tests');
        }
    });

    function errorHandler(error, backtrace) {
        self.casper.unwait();
        if (error instanceof Error) {
            self.processError(error);
            return;
        }
        if (utils.isString(error) && /^(Assertion|Termination|TimedOut)Error/.test(error)) {
            return;
        }
        var line = 0;
        try {
            line = (backtrace || []).filter(function(entry) {
                return self.currentTestFile === entry.file;
            })[0].line;
        } catch (e) {}
        self.uncaughtError(error, self.currentTestFile, line, backtrace);
    }

    function errorHandlerAndDone(error, backtrace) {
        errorHandler(error, backtrace);
        self.done();
    }

    // casper events
    this.casper.on('error', function onCasperError(msg, backtrace) {
        self.processPhantomError(msg, backtrace);
    });

    [
        'wait.error',
        'waitFor.timeout.error',
        'event.error',
        'complete.error'
    ].forEach(function(event) {
        self.casper.on(event, errorHandlerAndDone);
    });

    self.casper.on('step.error', errorHandler);

    this.casper.on('warn', function(warning) {
        if (self.currentSuite) {
            self.currentSuite.addWarning(warning);
        }
    });

    // Do not hook casper if we're not testing
    if (!phantom.casperTest) {
        return;
    }

    // specific timeout callbacks
    this.casper.options.onStepTimeout = function test_onStepTimeout(timeout, step) {
        throw new TimedOutError(f("Step timeout occured at step %s (%dms)", step, timeout));
    };

    this.casper.options.onTimeout = function test_onTimeout(timeout) {
        throw new TimedOutError(f("Timeout occured (%dms)", timeout));
    };

    this.casper.options.onWaitTimeout = function test_onWaitTimeout(timeout, details) {
        /*jshint maxcomplexity:10*/
        var message = f("Wait timeout occured (%dms)", timeout);
        details = details || {};

        if (details.selector) {
            message = f(details.waitWhile ? '"%s" never went away in %dms' : '"%s" still did not exist in %dms', details.selector, timeout);
        }
        else if (details.visible) {
            message = f(details.waitWhile ? '"%s" never disappeared in %dms' : '"%s" never appeared in %dms', details.visible, timeout);
        }
        else if (details.url || details.resource) {
            message = f('%s did not load in %dms', details.url || details.resource, timeout);
        }
        else if (details.popup) {
            message = f('%s did not pop up in %dms', details.popup, timeout);
        }
        else if (details.text) {
            message = f('"%s" did not appear in the page in %dms', details.text, timeout);
        }
        else if (details.selectorTextChange) {
            message = f('"%s" did not have a text change in %dms', details.selectorTextChange, timeout);
        }
        else if (utils.isFunction(details.testFx)) {
            message = f('"%s" did not evaluate to something truthy in %dms', details.testFx.toString(), timeout);
        }

        errorHandlerAndDone(new TimedOutError(message));
    };
};

// Tester class is an EventEmitter
utils.inherits(Tester, events.EventEmitter);
exports.Tester = Tester;

/**
 * Aborts current test suite.
 *
 * @param  String  message Warning message (optional)
 */
Tester.prototype.abort = function abort(message) {
    "use strict";
    throw new TerminationError(message || 'test suite aborted');
};

/**
 * Skip `nb` tests.
 *
 * @param  Integer  nb       Number of tests to skip
 * @param  String   message  Message to display
 * @return Object
 */
Tester.prototype.skip = function skip(nb, message) {
    "use strict";
    return this.processAssertionResult({
        success: null,
        standard: f("%d test%s skipped", nb, nb > 1 ? "s" : ""),
        message: message,
        type: "skip",
        number: nb,
        skipped: true
    });
};

/**
 * Asserts that a condition strictly resolves to true. Also returns an
 * "assertion object" containing useful informations about the test case
 * results.
 *
 * This method is also used as the base one used for all other `assert*`
 * family methods; supplementary informations are then passed using the
 * `context` argument.
 *
 * Note: an AssertionError is thrown if the assertion fails.
 *
 * @param  Boolean      subject  The condition to test
 * @param  String       message  Test description
 * @param  Object|null  context  Assertion context object (Optional)
 * @return Object                An assertion result object if test passed
 * @throws AssertionError in case the test failed
 */
Tester.prototype.assert =
Tester.prototype.assertTrue = function assert(subject, message, context) {
    "use strict";
    this.executed++;
    var result = utils.mergeObjects({
        success: subject === true,
        type: "assert",
        standard: "Subject is strictly true",
        message: message,
        file: this.currentTestFile,
        doThrow: true,
        values: {
            subject: utils.getPropertyPath(context, 'values.subject') || subject
        }
    }, context || {});
    if (!result.success && result.doThrow) {
        throw new AssertionError(message || result.standard, result);
    }
    return this.processAssertionResult(result);
};

/**
 * Asserts that two values are strictly equals.
 *
 * @param  Mixed   subject   The value to test
 * @param  Mixed   expected  The expected value
 * @param  String  message   Test description (Optional)
 * @return Object            An assertion result object
 */
Tester.prototype.assertEquals =
Tester.prototype.assertEqual = function assertEquals(subject, expected, message) {
    "use strict";
    return this.assert(utils.equals(subject, expected), message, {
        type: "assertEquals",
        standard: "Subject equals the expected value",
        values: {
            subject:  subject,
            expected: expected
        }
    });
};

/**
 * Asserts that two values are strictly not equals.
 *
 * @param  Mixed        subject   The value to test
 * @param  Mixed        expected  The unwanted value
 * @param  String|null  message   Test description (Optional)
 * @return Object                 An assertion result object
 */
Tester.prototype.assertNotEquals = function assertNotEquals(subject, shouldnt, message) {
    "use strict";
    return this.assert(!this.testEquals(subject, shouldnt), message, {
        type: "assertNotEquals",
        standard: "Subject doesn't equal what it shouldn't be",
        values: {
            subject:  subject,
            shouldnt: shouldnt
        }
    });
};

/**
 * Asserts that a selector expression matches n elements.
 *
 * @param  Mixed   selector  A selector expression
 * @param  Number  count     Expected number of matching elements
 * @param  String  message   Test description (Optional)
 * @return Object            An assertion result object
 */
Tester.prototype.assertElementCount = function assertElementCount(selector, count, message) {
    "use strict";
    if (!utils.isNumber(count) || count < 0) {
        throw new CasperError('assertElementCount() needs a positive integer count');
    }
    var elementCount = this.casper.evaluate(function(selector) {
        try {
            return __utils__.findAll(selector).length;
        } catch (e) {
            return -1;
        }
    }, selector);
    return this.assert(elementCount === count, message, {
        type: "assertElementCount",
        standard: f('%d element%s matching selector "%s" found',
                    count,
                    count > 1 ? 's' : '',
                    selector),
        values: {
            selector: selector,
            expected: count,
            obtained: elementCount
        }
    });
};

/**
 * Asserts that a code evaluation in remote DOM resolves to true.
 *
 * @param  Function  fn       A function to be evaluated in remote DOM
 * @param  String    message  Test description
 * @param  Object    params   Object/Array containing the parameters to inject into
 *                            the function (optional)
 * @return Object             An assertion result object
 */
Tester.prototype.assertEval =
Tester.prototype.assertEvaluate = function assertEval(fn, message, params) {
    "use strict";
    return this.assert(this.casper.evaluate(fn, params), message, {
        type: "assertEval",
        standard: "Evaluated function returns true",
        values: {
            fn: fn,
            params: params
        }
    });
};

/**
 * Asserts that the result of a code evaluation in remote DOM equals
 * an expected value.
 *
 * @param  Function     fn        The function to be evaluated in remote DOM
 * @param  Boolean      expected  The expected value
 * @param  String|null  message   Test description
 * @param  Object|null  params    Object containing the parameters to inject into the
 *                                function (optional)
 * @return Object                 An assertion result object
 */
Tester.prototype.assertEvalEquals =
Tester.prototype.assertEvalEqual = function assertEvalEquals(fn, expected, message, params) {
    "use strict";
    var subject = this.casper.evaluate(fn, params);
    return this.assert(utils.equals(subject, expected), message, {
        type: "assertEvalEquals",
        standard: "Evaluated function returns the expected value",
        values: {
            fn: fn,
            params: params,
            subject:  subject,
            expected: expected
        }
    });
};

function baseFieldAssert(inputName, expected, actual, message) {
    /*jshint validthis:true */
    "use strict";

    return this.assert(utils.equals(actual, expected),  message, {
        type: 'assertField',
        standard: f('"%s" input field has the value "%s"', inputName, expected),
        values: {
            inputName: inputName,
            actual: actual,
            expected: expected
         }
    });
}

/**
 * Asserts that the provided assertion fails (used for internal testing).
 *
 * @param  Function     fn       A closure calling an assertion
 * @param  String|null  message  Test description
 * @return Object                An assertion result object
 */
Tester.prototype.assertFail = function assertFail(fn, message) {
    "use strict";
    var failed = false;
    try {
        fn();
    } catch (e) {
        failed = true;
    }
    return this.assert(failed, message, {
        type: "assertFail",
        standard: "Assertion fails as expected"
    });
};

/**
 * Asserts that a given input field has the provided value.
 *
 * @param  String|Object   input      The name attribute of the input element
 *                                    or an object with the selector
 * @param  String          expected   The expected value of the input element
 * @param  String          message    Test description
 * @param  Object          options    ClientUtils#getFieldValue options (optional)
 * @return Object                     An assertion result object
 */
Tester.prototype.assertField = function assertField(input, expected, message, options) {
    "use strict";

    if (typeof input === 'object') {
        switch (input.type) {
            case 'css':
                return this.assertFieldCSS(input.path, expected, message);
            case 'xpath':
                return this.assertFieldXPath(input.path, expected, message);
            default:
                throw new CasperError('Invalid regexp.');
            // no default
        }
    }

    var actual = this.casper.evaluate(function(inputName, options) {
        return __utils__.getFieldValue(inputName, options);
    }, input, options);

    return baseFieldAssert.call(this, input, expected, actual, message);
};

/**
 * Asserts that a given input field by CSS selector has the provided value.
 *
 * @param  Object   cssSelector The CSS selector to use for the assert field value
 * @param  String   expected    The expected value of the input element
 * @param  String   message     Test description
 * @return Object               An assertion result object
 */
Tester.prototype.assertFieldCSS = function assertFieldCSS(cssSelector, expected, message) {
    "use strict";
    var actual = this.casper.evaluate(function(inputName, cssSelector) {
        return __utils__.getFieldValue(inputName, {inputSelector: cssSelector});
    }, null, cssSelector);

    return baseFieldAssert.call(this, null, expected, actual, message);
};

/**
 * Asserts that a given input field by XPath selector has the provided value.
 *
 * @param  Object   xPathSelector The XPath selector to use for the assert field value
 * @param  String   expected      The expected value of the input element
 * @param  String   message       Test description
 * @return Object                 An assertion result object
 */
Tester.prototype.assertFieldXPath = function assertFieldXPath(xPathSelector, expected, message) {
    "use strict";
    var actual = this.casper.evaluate(function(inputName, xPathSelector) {
        return __utils__.getFieldValue(inputName, {inputXPath: xPathSelector});
    }, null, xPathSelector);

    return baseFieldAssert.call(this, null, expected, actual, message);
};

/**
 * Asserts that an element matching the provided selector expression exists in
 * remote DOM.
 *
 * @param  String   selector  Selector expression
 * @param  String   message   Test description
 * @return Object             An assertion result object
 */
Tester.prototype.assertExists =
Tester.prototype.assertExist =
Tester.prototype.assertSelectorExists =
Tester.prototype.assertSelectorExist = function assertExists(selector, message) {
    "use strict";
    return this.assert(this.casper.exists(selector), message, {
        type: "assertExists",
        standard: f("Find an element matching: %s", selector),
        values: {
            selector: selector
        }
    });
};

/**
 * Asserts that an element matching the provided selector expression does not
 * exist in remote DOM.
 *
 * @param  String   selector  Selector expression
 * @param  String   message   Test description
 * @return Object             An assertion result object
 */
Tester.prototype.assertDoesntExist =
Tester.prototype.assertNotExists = function assertDoesntExist(selector, message) {
    "use strict";
    return this.assert(!this.casper.exists(selector), message, {
        type: "assertDoesntExist",
        standard: f("Fail to find element matching selector: %s", selector),
        values: {
            selector: selector
        }
    });
};

/**
 * Asserts that current HTTP status is the one passed as argument.
 *
 * @param  Number  status   HTTP status code
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertHttpStatus = function assertHttpStatus(status, message) {
    "use strict";
    var currentHTTPStatus = this.casper.currentHTTPStatus;
    return this.assert(utils.equals(this.casper.currentHTTPStatus, status), message, {
        type: "assertHttpStatus",
        standard: f("HTTP status code is: %s", status),
        values: {
            current: currentHTTPStatus,
            expected: status
        }
    });
};

/**
 * Asserts that a provided string matches a provided RegExp pattern.
 *
 * @param  String   subject  The string to test
 * @param  RegExp   pattern  A RegExp object instance
 * @param  String   message  Test description
 * @return Object            An assertion result object
 */
Tester.prototype.assertMatch =
Tester.prototype.assertMatches = function assertMatch(subject, pattern, message) {
    "use strict";
    if (utils.betterTypeOf(pattern) !== "regexp") {
        throw new CasperError('Invalid regexp.');
    }
    return this.assert(pattern.test(subject), message, {
        type: "assertMatch",
        standard: "Subject matches the provided pattern",
        values:  {
            subject: subject,
            pattern: pattern.toString()
        }
    });
};

/**
 * Asserts a condition resolves to false.
 *
 * @param  Boolean  condition  The condition to test
 * @param  String   message    Test description
 * @return Object              An assertion result object
 */
Tester.prototype.assertNot =
Tester.prototype.assertFalse = function assertNot(condition, message) {
    "use strict";
    return this.assert(!condition, message, {
        type: "assertNot",
        standard: "Subject is falsy",
        values: {
            condition: condition
        }
    });
};

/**
 * Asserts that a selector expression is not currently visible.
 *
 * @param  String  expected  selector expression
 * @param  String  message   Test description
 * @return Object            An assertion result object
 */
Tester.prototype.assertNotVisible =
Tester.prototype.assertInvisible = function assertNotVisible(selector, message) {
    "use strict";
    return this.assert(!this.casper.visible(selector), message, {
        type: "assertVisible",
        standard: "Selector is not visible",
        values: {
            selector: selector
        }
    });
};

/**
 * Asserts that the provided function called with the given parameters
 * will raise an exception.
 *
 * @param  Function  fn       The function to test
 * @param  Array     args     The arguments to pass to the function
 * @param  String    message  Test description
 * @return Object             An assertion result object
 */
Tester.prototype.assertRaises =
Tester.prototype.assertRaise =
Tester.prototype.assertThrows = function assertRaises(fn, args, message) {
    "use strict";
    var context = {
        type: "assertRaises",
        standard: "Function raises an error"
    };
    try {
        fn.apply(null, args);
        this.assert(false, message, context);
    } catch (error) {
        this.assert(true, message, utils.mergeObjects(context, {
            values: {
                error: error
            }
        }));
    }
};

/**
 * Asserts that the current page has a resource that matches the provided test
 *
 * @param  Function/String  test     A test function that is called with every response
 * @param  String           message  Test description
 * @return Object                    An assertion result object
 */
Tester.prototype.assertResourceExists =
Tester.prototype.assertResourceExist = function assertResourceExists(test, message) {
    "use strict";
    return this.assert(this.casper.resourceExists(test), message, {
        type: "assertResourceExists",
        standard: "Confirm page has resource",
        values: {
            test: test
        }
    });
};

/**
 * Asserts that given text doesn't exist in the document body.
 *
 * @param  String  text     Text not to be found
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertTextDoesntExist =
Tester.prototype.assertTextDoesntExist = function assertTextDoesntExist(text, message) {
    "use strict";
    var textFound = (this.casper.evaluate(function _evaluate() {
        return document.body.textContent || document.body.innerText;
    }).indexOf(text) === -1);
    return this.assert(textFound, message, {
        type: "assertTextDoesntExists",
        standard: "Text doesn't exist within the document body",
        values: {
            text: text
        }
    });
};

/**
 * Asserts that given text exists in the document body.
 *
 * @param  String  text     Text to be found
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertTextExists =
Tester.prototype.assertTextExist = function assertTextExists(text, message) {
    "use strict";
    var textFound = (this.casper.evaluate(function _evaluate() {
        return document.body.textContent || document.body.innerText;
    }).indexOf(text) !== -1);
    return this.assert(textFound, message, {
        type: "assertTextExists",
        standard: "Find text within the document body",
        values: {
            text: text
        }
    });
};

/**
 * Asserts a subject is truthy.
 *
 * @param  Mixed   subject  Test subject
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertTruthy = function assertTruthy(subject, message) {
    "use strict";
    /*jshint eqeqeq:false*/
    return this.assert(utils.isTruthy(subject), message, {
        type: "assertTruthy",
        standard: "Subject is truthy",
        values: {
            subject: subject
        }
    });
};

/**
 * Asserts a subject is falsy.
 *
 * @param  Mixed   subject  Test subject
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertFalsy = function assertFalsy(subject, message) {
    "use strict";
    /*jshint eqeqeq:false*/
    return this.assert(utils.isFalsy(subject), message, {
        type: "assertFalsy",
        standard: "Subject is falsy",
        values: {
            subject: subject
        }
    });
};

/**
 * Asserts that given text exists in the provided selector.
 *
 * @param  String   selector  Selector expression
 * @param  String   text      Text to be found
 * @param  String   message   Test description
 * @return Object             An assertion result object
 */
Tester.prototype.assertSelectorHasText =
Tester.prototype.assertSelectorContains = function assertSelectorHasText(selector, text, message) {
    "use strict";
    var got = this.casper.fetchText(selector);
    var textFound = got.indexOf(text) !== -1;
    return this.assert(textFound, message, {
        type: "assertSelectorHasText",
        standard: f('Find "%s" within the selector "%s"', text, selector),
        values: {
            selector: selector,
            text: text,
            actualContent: got
        }
    });
};

/**
 * Asserts that given text does not exist in the provided selector.
 *
 * @param  String   selector  Selector expression
 * @param  String   text      Text not to be found
 * @param  String   message   Test description
 * @return Object             An assertion result object
 */
Tester.prototype.assertSelectorDoesntHaveText =
Tester.prototype.assertSelectorDoesntContain = function assertSelectorDoesntHaveText(selector, text, message) {
    "use strict";
    var textFound = this.casper.fetchText(selector).indexOf(text) === -1;
    return this.assert(textFound, message, {
        type: "assertSelectorDoesntHaveText",
        standard: f('Did not find "%s" within the selector "%s"', text, selector),
        values: {
            selector: selector,
            text: text
        }
    });
};

/**
 * Asserts that title of the remote page equals to the expected one.
 *
 * @param  String  expected  The expected title string
 * @param  String  message   Test description
 * @return Object            An assertion result object
 */
Tester.prototype.assertTitle = function assertTitle(expected, message) {
    "use strict";
    var currentTitle = this.casper.getTitle();
    return this.assert(utils.equals(currentTitle, expected), message, {
        type: "assertTitle",
        standard: f('Page title is: "%s"', expected),
        values: {
            subject: currentTitle,
            expected: expected
        }
    });
};

/**
 * Asserts that title of the remote page matched the provided pattern.
 *
 * @param  RegExp  pattern  The pattern to test the title against
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertTitleMatch =
Tester.prototype.assertTitleMatches = function assertTitleMatch(pattern, message) {
    "use strict";
    if (utils.betterTypeOf(pattern) !== "regexp") {
        throw new CasperError('Invalid regexp.');
    }
    var currentTitle = this.casper.getTitle();
    return this.assert(pattern.test(currentTitle), message, {
        type: "assertTitle",
        details: "Page title does not match the provided pattern",
        values: {
            subject: currentTitle,
            pattern: pattern.toString()
        }
    });
};

/**
 * Asserts that the provided subject is of the given type.
 *
 * @param  mixed   subject  The value to test
 * @param  String  type     The javascript type name
 * @param  String  message  Test description
 * @return Object           An assertion result object
 */
Tester.prototype.assertType = function assertType(subject, type, message) {
    "use strict";
    var actual = utils.betterTypeOf(subject);
    return this.assert(utils.equals(actual, type), message, {
        type: "assertType",
        standard: f('Subject type is: "%s"', type),
        values: {
            subject: subject,
            type: type,
            actual: actual
        }
    });
};

/**
 * Asserts that the provided subject has the provided constructor in its prototype hierarchy.
 *
 * @param  mixed   subject       The value to test
 * @param  Function constructor  The javascript type name
 * @param  String  message       Test description
 * @return Object                An assertion result object
 */
Tester.prototype.assertInstanceOf = function assertInstanceOf(subject, constructor, message) {
    "use strict";
    if (utils.betterTypeOf(constructor) !== "function") {
        throw new CasperError('Subject is null or undefined.');
    }
    return this.assert(utils.betterInstanceOf(subject, constructor), message, {
        type: "assertInstanceOf",
        standard: f('Subject is instance of: "%s"', constructor.name),
        values: {
            subject: subject,
            constructorName: constructor.name
        }
    });
};

/**
 * Asserts that a the current page url matches a given pattern. A pattern may be
 * either a RegExp object or a String. The method will test if the URL matches
 * the pattern or contains the String.
 *
 * @param  RegExp|String  pattern  The test pattern
 * @param  String         message  Test description
 * @return Object                  An assertion result object
 */
Tester.prototype.assertUrlMatch =
Tester.prototype.assertUrlMatches = function assertUrlMatch(pattern, message) {
    "use strict";
    var currentUrl = this.casper.getCurrentUrl(),
        patternType = utils.betterTypeOf(pattern),
        result;
    if (patternType === "regexp") {
        result = pattern.test(currentUrl);
    } else if (patternType === "string") {
        result = currentUrl.indexOf(pattern) !== -1;
    } else {
        throw new CasperError("assertUrlMatch() only accepts strings or regexps");
    }
    return this.assert(result, message, {
        type: "assertUrlMatch",
        standard: "Current url matches the provided pattern",
        values: {
            currentUrl: currentUrl,
            pattern: pattern.toString()
        }
    });
};

/**
 * Asserts that a selector expression is currently visible.
 *
 * @param  String  expected  selector expression
 * @param  String  message   Test description
 * @return Object            An assertion result object
 */
Tester.prototype.assertVisible = function assertVisible(selector, message) {
    "use strict";
    return this.assert(this.casper.visible(selector), message, {
        type: "assertVisible",
        standard: "Selector is visible",
        values: {
            selector: selector
        }
    });
};

/**
 * Prints out a colored bar onto the console.
 *
 */
Tester.prototype.bar = function bar(text, style) {
    "use strict";
    this.casper.echo(text, style, this.options.pad);
};

/**
 * Defines a function which will be executed before every test.
 *
 * @param  Function  fn
 */
Tester.prototype.setUp = function setUp(fn) {
    "use strict";
    this._setUp = fn;
};

/**
 * Defines a function which will be executed after every test.
 *
 * @param  Function  fn
 */
Tester.prototype.tearDown = function tearDown(fn) {
    "use strict";
    this._tearDown = fn;
};

/**
 * Starts a suite.
 *
 * Can be invoked different ways:
 *
 *     casper.test.begin("suite description", plannedTests, function(test){})
 *     casper.test.begin("suite description", function(test){})
 */
Tester.prototype.begin = function begin() {
    "use strict";
    if (this.started && this.running)
        return this.queue.push(arguments);

    function getConfig(args) {
        var config = {
            setUp: function(){},
            tearDown: function(){}
        };

        if (utils.isFunction(args[1])) {
            config.test = args[1];
        } else if (utils.isObject(args[1])) {
            config = utils.mergeObjects(config, args[1]);
        } else if (utils.isNumber(args[1]) && utils.isFunction(args[2])) {
            config.planned = ~~args[1] || undefined;
            config.test = args[2];
        } else if (utils.isNumber(args[1]) && utils.isObject(args[2])) {
            config.config = utils.mergeObjects(config, args[2]);
            config.planned = ~~args[1] || undefined;
        } else {
            throw new CasperError('Invalid call');
        }

        if (!utils.isFunction(config.test))
            throw new CasperError('begin() is missing a mandatory test function');

        return config;
    }

    var description = arguments[0] || f("Untitled suite in %s", this.currentTestFile),
        config = getConfig([].slice.call(arguments)),
        next = function() {
            config.test(this, this.casper);
            if (this.options.concise)
                this.casper.echo([
                    this.colorize('PASS', 'INFO'),
                    this.formatMessage(description),
                    this.colorize(f('(%d test%s)',
                                    config.planned,
                                    config.planned > 1 ? 's' : ''), 'INFO')
                ].join(' '));
        }.bind(this);

    if (!this.options.concise)
        this.comment(description);

    this.currentSuite = new TestCaseResult({
        name: description,
        file: this.currentTestFile,
        config: config,
        planned: config.planned || undefined
    });

    this.executed = 0;
    this.running = this.started = true;

    try {
        if (config.setUp)
            config.setUp(this, this.casper);

        if (!this._setUp)
            return next();

        if (this._setUp.length > 0)
            return this._setUp.call(this, next); // async

        this._setUp.call(this);                  // sync
        next();
    } catch (err) {
        this.processError(err);
        this.done();
    }
};

/**
 * Render a colorized output. Basically a proxy method for
 * `Casper.Colorizer#colorize()`.
 *
 * @param  String  message
 * @param  String  style    The style name
 * @return String
 */
Tester.prototype.colorize = function colorize(message, style) {
    "use strict";
    return this.casper.getColorizer().colorize(message, style);
};

/**
 * Writes a comment-style formatted message to stdout.
 *
 * @param  String  message
 */
Tester.prototype.comment = function comment(message) {
    "use strict";
    this.casper.echo('# ' + message, 'COMMENT');
};

/**
 * Declares the current test suite done.
 *
 */
Tester.prototype.done = function done() {
    "use strict";
    /*jshint maxstatements:20, maxcomplexity:20*/
    var planned, config = this.currentSuite && this.currentSuite.config || {};

    if (arguments.length && utils.isNumber(arguments[0])) {
        this.casper.warn('done() `planned` arg is deprecated as of 1.1');
        planned = arguments[0];
    }

    if (config && config.tearDown && utils.isFunction(config.tearDown)) {
        try {
            config.tearDown(this, this.casper);
        } catch (error) {
            this.processError(error);
        }
    }

    var next = function() {
        if (this.currentSuite && this.currentSuite.planned &&
            this.currentSuite.planned !== this.executed + this.currentSuite.skipped &&
            !this.currentSuite.failed) {
            this.dubious(this.currentSuite.planned, this.executed, this.currentSuite.name);
        } else if (planned && planned !== this.executed) {
            // BC
            this.dubious(planned, this.executed);
        }
        if (this.currentSuite) {
            this.suiteResults.push(this.currentSuite);
            this.currentSuite = undefined;
            this.executed = 0;
        }
        this.emit('test.done');
        this.casper.currentHTTPResponse = {};
        this.running = this.started = false;
        var nextTest = this.queue.shift();
        if (nextTest) {
            this.begin.apply(this, nextTest);
        }
    }.bind(this);

    if (!this._tearDown) {
        return next();
    }

    try {
        if (this._tearDown.length > 0) {
            // async
            this._tearDown.call(this, next);
        } else {
            // sync
            this._tearDown.call(this);
            next();
        }
    } catch (error) {
        this.processError(error);
    }
};

/**
 * Marks a test as dubious, when the number of planned tests doesn't match the
 * number of actually executed one.
 *
 * @param  String  message
 */
Tester.prototype.dubious = function dubious(planned, executed, suite) {
    "use strict";
    var message = f('%s: %d tests planned, %d tests executed', suite || 'global', planned, executed);
    this.casper.warn(message);
    if (!this.currentSuite) return;
    this.currentSuite.addFailure({
        type:     "dubious",
        file:     this.currentTestFile,
        standard: message
    });
};

/**
 * Writes an error-style formatted message to stdout.
 *
 * @param  String  message
 */
Tester.prototype.error = function error(message) {
    "use strict";
    this.casper.echo(message, 'ERROR');
};

/**
 * Executes a file, wraping and evaluating its code in an isolated
 * environment where only the current `casper` instance is passed.
 *
 * @param  String  file  Absolute path to some js/coffee file
 */
Tester.prototype.exec = function exec(file) {
    "use strict";
    file = this.filter('exec.file', file) || file;
    if (!fs.isFile(file) || !utils.isJsFile(file)) {
        var e = new CasperError(f("Cannot exec %s: can only exec() files with .js or .coffee extensions",
                                  file));
        e.fileName = e.file = e.sourceURL = file;
        throw e;
    }
    this.currentTestFile = file;
    phantom.injectJs(file);
};

/**
 * Adds a failed test entry to the stack.
 *
 * @param  String  message
 * @param  Object  Failure context (optional)
 */
Tester.prototype.fail = function fail(message, context) {
    "use strict";
    context = context || {};
    return this.assert(false, message, utils.mergeObjects({
        type:    "fail",
        standard: "explicit call to fail()"
    }, context));
};

/**
 * Recursively finds all test files contained in a given directory.
 *
 * @param  String  dir  Path to some directory to scan
 */
Tester.prototype.findTestFiles = function findTestFiles(dir) {
    "use strict";
    var self = this;
    if (!fs.isDirectory(dir)) {
        return [];
    }
    var entries = fs.list(dir).filter(function _filter(entry) {
        return entry !== '.' && entry !== '..';
    }).map(function _map(entry) {
        return fs.absolute(fs.pathJoin(dir, entry));
    });
    entries.forEach(function _forEach(entry) {
        if (fs.isDirectory(entry)) {
            entries = entries.concat(self.findTestFiles(entry));
        }
    });
    return entries.filter(function _filter(entry) {
        return utils.isJsFile(fs.absolute(fs.pathJoin(dir, entry)));
    }).sort();
};

/**
 * Computes current suite identifier.
 *
 * @return String
 */
Tester.prototype.getCurrentSuiteId = function getCurrentSuiteId() {
    "use strict";
    return this.casper.test.currentSuiteNum + "-" + this.casper.step;
};

/**
 * Formats a message to highlight some parts of it.
 *
 * @param  String  message
 * @param  String  style
 */
Tester.prototype.formatMessage = function formatMessage(message, style) {
    "use strict";
    var parts = /^([a-z0-9_\.]+\(\))(.*)/i.exec(message);
    if (!parts) {
        return message;
    }
    return this.colorize(parts[1], 'PARAMETER') + this.colorize(parts[2], style);
};

/**
 * Writes an info-style formatted message to stdout.
 *
 * @param  String  message
 */
Tester.prototype.info = function info(message) {
    "use strict";
    this.casper.echo(message, 'PARAMETER');
};

/**
 * Adds a succesful test entry to the stack.
 *
 * @param  String  message
 */
Tester.prototype.pass = function pass(message) {
    "use strict";
    return this.assert(true, message, {
        type:    "pass",
        standard: "explicit call to pass()"
    });
};

function getStackEntry(error, testFile) {
    "use strict";
    if ("stackArray" in error) {
        // PhantomJS has changed the API of the Error object :-/
        // https://github.com/ariya/phantomjs/commit/c9cf14f221f58a3daf585c47313da6fced0276bc
        return error.stackArray.filter(function(entry) {
            return testFile === entry.sourceURL;
        })[0];
    }

    if (! ('stack' in error))
        return null;

    var r = /^\s*(.*)@(.*):(\d+)\s*$/gm;
    var m;
    while ((m = r.exec(error.stack))) {
        var sourceURL = m[2];
        if (sourceURL.indexOf('->') !== -1) {
            sourceURL = sourceURL.split('->')[1].trim();
        }
        if (sourceURL === testFile) {
            return { sourceURL: sourceURL, line: m[3]}
        }
    }
    return null;
}

/**
 * Processes an assertion error.
 *
 * @param  AssertionError  error
 */
Tester.prototype.processAssertionError = function(error) {
    "use strict";
    var result = error && error.result || {},
        testFile = this.currentTestFile,
        stackEntry;
    try {
        stackEntry = getStackEntry(error, testFile);
    } catch (e) {}
    if (stackEntry) {
        result.line = stackEntry.line;
        try {
            result.lineContents = fs.read(this.currentTestFile).split('\n')[result.line - 1].trim();
        } catch (e) {}
    }
    return this.processAssertionResult(result);
};

/**
 * Processes an assertion result by emitting the appropriate event and
 * printing result onto the console.
 *
 * @param  Object  result  An assertion result object
 * @return Object          The passed assertion result Object
 */
Tester.prototype.processAssertionResult = function processAssertionResult(result) {
    "use strict";
    if (!this.currentSuite) {
        // this is for BC when begin() didn't exist
        this.currentSuite = new TestCaseResult({
            name: "Untitled suite in " + this.currentTestFile,
            file: this.currentTestFile,
            planned: undefined
        });
    }
    var eventName = 'success',
        message = result.message || result.standard,
        style = 'INFO',
        status = this.options.passText;
    if (null === result.success) {
        eventName = 'skipped';
        style = 'SKIP';
        status = this.options.skipText;
    } else if (!result.success) {
        eventName = 'fail';
        style = 'RED_BAR';
        status = this.options.failText;
    }
    if (!this.options.concise) {
        this.casper.echo([this.colorize(status, style), this.formatMessage(message)].join(' '));
    }
    this.emit(eventName, result);
    return result;
};

/**
 * Processes an error.
 *
 * @param  Error  error
 */
Tester.prototype.processError = function processError(error) {
    "use strict";
    if (error instanceof AssertionError) {
        return this.processAssertionError(error);
    }
    if (error instanceof TerminationError) {
        return this.terminate(error.message);
    }
    return this.uncaughtError(error, this.currentTestFile, error.line);
};

/**
 * Processes a PhantomJS error, which is an error message and a backtrace.
 *
 * @param  String  message
 * @param  Array   backtrace
 */
Tester.prototype.processPhantomError = function processPhantomError(msg, backtrace) {
    "use strict";
    if (/^AssertionError/.test(msg)) {
        this.casper.warn('looks like you did not use begin(), which is mandatory since 1.1');
    }
    var termination = /^TerminationError:?\s?(.*)/.exec(msg);
    if (termination) {
        var message = termination[1];
        if (backtrace && backtrace[0]) {
            message += ' at ' + backtrace[0].file + backtrace[0].line;
        }
        return this.terminate(message);
    }
    this.fail(msg, {
        type: "error",
        doThrow: false,
        values: {
            error: msg,
            stack: backtrace
        }
    });
    this.done();
};

/**
 * Renders a detailed report for each failed test.
 *
 */
Tester.prototype.renderFailureDetails = function renderFailureDetails() {
    "use strict";
    if (!this.suiteResults.isFailed()) {
        return;
    }
    var failures = this.suiteResults.getAllFailures();
    this.casper.echo(f("\nDetails for the %d failed test%s:\n",
                       failures.length, failures.length > 1 ? "s" : ""), "PARAMETER");
    failures.forEach(function _forEach(failure) {
        this.casper.echo(f('In %s%s', failure.file, ~~failure.line ? ':' + ~~failure.line : ''));
        if (failure.suite) {
            this.casper.echo(f('  %s', failure.suite), "PARAMETER");
        }
        this.casper.echo(f('    %s: %s', failure.type || "unknown",
            failure.message || failure.standard || "(no message was entered)"), "COMMENT");
    }.bind(this));
};

/**
 * Render tests results, an optionally exit phantomjs.
 *
 * @param  Boolean  exit    Exit casper after results have been rendered?
 * @param  Number   status  Exit status code (default: 0)
 * @param  String   save    Optional path to file where to save the results log
 */
Tester.prototype.renderResults = function renderResults(exit, status, save) {
    "use strict";
    /*jshint maxstatements:25*/
    save = save || this.options.save;
    var exitStatus = 0,
        failed = this.suiteResults.countFailed(),
        total = this.suiteResults.countExecuted(),
        statusText,
        style,
        result;
    if (total === 0) {
        exitStatus = 1;
        statusText = this.options.warnText;
        style = 'WARN_BAR';
        result = f("%s Looks like you didn't run any test.", statusText);
    } else {
        if (this.suiteResults.isFailed()) {
            exitStatus = 1;
            statusText = this.options.failText;
            style = 'RED_BAR';
        } else {
            statusText = this.options.passText;
            style = 'GREEN_BAR';
        }
        result = f('%s %d test%s executed in %ss, %d passed, %d failed, %d dubious, %d skipped.',
                   statusText,
                   total,
                   total > 1 ? "s" : "",
                   utils.ms2seconds(this.suiteResults.calculateDuration()),
                   this.suiteResults.countPassed(),
                   failed,
                   this.suiteResults.countDubious(),
                   this.suiteResults.countSkipped());
    }
    this.casper.echo(result, style, this.options.pad);
    this.renderFailureDetails();
    if (save) {
        this.saveResults(save);
    }
    if (exit === true) {
        this.emit("exit");
        this.casper.exit(status ? ~~status : exitStatus);
    }
};

/**
 * Runs al suites contained in the paths passed as arguments.
 *
 */
Tester.prototype.runSuites = function runSuites() {
    "use strict";
    var testFiles = [], self = this;
    if (arguments.length === 0) {
        throw new CasperError("runSuites() needs at least one path argument");
    }
    this.loadIncludes.includes.forEach(function _forEachInclude(include) {
        phantom.injectJs(include);
    });
    this.loadIncludes.pre.forEach(function _forEachPreTest(preTestFile) {
        testFiles = testFiles.concat(preTestFile);
    });
    Array.prototype.forEach.call(arguments, function _forEachArgument(path) {
        if (!fs.exists(path)) {
            self.bar(f("Path %s doesn't exist", path), "RED_BAR");
        }
        if (fs.isDirectory(path)) {
            testFiles = testFiles.concat(self.findTestFiles(path));
        } else if (fs.isFile(path)) {
            testFiles.push(path);
        }
    });
    this.loadIncludes.post.forEach(function _forEachPostTest(postTestFile) {
        testFiles = testFiles.concat(postTestFile);
    });
    if (testFiles.length === 0) {
        this.bar(f("No test file found in %s, terminating.",
                   Array.prototype.slice.call(arguments)), "RED_BAR");
        this.casper.exit(1);
    }
    self.currentSuiteNum = 0;
    self.currentTestStartTime = new Date();
    self.lastAssertTime = 0;
    var interval = setInterval(function _check(self) {
        if (self.running) {
            return;
        }
        if (self.currentSuiteNum === testFiles.length || self.aborted) {
            self.emit('tests.complete');
            clearInterval(interval);
            self.aborted = false;
        } else {
            self.runTest(testFiles[self.currentSuiteNum]);
            self.currentSuiteNum++;
        }
    }, 20, this);
};

/**
 * Runs a test file
 *
 */
Tester.prototype.runTest = function runTest(testFile) {
    "use strict";
    this.bar(f('Test file: %s', testFile), 'INFO_BAR');
    this.running = true; // this.running is set back to false with done()
    this.executed = 0;
    this.exec(testFile);
};

/**
 * Terminates current suite.
 *
 */
Tester.prototype.terminate = function(message) {
    "use strict";
    if (message) {
        this.casper.warn(message);
    }
    this.done();
    this.aborted = true;
    this.emit('tests.complete');
};

/**
 * Saves results to file.
 *
 * @param  String  filename  Target file path.
 */
Tester.prototype.saveResults = function saveResults(filepath) {
    "use strict";
    var exporter = require('xunit').create();
    exporter.setResults(this.suiteResults);
    try {
        fs.write(filepath, exporter.getXML(), 'w');
        this.casper.echo(f('Result log stored in %s', filepath), 'INFO', 80);
    } catch (e) {
        this.casper.echo(f('Unable to write results to %s: %s', filepath, e), 'ERROR', 80);
    }
};

/**
 * Tests equality between the two passed arguments.
 *
 * @param  Mixed  v1
 * @param  Mixed  v2
 * @param  Boolean
 */
Tester.prototype.testEquals = Tester.prototype.testEqual = function testEquals(v1, v2) {
    "use strict";
    return utils.equals(v1, v2);
};

/**
 * Processes an error caught while running tests contained in a given test
 * file.
 *
 * @param  Error|String  error      The error
 * @param  String        file       Test file where the error occurred
 * @param  Number        line       Line number (optional)
 * @param  Array         backtrace  Error stack trace (optional)
 */
Tester.prototype.uncaughtError = function uncaughtError(error, file, line, backtrace) {
    "use strict";
    // XXX: this is NOT an assertion scratch that
    return this.processAssertionResult({
        success: false,
        type: "uncaughtError",
        file: file,
        line: ~~line,
        message: utils.isObject(error) ? error.message : error,
        values: {
            error: error,
            stack: backtrace
        }
    });
};

/**
 * Test suites array.
 *
 */
function TestSuiteResult() {}
TestSuiteResult.prototype = [];
exports.TestSuiteResult = TestSuiteResult;

/**
 * Returns the number of tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.countTotal = function countTotal() {
    "use strict";
    return this.countPassed() + this.countFailed() + this.countDubious();
};

/**
 * Returns the number of dubious results.
 *
 * @return Number
 */
TestSuiteResult.prototype.countDubious = function countDubious() {
    "use strict";
    return this.map(function(result) {
        return result.dubious;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Returns the number of executed tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.countExecuted = function countTotal() {
    "use strict";
    return this.countTotal() - this.countDubious();
};

/**
 * Returns the number of errors.
 *
 * @return Number
 */
TestSuiteResult.prototype.countErrors = function countErrors() {
    "use strict";
    return this.map(function(result) {
        return result.crashed;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Returns the number of failed tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.countFailed = function countFailed() {
    "use strict";
    return this.map(function(result) {
        return result.failed - result.dubious;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Returns the number of succesful tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.countPassed = function countPassed() {
    "use strict";
    return this.map(function(result) {
        return result.passed;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Returns the number of skipped tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.countSkipped = function countSkipped() {
    "use strict";
    return this.map(function(result) {
        return result.skipped;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Returns the number of warnings.
 *
 * @return Number
 */
TestSuiteResult.prototype.countWarnings = function countWarnings() {
    "use strict";
    return this.map(function(result) {
        return result.warned;
    }).reduce(function(a, b) {
        return a + b;
    }, 0);
};

/**
 * Checks if the suite has failed.
 *
 * @return Number
 */
TestSuiteResult.prototype.isFailed = function isFailed() {
    "use strict";
    return this.countErrors() + this.countFailed() + this.countDubious() > 0;
};

/**
 * Checks if the suite has skipped tests.
 *
 * @return Number
 */
TestSuiteResult.prototype.isSkipped = function isSkipped() {
    "use strict";
    return this.countSkipped() > 0;
};

/**
 * Returns all failures from this suite.
 *
 * @return Array
 */
TestSuiteResult.prototype.getAllFailures = function getAllFailures() {
    "use strict";
    var failures = [];
    this.forEach(function(result) {
        failures = failures.concat(result.failures);
    });
    return failures;
};

/**
 * Returns all succesful tests from this suite.
 *
 * @return Array
 */
TestSuiteResult.prototype.getAllPasses = function getAllPasses() {
    "use strict";
    var passes = [];
    this.forEach(function(result) {
        passes = passes.concat(result.passes);
    });
    return passes;
};

/**
 * Returns all skipped tests from this suite.
 *
 * @return Array
 */
TestSuiteResult.prototype.getAllSkips = function getAllSkips() {
    "use strict";
    var skipped = [];
    this.forEach(function(result) {
        skipped = skipped.concat(result.skipped);
    });
    return skipped;
};

/**
 * Returns all results from this suite.
 *
 * @return Array
 */
TestSuiteResult.prototype.getAllResults = function getAllResults() {
    "use strict";
    return this.getAllPasses().concat(this.getAllFailures());
};

/**
 * Computes the sum of all durations of the tests which were executed in the
 * current suite.
 *
 * @return Number
 */
TestSuiteResult.prototype.calculateDuration = function calculateDuration() {
    "use strict";
    return this.getAllResults().map(function(result) {
        return ~~result.time;
    }).reduce(function add(a, b) {
        return a + b;
    }, 0);
};

/**
 * Test suite results object.
 *
 * @param Object  options
 */
function TestCaseResult(options) {
    "use strict";
    this.name = options && options.name;
    this.file = options && options.file;
    this.planned = ~~(options && options.planned) || undefined;
    this.errors = [];
    this.failures = [];
    this.passes = [];
    this.skips = [];
    this.warnings = [];
    this.config = options && options.config;
    this.__defineGetter__("assertions", function() {
        return this.passed + this.failed;
    });
    this.__defineGetter__("crashed", function() {
        return this.errors.length;
    });
    this.__defineGetter__("failed", function() {
        return this.failures.length;
    });
    this.__defineGetter__("dubious", function() {
        return this.failures.filter(function(failure) {
            return failure.type === "dubious";
        }).length;
    });
    this.__defineGetter__("passed", function() {
        return this.passes.length;
    });
    this.__defineGetter__("skipped", function() {
        return this.skips.map(function(skip) {
            return skip.number;
        }).reduce(function(a, b) {
            return a + b;
        }, 0);
    });
}
exports.TestCaseResult = TestCaseResult;

/**
 * Adds a failure record and its execution time.
 *
 * @param Object  failure
 * @param Number  time
 */
TestCaseResult.prototype.addFailure = function addFailure(failure, time) {
    "use strict";
    failure.suite = this.name;
    failure.time = time;
    this.failures.push(failure);
};

/**
 * Adds an error record.
 *
 * @param Object  failure
 */
TestCaseResult.prototype.addError = function addFailure(error) {
    "use strict";
    error.suite = this.name;
    this.errors.push(error);
};

/**
 * Adds a success record and its execution time.
 *
 * @param Object  success
 * @param Number  time
 */
TestCaseResult.prototype.addSuccess = function addSuccess(success, time) {
    "use strict";
    success.suite = this.name;
    success.time = time;
    this.passes.push(success);
};

/**
 * Adds a success record and its execution time.
 *
 * @param Object  success
 * @param Number  time
 */
TestCaseResult.prototype.addSkip = function addSkip(skipped, time) {
    "use strict";
    skipped.suite = this.name;
    skipped.time = time;
    this.skips.push(skipped);
};


/**
 * Adds a warning record.
 *
 * @param Object  warning
 */
TestCaseResult.prototype.addWarning = function addWarning(warning) {
    "use strict";
    warning.suite = this.name;
    this.warnings.push(warning);
};

/**
 * Computes total duration for this suite.
 *
 * @return  Number
 */
TestCaseResult.prototype.calculateDuration = function calculateDuration() {
    "use strict";
    function add(a, b) {
        return a + b;
    }
    var passedTimes = this.passes.map(function(success) {
        return ~~success.time;
    }).reduce(add, 0);
    var failedTimes = this.failures.map(function(failure) {
        return ~~failure.time;
    }).reduce(add, 0);
    return passedTimes + failedTimes;
};
