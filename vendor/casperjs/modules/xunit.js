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

/*global CasperError, console, exports, phantom, patchRequire, require:true*/

var require = patchRequire(require);
var utils = require('utils');
var fs = require('fs');
var TestSuiteResult = require('tester').TestSuiteResult;

/**
 * Generates a value for 'classname' attribute of the JUnit XML report.
 *
 * Uses the (relative) file name of the current casper script without file
 * extension as classname.
 *
 * @param  String  classname
 * @return String
 */
function generateClassName(classname) {
    "use strict";
    classname = (classname || "").replace(phantom.casperPath, "").trim();
    var script = classname || phantom.casperScript || "";
    if (script.indexOf(fs.workingDirectory) === 0) {
        script = script.substring(fs.workingDirectory.length + 1);
    }
    if (script.indexOf('/') === 0) {
        script = script.substring(1, script.length);
    }
    if (~script.indexOf('.')) {
        script = script.substring(0, script.lastIndexOf('.'));
    }
    // If we have trimmed our string down to nothing, default to script name
    if (!script && phantom.casperScript) {
        script = phantom.casperScript;
    }
    return script || "unknown";
}

/**
 * Creates a XUnit instance
 *
 * @return XUnit
 */
exports.create = function create() {
    "use strict";
    return new XUnitExporter();
};

/**
 * JUnit XML (xUnit) exporter for test results.
 *
 */
function XUnitExporter() {
    "use strict";
    this.results = undefined;
    this._xml = utils.node('testsuites');
    this._xml.toString = function toString() {
        var serializer = new XMLSerializer();
        return '<?xml version="1.0" encoding="UTF-8"?>' + serializer.serializeToString(this);
    };
}
exports.XUnitExporter = XUnitExporter;

/**
 * Retrieves generated XML object - actually an HTMLElement.
 *
 * @return HTMLElement
 */
XUnitExporter.prototype.getXML = function getXML() {
    "use strict";
    if (!(this.results instanceof TestSuiteResult)) {
        throw new CasperError('Results not set, cannot get XML.');
    }
    this.results.forEach(function(result) {
        var suiteNode = utils.node('testsuite', {
            name: result.name,
            tests: result.assertions,
            failures: result.failed,
            errors: result.crashed,
            time: utils.ms2seconds(result.calculateDuration()),
            timestamp: (new Date()).toISOString(),
            'package': generateClassName(result.file)
        });
        // succesful test cases
        result.passes.forEach(function(success) {
            var testCase = utils.node('testcase', {
                name: success.message || success.standard,
                classname: generateClassName(success.file),
                time: utils.ms2seconds(~~success.time)
            });
            suiteNode.appendChild(testCase);
        });
        // failed test cases
        result.failures.forEach(function(failure) {
            var testCase = utils.node('testcase', {
                name: failure.message || failure.standard,
                classname: generateClassName(failure.file),
                time: utils.ms2seconds(~~failure.time)
            });
            var failureNode = utils.node('failure', {
                type: failure.type || "failure"
            });
            failureNode.appendChild(document.createTextNode(failure.message || "no message left"));
            if (failure.values && failure.values.error instanceof Error) {
                var errorNode = utils.node('error', {
                    type: utils.betterTypeOf(failure.values.error)
                });
                errorNode.appendChild(document.createTextNode(failure.values.error.stack));
                testCase.appendChild(errorNode);
            }
            testCase.appendChild(failureNode);
            suiteNode.appendChild(testCase);
        });
        // errors
        result.errors.forEach(function(error) {
            var errorNode = utils.node('error', {
                type: error.name
            });
            errorNode.appendChild(document.createTextNode(error.stack ? error.stack : error.message));
            suiteNode.appendChild(errorNode);
        });
        // warnings
        var warningNode = utils.node('system-out');
        warningNode.appendChild(document.createTextNode(result.warnings.join('\n')));
        suiteNode.appendChild(warningNode);
        this._xml.appendChild(suiteNode);
    }.bind(this));
    this._xml.setAttribute('time', utils.ms2seconds(this.results.calculateDuration()));
    return this._xml;
};

/**
 * Sets test results.
 *
 * @param TestSuite  results
 */
XUnitExporter.prototype.setResults = function setResults(results) {
    "use strict";
    if (!(results instanceof TestSuiteResult)) {
        throw new CasperError('Invalid results type.');
    }
    this.results = results;
    return results;
};
