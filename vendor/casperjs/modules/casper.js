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

/*global CasperError, console, exports, phantom, __utils__, patchRequire, require:true*/

var require = patchRequire(require);
var colorizer = require('colorizer');
var events = require('events');
var fs = require('fs');
var http = require('http');
var mouse = require('mouse');
var pagestack = require('pagestack');
var qs = require('querystring');
var tester = require('tester');
var utils = require('utils');
var f = utils.format;


var defaultUserAgent = phantom.defaultPageSettings.userAgent
    .replace(/(PhantomJS|SlimerJS)/, f("CasperJS/%s", phantom.casperVersion) + '+$&');

exports.create = function create(options) {
    "use strict";
    // This is a bit of a hack to check if one is trying to override the preconfigured
    // casper instance from within a test environment.
    if (phantom.casperTest && window.casper) {
        console.error("Fatal: you can't override the preconfigured casper instance in a test environment.");
        console.error("Docs: http://docs.casperjs.org/en/latest/testing.html#test-command-args-and-options");
        phantom.exit(1);
    }
    return new Casper(options);
};

/**
 * Shortcut to build an XPath selector object.
 *
 * @param  String  expression  The XPath expression
 * @return Object
 * @see    http://casperjs.org/selectors.html
 */
function selectXPath(expression) {
    "use strict";
    return {
        type: 'xpath',
        path: expression,
        toString: function() {
            return this.type + ' selector: ' + this.path;
        }
    };
}
exports.selectXPath = selectXPath;

/**
 * Main Casper object.
 *
 * @param  Object  options  Casper options
 */
var Casper = function Casper(options) {
    "use strict";
    /*jshint maxstatements:40*/
    // init & checks
    if (!(this instanceof Casper)) {
        return new Casper(options);
    }
    // default options
    this.defaults = {
        clientScripts:       [],
        colorizerType:       'Colorizer',
        exitOnError:         true,
        logLevel:            "error",
        httpStatusHandlers:  {},
        safeLogs:            true,
        onAlert:             null,
        onDie:               null,
        onError:             null,
        onLoadError:         null,
        onPageInitialized:   null,
        onResourceReceived:  null,
        onResourceRequested: null,
        onRunComplete:       function _onRunComplete() {
            this.exit();
        },
        onStepComplete:      null,
        onStepTimeout:       function _onStepTimeout(timeout, stepNum) {
            this.die("Maximum step execution timeout exceeded for step " + stepNum);
        },
        onTimeout:           function _onTimeout(timeout) {
            this.die(f("Script timeout of %dms reached, exiting.", timeout));
        },
        onWaitTimeout:       function _onWaitTimeout(timeout) {
            this.die(f("Wait timeout of %dms expired, exiting.", timeout));
        },
        page:                null,
        pageSettings:        {
            localToRemoteUrlAccessEnabled: true,
            userAgent:                     defaultUserAgent
        },
        remoteScripts:       [],
        silentErrors:        false,
        stepTimeout:         null,
        timeout:             null,
        verbose:             false,
        retryTimeout:        20,
        waitTimeout:         5000,
        clipRect : null,
        viewportSize : null
    };
    // options
    this.options = utils.mergeObjects(this.defaults, options);
    // factories
    this.cli = phantom.casperArgs;
    this.options.logLevel = this.cli.get('log-level', this.options.logLevel);
    if (!this.options.verbose) {
        this.options.verbose = this.cli.has('direct') || this.cli.has('verbose');
    }
    this.colorizer = this.getColorizer();
    this.mouse = mouse.create(this);
    this.popups = pagestack.create();
    // properties
    this.checker = null;
    this.currentResponse = {};
    this.currentUrl = 'about:blank';
    this.currentHTTPStatus = null;
    this.history = [];
    this.loadInProgress = false;
    this.navigationRequested = false;
    this.browserInitializing = false;
    this.logFormats = {};
    this.logLevels = ["debug", "info", "warning", "error"];
    this.logStyles = {
        debug:   'INFO',
        info:    'PARAMETER',
        warning: 'COMMENT',
        error:   'ERROR'
    };
    this.page = null;
    this.pendingWait = false;
    this.requestUrl = 'about:blank';
    this.resources = [];
    this.result = {
        log:    [],
        status: "success",
        time:   0
    };
    this.started = false;
    this.step = -1;
    this.steps = [];
    this.waiters = [];
    this._test = undefined;
    this.__defineGetter__('test', function() {
        if (!phantom.casperTest) {
            throw new CasperError('casper.test property is only available using the `casperjs test` command');
        }
        if (!utils.isObject(this._test)) {
            this._test = tester.create(this);
        }
        return this._test;
    });

    // init phantomjs error handler
    this.initErrorHandler();

    this.on('error', function(msg, backtrace) {
        var c = this.getColorizer();
        var match = /^(.*): __mod_error(.*):: (.*)/.exec(msg);
        var notices = [];
        if (match && match.length === 4) {
            notices.push('  in module ' + match[2]);
            msg = match[3];
        }
        console.error(c.colorize(msg, 'RED_BAR', 80));
        notices.forEach(function(notice) {
            console.error(c.colorize(notice, 'COMMENT'));
        });
        (backtrace || []).forEach(function(item) {
            var message = fs.absolute(item.file) + ":" + c.colorize(item.line, "COMMENT");
            if (item['function']) {
                message += " in " + c.colorize(item['function'], "PARAMETER");
            }
            console.error("  " + message);
        });
    });

    // deprecated feature event handler
    this.on('deprecated', function onDeprecated(message) {
        this.warn('[deprecated] ' + message);
    });

    // dispatching an event when instance has been constructed
    this.emit('init');

    // deprecated direct option
    if (this.cli.has('direct')) {
        this.emit("deprecated", "--direct option has been deprecated since 1.1; you should use --verbose instead.")
    }
};

// Casper class is an EventEmitter
utils.inherits(Casper, events.EventEmitter);

/**
 * Go a step back in browser's history
 *
 * @return Casper
 */
Casper.prototype.back = function back() {
    "use strict";
    this.checkStarted();
    return this.then(function _step() {
        this.emit('back');
        this.evaluate(function _evaluate() {
            history.back();
        });
    });
};

/**
 * Encodes a resource using the base64 algorithm synchronously using
 * client-side XMLHttpRequest.
 *
 * NOTE: we cannot use window.btoa() for some strange reasons here.
 *
 * @param  String  url     The url to download
 * @param  String  method  The method to use, optional: default GET
 * @param  String  data    The data to send, optional
 * @return string          Base64 encoded result
 */
Casper.prototype.base64encode = function base64encode(url, method, data) {
    "use strict";
    return this.callUtils("getBase64", url, method, data);
};

/**
 * Bypasses `nb` steps.
 *
 * @param  Integer  nb  Number of steps to bypass
 */
Casper.prototype.bypass = function bypass(nb) {
    "use strict";
    var step = this.step,
        steps = this.steps,
        last = steps.length;
    this.checkStarted();
    this.step = Math.min(step + nb, last);
    return this;
};

/**
 * Invokes a client side utils object method within the remote page, with arguments.
 *
 * @param  {String}   method  Method name
 * @return {...args}          Arguments
 * @return {Mixed}
 * @throws {CasperError}      If invokation failed.
 */
Casper.prototype.callUtils = function callUtils(method) {
    "use strict";
    var args = [].slice.call(arguments, 1);
    var result = this.evaluate(function(method, args) {
        return __utils__.__call(method, args);
    }, method, args);
    if (utils.isObject(result) && result.__isCallError) {
        throw new CasperError(f("callUtils(%s) with args %s thrown an error: %s",
                              method, args, result.message));
    }
    return result;
};

/**
 * Proxy method for WebPage#render. Adds a clipRect parameter for
 * automatically set page clipRect setting values and sets it back once
 * done. If the cliprect parameter is omitted, the full page viewport
 * area will be rendered.
 *
 * @param  String  targetFile  A target filename
 * @param  mixed   clipRect    An optional clipRect object (optional)
 * @return Casper
 */
Casper.prototype.capture = function capture(targetFile, clipRect, imgOptions) {
    "use strict";
    /*jshint maxstatements:20*/
    this.checkStarted();
    var previousClipRect;
    targetFile = fs.absolute(targetFile);
    if (clipRect) {
        if (!utils.isClipRect(clipRect)) {
            throw new CasperError("clipRect must be a valid ClipRect object.");
        }
        previousClipRect = this.page.clipRect;
        this.page.clipRect = clipRect;
        this.log(f("Capturing page to %s with clipRect %s", targetFile, JSON.stringify(clipRect)), "debug");
    } else {
        this.log(f("Capturing page to %s", targetFile), "debug");
    }
    if (!this.page.render(this.filter('capture.target_filename', targetFile) || targetFile, imgOptions)) {
        this.log(f("Failed to save screenshot to %s; please check permissions", targetFile), "error");
    } else {
        this.log(f("Capture saved to %s", targetFile), "info");
        this.emit('capture.saved', targetFile);
    }
    if (previousClipRect) {
        this.page.clipRect = previousClipRect;
    }
    return this;
};

/**
 * Returns a Base64 representation of a binary image capture of the current
 * page, or an area within the page, in a given format.
 *
 * Supported image formats are `bmp`, `jpg`, `jpeg`, `png`, `ppm`, `tiff`,
 * `xbm` and `xpm`.
 *
 * @param  String                   format    The image format
 * @param  String|Object|undefined  selector  DOM CSS3/XPath selector or clipRect object (optional)
 * @return Casper
 */
Casper.prototype.captureBase64 = function captureBase64(format, area) {
    "use strict";
    /*jshint maxstatements:20*/
    this.checkStarted();
    var base64, previousClipRect, formats = ['bmp', 'jpg', 'jpeg', 'png', 'ppm', 'tiff', 'xbm', 'xpm'];
    if (formats.indexOf(format.toLowerCase()) === -1) {
        throw new CasperError(f('Unsupported format "%s"', format));
    }
    if (utils.isClipRect(area)) {
        // if area is a clipRect object
        this.log(f("Capturing base64 %s representation of %s", format, utils.serialize(area)), "debug");
        previousClipRect = this.page.clipRect;
        this.page.clipRect = area;
        base64 = this.page.renderBase64(format);
    } else if (utils.isValidSelector(area)) {
        // if area is a selector string or object
        this.log(f("Capturing base64 %s representation of %s", format, area), "debug");
        base64 = this.captureBase64(format, this.getElementBounds(area));
    } else {
        // whole page capture
        this.log(f("Capturing base64 %s representation of page", format), "debug");
        base64 = this.page.renderBase64(format);
    }
    if (previousClipRect) {
        this.page.clipRect = previousClipRect;
    }
    return base64;
};

/**
 * Captures the page area matching the provided selector.
 *
 * @param  String  targetFile  Target destination file path.
 * @param  String  selector    DOM CSS3/XPath selector
 * @return Casper
 */
Casper.prototype.captureSelector = function captureSelector(targetFile, selector, imgOptions) {
    "use strict";
    return this.capture(targetFile, this.getElementBounds(selector), imgOptions);
};

/**
 * Checks for any further navigation step to process.
 *
 * @param  Casper    self        A self reference
 * @param  function  onComplete  An options callback to apply on completion
 */
Casper.prototype.checkStep = function checkStep(self, onComplete) {
    "use strict";
    if (self.pendingWait || self.loadInProgress || self.navigationRequested || self.browserInitializing) {
        return;
    }
    var step = self.steps[self.step++];
    if (utils.isFunction(step)) {
        return self.runStep(step);
    }
    self.result.time = new Date().getTime() - self.startTime;
    self.log(f("Done %s steps in %dms", self.steps.length, self.result.time), "info");
    clearInterval(self.checker);
    self.step -= 1;
    self.emit('run.complete');
    try {
        if (utils.isFunction(onComplete)) {
            onComplete.call(self, self);
        } else if (utils.isFunction(self.options.onRunComplete)) {
            self.options.onRunComplete.call(self, self);
        }
    } catch (error) {
        self.emit('complete.error', error);
        if (!self.options.silentErrors) {
            throw error;
        }
    }
};

/**
 * Checks if this instance is started.
 *
 * @return Boolean
 * @throws CasperError
 */
Casper.prototype.checkStarted = function checkStarted() {
    "use strict";
    if (!this.started) {
        throw new CasperError(f("Casper is not started, can't execute `%s()`",
                                checkStarted.caller.name));
    }
};

/**
 * Clears the current page execution environment context. Useful to avoid
 * having previously loaded DOM contents being still active (refs #34).
 *
 * Think of it as a way to stop javascript execution within the remote DOM
 * environment.
 *
 * @return Casper
 */
Casper.prototype.clear = function clear() {
    "use strict";
    this.checkStarted();
    this.page.content = '';
    return this;
};

/**
 * Emulates a click on the element from the provided selector using the mouse
 * pointer, if possible.
 *
 * In case of success, `true` is returned, `false` otherwise.
 *
 * @param  String   selector  A DOM CSS3 compatible selector
 * @return Boolean
 */
Casper.prototype.click = function click(selector) {
    "use strict";
    this.checkStarted();
    var success = this.mouseEvent('mousedown', selector) && this.mouseEvent('mouseup', selector);
    success = success && this.mouseEvent('click', selector);
    this.evaluate(function(selector) {
        var element = __utils__.findOne(selector);
        if (element) {
            element.focus();
        }
    }, selector);
    return success;
};

/**
 * Emulates a click on the element having `label` as innerText. The first
 * element matching this label will be selected, so use with caution.
 *
 * @param  String   label  Element innerText value
 * @param  String   tag    An element tag name (eg. `a` or `button`) (optional)
 * @return Boolean
 */
Casper.prototype.clickLabel = function clickLabel(label, tag) {
    "use strict";
    this.checkStarted();
    tag = tag || "*";
    var escapedLabel = utils.quoteXPathAttributeString(label);
    var selector = selectXPath(f('//%s[text()=%s]', tag, escapedLabel));
    return this.click(selector);
};

/**
 * Configures HTTP authentication parameters. Will try parsing auth credentials from
 * the passed location first, then check for configured settings if any.
 *
 * @param  String  location  Requested url
 * @param  Object  settings  Request settings
 * @return Casper
 */
Casper.prototype.configureHttpAuth = function configureHttpAuth(location, settings) {
    "use strict";
    var username, password, httpAuthMatch = location.match(/^https?:\/\/(.+):(.+)@/i);
    this.checkStarted();
    if (httpAuthMatch) {
        this.page.settings.userName = httpAuthMatch[1];
        this.page.settings.password = httpAuthMatch[2];
    } else if (utils.isObject(settings) && settings.username) {
        this.page.settings.userName = settings.username;
        this.page.settings.password = settings.password;
    } else {
        return;
    }
    this.emit('http.auth', username, password);
    this.log("Setting HTTP authentication for user " + username, "info");
    return this;
};

/**
 * Creates a step definition.
 *
 * @param  Function  fn       The step function to call
 * @param  Object    options  Step options
 * @return Function  The final step function
 */
Casper.prototype.createStep = function createStep(fn, options) {
    "use strict";
    if (!utils.isFunction(fn)) {
        throw new CasperError("createStep(): a step definition must be a function");
    }
    fn.options = utils.isObject(options) ? options : {};
    this.emit('step.created', fn);
    return fn;
};

/**
 * Logs the HTML code of the current page.
 *
 * @param  String   selector  A DOM CSS3/XPath selector (optional)
 * @param  Boolean  outer     Whether to fetch outer HTML contents (default: false)
 * @return Casper
 */
Casper.prototype.debugHTML = function debugHTML(selector, outer) {
    "use strict";
    this.checkStarted();
    return this.echo(this.getHTML(selector, outer));
};

/**
 * Logs the textual contents of the current page.
 *
 * @return Casper
 */
Casper.prototype.debugPage = function debugPage() {
    "use strict";
    this.checkStarted();
    this.echo(this.evaluate(function _evaluate() {
        return document.body.textContent || document.body.innerText;
    }));
    return this;
};

/**
 * Exit phantom on failure, with a logged error message.
 *
 * @param  String  message  An optional error message
 * @param  Number  status   An optional exit status code (must be > 0)
 * @return Casper
 */
Casper.prototype.die = function die(message, status) {
    "use strict";
    this.result.status = "error";
    this.result.time = new Date().getTime() - this.startTime;
    if (!utils.isString(message) || !message.length) {
        message = "Suite explicitely interrupted without any message given.";
    }
    this.log(message, "error");
    this.echo(message, "ERROR");
    this.emit('die', message, status);
    if (utils.isFunction(this.options.onDie)) {
        this.options.onDie.call(this, this, message, status);
    }
    return this.exit(~~status > 0 ? ~~status : 1);
};

/**
 * Downloads a resource and saves it on the filesystem.
 *
 * @param  String  url         The url of the resource to download
 * @param  String  targetPath  The destination file path
 * @param  String  method      The HTTP method to use (default: GET)
 * @param  String  data        Optional data to pass performing the request
 * @return Casper
 */
Casper.prototype.download = function download(url, targetPath, method, data) {
    "use strict";
    this.checkStarted();
    var cu = require('clientutils').create(utils.mergeObjects({}, this.options));
    try {
        fs.write(targetPath, cu.decode(this.base64encode(url, method, data)), 'wb');
        this.emit('downloaded.file', targetPath);
        this.log(f("Downloaded and saved resource in %s", targetPath));
    } catch (e) {
        this.log(f("Error while downloading %s to %s: %s", url, targetPath, e), "error");
    }
    return this;
};

/**
 * Iterates over the values of a provided array and execute a callback for each
 * item.
 *
 * @param  Array     array
 * @param  Function  fn     Callback: function(casper, item, index)
 * @return Casper
 */
Casper.prototype.each = function each(array, fn) {
    "use strict";
    if (!utils.isArray(array)) {
        this.log("each() only works with arrays", "error");
        return this;
    }
    array.forEach(function _forEach(item, i) {
        fn.call(this, this, item, i);
    }, this);
    return this;
};

/**
 * Iterates over the values of a provided array and adds a step for each item.
 *
 * @param  Array     array
 * @param  Function  then   Step: function(response); item will be attached to response.data
 * @return Casper
 */
Casper.prototype.eachThen = function each(array, then) {
    "use strict";
    if (!utils.isArray(array)) {
        this.log("eachThen() only works with arrays", "error");
        return this;
    }
    array.forEach(function _forEach(item) {
        this.then(function() {
            this.then(this.createStep(then, {data: item}));
        });
    }, this);
    return this;
};

/**
 * Prints something to stdout.
 *
 * @param  String  text   A string to echo to stdout
 * @param  String  style  An optional style name
 * @param  Number  pad    An optional pad value
 * @return Casper
 */
Casper.prototype.echo = function echo(text, style, pad) {
    "use strict";
    if (!utils.isString(text)) {
        try {
            text = text.toString();
        } catch (e) {
            try {
                text = utils.serialize(text);
            } catch (e2) {
                text = '';
            }
        }
    }
    var message = style ? this.colorizer.colorize(text, style, pad) : text;
    console.log(this.filter('echo.message', message) || message);
    return this;
};

/**
 * Evaluates an expression in the page context, a bit like what
 * WebPage#evaluate does, but the passed function can also accept
 * parameters if a context Object is also passed:
 *
 *     casper.evaluate(function(username, password) {
 *         document.querySelector('#username').value = username;
 *         document.querySelector('#password').value = password;
 *         document.querySelector('#submit').click();
 *     }, 'Bazoonga', 'baz00nga');
 *
 * @param  Function  fn       The function to be evaluated within current page DOM
 * @param  Object    context  Object containing the parameters to inject into the function
 * @return mixed
 * @see    WebPage#evaluate
 */
Casper.prototype.evaluate = function evaluate(fn, context) {
    "use strict";
    this.checkStarted();
    // preliminary checks
    if (!utils.isFunction(fn) && !utils.isString(fn)) { // phantomjs allows functions defs as string
        throw new CasperError("evaluate() only accepts functions or strings");
    }
    // ensure client utils are always injected
    this.injectClientUtils();
    // function context
    if (arguments.length === 1) {
        return utils.clone(this.page.evaluate(fn));
    } else if (arguments.length === 2) {
        // check for closure signature if it matches context
        if (utils.isObject(context) && eval(fn).length === Object.keys(context).length) {
            context = utils.objectValues(context);
        } else {
            context = [context];
        }
    } else {
        // phantomjs-style signature
        context = [].slice.call(arguments).slice(1);
    }
    return utils.clone(this.page.evaluate.apply(this.page, [fn].concat(context)));
};

/**
 * Evaluates an expression within the current page DOM and die() if it
 * returns false.
 *
 * @param  function  fn       The expression to evaluate
 * @param  String    message  The error message to log
 * @param  Number  status   An optional exit status code (must be > 0)
 *
 * @return Casper
 */
Casper.prototype.evaluateOrDie = function evaluateOrDie(fn, message, status) {
    "use strict";
    this.checkStarted();
    if (!this.evaluate(fn)) {
        return this.die(message, status);
    }
    return this;
};

/**
 * Checks if an element matching the provided DOM CSS3/XPath selector exists in
 * current page DOM.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return Boolean
 */
Casper.prototype.exists = function exists(selector) {
    "use strict";
    this.checkStarted();
    return this.callUtils("exists", selector);
};

/**
 * Exits phantom.
 *
 * @param  Number  status  Status
 * @return Casper
 */
Casper.prototype.exit = function exit(status) {
    "use strict";
    this.emit('exit', status);
    phantom.exit(status);
};

/**
 * Fetches plain text contents contained in the DOM element(s) matching a given CSS3/XPath
 * selector.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return String
 */
Casper.prototype.fetchText = function fetchText(selector) {
    "use strict";
    this.checkStarted();
    return this.callUtils("fetchText", selector);
};

/**
 * Fills a form with provided field values.
 *
 * @param  String selector  A DOM CSS3/XPath selector to the target form to fill
 * @param  Object vals      Field values
 * @param  Object options   The fill settings (optional)
 */
Casper.prototype.fillForm = function fillForm(selector, vals, options) {
    "use strict";
    this.checkStarted();

    var selectorType = options && options.selectorType || "names",
        submit = !!(options && options.submit);

    this.emit('fill', selector, vals, options);

    var fillResults = this.evaluate(function _evaluate(selector, vals, selectorType) {
        try {
            return __utils__.fill(selector, vals, selectorType);
        } catch (exception) {
            return {exception: exception.toString()};
        }
    }, selector, vals, selectorType);

    if (!fillResults) {
        throw new CasperError("Unable to fill form");
    } else if (fillResults && fillResults.exception) {
        throw new CasperError("Unable to fill form: " + fillResults.exception);
    } else if (fillResults.errors.length > 0) {
        throw new CasperError(f('Errors encountered while filling form: %s',
                              fillResults.errors.join('; ')));
    }

    // File uploads
    if (fillResults.files && fillResults.files.length > 0) {
        if (utils.isObject(selector) && selector.type === 'xpath') {
            this.warn('Filling file upload fields is currently not supported using ' +
                      'XPath selectors; Please use a CSS selector instead.');
        } else {
            fillResults.files.forEach(function _forEach(file) {
                if (!file || !file.path) {
                    return;
                }
                if (!fs.exists(file.path)) {
                    throw new CasperError('Cannot upload nonexistent file: ' + file.path);
                }
                var fileFieldSelector;
                if (file.type === "names") {
                    fileFieldSelector = [selector, 'input[name="' + file.selector + '"]'].join(' ');
                } else if (file.type === "css") {
                    fileFieldSelector = [selector, file.selector].join(' ');
                }
                this.page.uploadFile(fileFieldSelector, file.path);
            }.bind(this));
        }
    }
    // Form submission?
    if (submit) {
        this.evaluate(function _evaluate(selector) {
            var form = __utils__.findOne(selector);
            var method = (form.getAttribute('method') || "GET").toUpperCase();
            var action = form.getAttribute('action') || "unknown";
            __utils__.log('submitting form to ' + action + ', HTTP ' + method, 'info');
            var event = document.createEvent('Event');
            event.initEvent('submit', true, true);
            if (!form.dispatchEvent(event)) {
                __utils__.log('unable to submit form', 'warning');
                return;
            }
            if (typeof form.submit === "function") {
                form.submit();
            } else {
                // http://www.spiration.co.uk/post/1232/Submit-is-not-a-function
                form.submit.click();
            }
        }, selector);
    }
}

/**
 * Fills a form with provided field values using the Name attribute.
 *
 * @param  String  formSelector  A DOM CSS3/XPath selector to the target form to fill
 * @param  Object  vals          Field values
 * @param  Boolean submit        Submit the form?
 */
Casper.prototype.fillNames = function fillNames(formSelector, vals, submit) {
    "use strict";
    return this.fillForm(formSelector, vals, {
        submit: submit,
        selectorType: 'names'
    });
};

/**
 * Fills a form with provided field values using CSS3 selectors.
 *
 * @param  String  formSelector  A DOM CSS3/XPath selector to the target form to fill
 * @param  Object  vals          Field values
 * @param  Boolean submit        Submit the form?
 */
Casper.prototype.fillSelectors = function fillSelectors(formSelector, vals, submit) {
    "use strict";
    return this.fillForm(formSelector, vals, {
        submit: submit,
        selectorType: 'css'
    });
};

/**
 * Fills a form with provided field values using the Name attribute by default.
 *
 * @param  String  formSelector  A DOM CSS3/XPath selector to the target form to fill
 * @param  Object  vals          Field values
 * @param  Boolean submit        Submit the form?
 */
Casper.prototype.fill = Casper.prototype.fillNames;

/**
 * Fills a form with provided field values using XPath selectors.
 *
 * @param  String  formSelector  A DOM CSS3/XPath selector to the target form to fill
 * @param  Object  vals          Field values
 * @param  Boolean submit        Submit the form?
 */
Casper.prototype.fillXPath = function fillXPath(formSelector, vals, submit) {
    "use strict";
    return this.fillForm(formSelector, vals, {
        submit: submit,
        selectorType: 'xpath'
    });
};

/**
 * Go a step forward in browser's history
 *
 * @return Casper
 */
Casper.prototype.forward = function forward() {
    "use strict";
    this.checkStarted();
    return this.then(function _step() {
        this.emit('forward');
        this.evaluate(function _evaluate() {
            history.forward();
        });
    });
};

/**
 * Creates a new Colorizer instance. Sets `Casper.options.type` to change the
 * colorizer type name (see the `colorizer` module).
 *
 * @return Object
 */
Casper.prototype.getColorizer = function getColorizer() {
    "use strict";
    return colorizer.create(this.options.colorizerType || 'Colorizer');
};

/**
 * Retrieves current page contents, dealing with exotic other content types than HTML.
 *
 * @return String
 */
Casper.prototype.getPageContent = function getPageContent() {
    "use strict";
    this.checkStarted();
    var contentType = utils.getPropertyPath(this, 'currentResponse.contentType');
    if (!utils.isString(contentType)) {
        return this.page.frameContent;
    }
    // for some reason (qt)webkit/Gecko will always enclose non text/html body contents within an html
    // structure like this:
    // webkit: <html><head></head><body><pre style="(...)">content</pre></body></html>
    // gecko: <html><head><link rel="alternate stylesheet" type="text/css" href="resource://gre-resources/plaintext.css" title="..."></head><body><pre>document.write('foo');\n</pre></body></html>
    var sanitizedHtml = this.evaluate(function checkHtml() {
        var head = __utils__.findOne('head'),
            body = __utils__.findOne('body');
        if (!head || !body) {
            return null;
        }
        // for content in Webkit
        if (head.childNodes.length === 0 &&
            body.childNodes.length === 1 &&
            __utils__.findOne('body pre[style]')) {
            return __utils__.findOne('body pre').textContent.trim();
        }
        // for content in Gecko
        if (head.childNodes.length === 1 &&
            body.childNodes.length === 1 &&
            head.childNodes[0].localName === 'link' &&
            head.childNodes[0].getAttribute('href') === 'resource://gre-resources/plaintext.css' &&
            body.childNodes[0].localName === 'pre' ) {
            return body.childNodes[0].textContent.trim();
        }
        return null;
    });
    return sanitizedHtml ? sanitizedHtml : this.page.frameContent;
};

/**
 * Retrieves current document url.
 *
 * @return String
 */
Casper.prototype.getCurrentUrl = function getCurrentUrl() {
    "use strict";
    this.checkStarted();
    try {
        return utils.decodeUrl(this.evaluate(function _evaluate() {
            return document.location.href;
        }));
    } catch (e) {
        // most likely the current page object has been "deleted" (think closed popup)
        if (/deleted QObject/.test(e.message))
            return "";
        throw e;
    }
};

/**
 * Retrieves the value of an attribute on the first element matching the provided
 * DOM CSS3/XPath selector.
 *
 * @param  String  selector   A DOM CSS3/XPath selector
 * @param  String  attribute  The attribute name to lookup
 * @return String  The requested DOM element attribute value
 */
Casper.prototype.getElementAttribute =
Casper.prototype.getElementAttr = function getElementAttr(selector, attribute) {
    "use strict";
    this.checkStarted();
    return this.evaluate(function _evaluate(selector, attribute) {
        return __utils__.findOne(selector).getAttribute(attribute);
    }, selector, attribute);
};

/**
 * Retrieves the value of an attribute for each element matching the provided
 * DOM CSS3/XPath selector.
 *
 * @param  String  selector   A DOM CSS3/XPath selector
 * @param  String  attribute  The attribute name to lookup
 * @return Array
 */
Casper.prototype.getElementsAttribute =
Casper.prototype.getElementsAttr = function getElementsAttr(selector, attribute) {
    "use strict";
    this.checkStarted();
    return this.evaluate(function _evaluate(selector, attribute) {
        return [].map.call(__utils__.findAll(selector), function(element) {
            return element.getAttribute(attribute);
        });
    }, selector, attribute);
}

/**
 * Retrieves boundaries for a DOM element matching the provided DOM CSS3/XPath selector.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return Object
 */
Casper.prototype.getElementBounds = function getElementBounds(selector) {
    "use strict";
    this.checkStarted();
    if (!this.exists(selector)) {
        throw new CasperError("No element matching selector found: " + selector);
    }
    var clipRect = this.callUtils("getElementBounds", selector);
    if (!utils.isClipRect(clipRect)) {
        throw new CasperError('Could not fetch boundaries for element matching selector: ' + selector);
    }
    return clipRect;
};

/**
 * Retrieves information about the node matching the provided selector.
 *
 * @param  String|Objects  selector  CSS3/XPath selector
 * @return Object
 */
Casper.prototype.getElementInfo = function getElementInfo(selector) {
    "use strict";
    this.checkStarted();
    if (!this.exists(selector)) {
        throw new CasperError(f("Cannot get informations from %s: element not found.", selector));
    }
    return this.callUtils("getElementInfo", selector);
};

/**
 * Retrieves information about the nodes matching the provided selector.
 *
 * @param String|Objects  selector  CSS3/XPath selector
 * @return Array
 */
Casper.prototype.getElementsInfo = function getElementsInfo(selector) {
    "use strict";
    this.checkStarted();
    if (!this.exists(selector)) {
        throw new CasperError(f("Cannot get information from %s: no elements found.", selector));
    }
    return this.callUtils("getElementsInfo", selector);
};

/**
 * Retrieves boundaries for all the DOM elements matching the provided DOM CSS3/XPath selector.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return Array
 */
Casper.prototype.getElementsBounds = function getElementBounds(selector) {
    "use strict";
    this.checkStarted();
    if (!this.exists(selector)) {
        throw new CasperError("No element matching selector found: " + selector);
    }
    return this.callUtils("getElementsBounds", selector);
};

/**
 * Retrieves a given form all of its field values.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return Object
 */
Casper.prototype.getFormValues = function(selector) {
    "use strict";
    this.checkStarted();
    if (!this.exists(selector)) {
        throw new CasperError(f('Form matching selector "%s" not found', selector));
    }
    return this.callUtils("getFormValues", selector);
};

/**
 * Retrieves global variable.
 *
 * @param  String  name  The name of the global variable to retrieve
 * @return mixed
 */
Casper.prototype.getGlobal = function getGlobal(name) {
    "use strict";
    this.checkStarted();
    var result = this.evaluate(function _evaluate(name) {
        var result = {};
        try {
            result.value = JSON.stringify(window[name]);
        } catch (e) {
            var message = "Unable to JSON encode window." + name + ": " + e;
            __utils__.log(message, "error");
            result.error = message;
        }
        return result;
    }, name);
    if (!utils.isObject(result)) {
        throw new CasperError(f('Could not retrieve global value for "%s"', name));
    } else if ('error' in result) {
        throw new CasperError(result.error);
    } else if (utils.isString(result.value)) {
        return JSON.parse(result.value);
    }
};

/**
 * Retrieves current HTML code matching the provided CSS3/XPath selector.
 * Returns the HTML contents for the whole page if no arg is passed.
 *
 * @param  String   selector  A DOM CSS3/XPath selector
 * @param  Boolean  outer     Whether to fetch outer HTML contents (default: false)
 * @return String
 */
Casper.prototype.getHTML = function getHTML(selector, outer) {
    "use strict";
    this.checkStarted();
    if (!selector) {
        return this.page.frameContent;
    }
    if (!this.exists(selector)) {
        throw new CasperError("No element matching selector found: " + selector);
    }
    return this.evaluate(function getSelectorHTML(selector, outer) {
        var element = __utils__.findOne(selector);
        return outer ? element.outerHTML : element.innerHTML;
    }, selector, !!outer);
};

/**
 * Retrieves current page title, if any.
 *
 * @return String
 */
Casper.prototype.getTitle = function getTitle() {
    "use strict";
    this.checkStarted();
    return this.evaluate(function _evaluate() {
        return document.title;
    });
};

/**
 * Handles received HTTP resource.
 *
 * @param  Object  resource  PhantomJS HTTP resource
 */
Casper.prototype.handleReceivedResource = function(resource) {
    "use strict";
    /*jshint maxstatements:20*/
    if (resource.stage !== "end") {
        return;
    }
    this.resources.push(resource);
    if (utils.decodeUrl(resource.url) !== this.requestUrl) {
        return;
    }
    this.currentHTTPStatus = null;
    this.currentResponse = {};
    if (utils.isHTTPResource(resource)) {
        this.emit('page.resource.received', resource);
        this.currentResponse = resource;
        this.currentHTTPStatus = resource.status;
        this.emit('http.status.' + resource.status, resource);
        if (utils.isObject(this.options.httpStatusHandlers) &&
            resource.status in this.options.httpStatusHandlers &&
            utils.isFunction(this.options.httpStatusHandlers[resource.status])) {
            this.options.httpStatusHandlers[resource.status].call(this, this, resource);
        }
    }
    this.currentUrl = resource.url;
    this.emit('location.changed', resource.url);
};

/**
 * Initializes PhantomJS error handler.
 *
 */
Casper.prototype.initErrorHandler = function initErrorHandler() {
    "use strict";
    var casper = this;
    phantom.onError = function phantom_onError(msg, backtrace) {
        casper.emit('error', msg, backtrace);
        if (casper.options.exitOnError === true) {
            casper.exit(1);
        }
    };
};

/**
 * Injects configured local client scripts.
 *
 * @return Casper
 */
Casper.prototype.injectClientScripts = function injectClientScripts() {
    "use strict";
    this.checkStarted();
    if (!this.options.clientScripts) {
        return;
    }
    if (utils.isString(this.options.clientScripts)) {
        this.options.clientScripts = [this.options.clientScripts];
    }
    if (!utils.isArray(this.options.clientScripts)) {
        throw new CasperError("The clientScripts option must be an array");
    }
    this.options.clientScripts.forEach(function _forEach(script) {
        if (this.page.injectJs(script)) {
            this.log(f('Automatically injected %s client side', script), "debug");
        } else {
            this.warn('Failed injecting %s client side', script);
        }
    }.bind(this));
    return this;
};

/**
 * Injects Client-side utilities in current page context.
 *
 */
Casper.prototype.injectClientUtils = function injectClientUtils() {
    "use strict";
    this.checkStarted();
    var clientUtilsInjected = this.page.evaluate(function() {
        return typeof __utils__ === "object";
    });
    if (true === clientUtilsInjected) {
        return;
    }
    var clientUtilsPath = require('fs').pathJoin(phantom.casperPath, 'modules', 'clientutils.js');
    if (true === this.page.injectJs(clientUtilsPath)) {
        this.log("Successfully injected Casper client-side utilities", "debug");
    } else {
        this.warn("Failed to inject Casper client-side utilities");
    }
    // ClientUtils and Casper shares the same options
    // These are not the lines I'm the most proud of in my life, but it works.
    /*global __options*/
    this.page.evaluate(function() {
        window.__utils__ = new window.ClientUtils(__options);
    }.toString().replace('__options', JSON.stringify(this.options)));
};

/**
 * Loads and include remote client scripts to current page.
 *
 * @return Casper
 */
Casper.prototype.includeRemoteScripts = function includeRemoteScripts() {
    "use strict";
    var numScripts = this.options.remoteScripts.length, loaded = 0;
    if (numScripts === 0) {
        return this;
    }
    this.waitStart();
    this.options.remoteScripts.forEach(function(scriptUrl) {
        this.log(f("Loading remote script: %s", scriptUrl), "debug");
        this.page.includeJs(scriptUrl, function() {
            loaded++;
            this.log(f("Remote script %s loaded", scriptUrl), "debug");
            if (loaded === numScripts) {
                this.log("All remote scripts loaded.", "debug");
                this.waitDone();
            }
        }.bind(this));
    }.bind(this));
    return this;
};

/**
 * Logs a message.
 *
 * @param  String  message  The message to log
 * @param  String  level    The log message level (from Casper.logLevels property)
 * @param  String  space    Space from where the logged event occurred (default: "phantom")
 * @return Casper
 */
Casper.prototype.log = function log(message, level, space) {
    "use strict";
    level = level && this.logLevels.indexOf(level) > -1 ? level : "debug";
    space = space ? space : "phantom";
    if (level === "error" && utils.isFunction(this.options.onError)) {
        this.options.onError.call(this, this, message, space);
    }
    if (this.logLevels.indexOf(level) < this.logLevels.indexOf(this.options.logLevel)) {
        return this; // skip logging
    }
    var entry = {
        level:   level,
        space:   space,
        message: message,
        date:    new Date().toString()
    };
    if (level in this.logFormats && utils.isFunction(this.logFormats[level])) {
        message = this.logFormats[level](message, level, space);
    } else {
        message = f('%s [%s] %s',
                    this.colorizer.colorize(f('[%s]', level), this.logStyles[level]),
                    space,
                    message);
    }
    if (this.options.verbose) {
        this.echo(this.filter('log.message', message) || message); // direct output
    }
    this.result.log.push(entry);
    this.emit('log', entry);
    return this;
};

/**
 * Emulates an event on the element from the provided selector using the mouse
 * pointer, if possible.
 *
 * In case of success, `true` is returned, `false` otherwise.
 *
 * @param  String   type      Type of event to emulate
 * @param  String   selector  A DOM CSS3 compatible selector
 * @return Boolean
 */
Casper.prototype.mouseEvent = function mouseEvent(type, selector) {
    "use strict";
    this.checkStarted();
    this.log("Mouse event '" + type + "' on selector: " + selector, "debug");
    if (!this.exists(selector)) {
        throw new CasperError(f("Cannot dispatch %s event on nonexistent selector: %s", type, selector));
    }
    if (this.callUtils("mouseEvent", type, selector)) {
        return true;
    }
    // fallback onto native QtWebKit mouse events
    try {
        return this.mouse.processEvent(type, selector);
    } catch (e) {
        this.log(f("Couldn't emulate '%s' event on %s: %s", type, selector, e), "error");
    }
    return false;
};

/**
 * Performs an HTTP request, with optional settings.
 *
 * Available settings are:
 *
 * - String  method:   The HTTP method to use
 * - Object  data:     The data to use to perform the request, eg. {foo: 'bar'}
 * - Object  headers:  Custom request headers object, eg. {'Cache-Control': 'max-age=0'}
 *
 * @param  String  location  The url to open
 * @param  Object  settings  The request settings (optional)
 * @return Casper
 */
Casper.prototype.open = function open(location, settings) {
    "use strict";
    /*jshint maxstatements:30*/
    var baseCustomHeaders = this.page.customHeaders,
        customHeaders = settings && settings.headers || {};
    this.checkStarted();
    settings = utils.isObject(settings) ? settings : {};
    settings.method = settings.method || "get";
    // http method
    // taken from https://github.com/ariya/phantomjs/blob/master/src/webpage.cpp#L302
    var methods = ["get", "head", "put", "post", "delete"];
    if (settings.method && (!utils.isString(settings.method) || methods.indexOf(settings.method.toLowerCase()) === -1)) {
        throw new CasperError("open(): settings.method must be part of " + methods.join(', '));
    }
    // http data
    if (settings.data) {
        if (utils.isObject(settings.data)) { // query object
            settings.data = qs.encode(settings.data);
        } else if (!utils.isString(settings.data)) {
            throw new CasperError("open(): invalid request settings data value: " + settings.data);
        }
    }
    // clean location
    location = utils.cleanUrl(location);
    // current request url
    this.configureHttpAuth(location, settings);
    this.requestUrl = this.filter('open.location', location) || location;
    this.emit('open', this.requestUrl, settings);
    this.log(f('opening url: %s, HTTP %s', this.requestUrl, settings.method.toUpperCase()), "debug");
    // reset resources
    this.resources = [];
    // custom headers
    this.page.customHeaders = utils.mergeObjects(utils.clone(baseCustomHeaders), customHeaders);
    // perfom request
    this.browserInitializing = true;
    this.page.openUrl(this.requestUrl, {
        operation: settings.method,
        data:      settings.data
    }, this.page.settings);
    // revert base custom headers
    this.page.customHeaders = baseCustomHeaders;
    return this;
};

/**
 * Reloads current page.
 *
 * @param  Function  then  a next step function
 * @return Casper
 */
Casper.prototype.reload = function reload(then) {
    "use strict";
    this.checkStarted();
    // window.location.reload() is broken under phantomjs
    this.then(function() {
        this.open(this.getCurrentUrl());
    });
    if (utils.isFunction(then)) {
        this.then(this.createStep(then));
    }
    return this;
};

/**
 * Repeats a step a given number of times.
 *
 * @param  Number    times  Number of times to repeat step
 * @aram   function  then   The step closure
 * @return Casper
 * @see    Casper#then
 */
Casper.prototype.repeat = function repeat(times, then) {
    "use strict";
    for (var i = 0; i < times; i++) {
        this.then(then);
    }
    return this;
};

/**
 * Checks if a given resource was loaded by the remote page.
 *
 * @param  Function/String/RegExp  test  A test function, string or regular expression.
 *                                       In case a string is passed, url matching will be tested.
 * @return Boolean
 */
Casper.prototype.resourceExists = function resourceExists(test) {
    "use strict";
    this.checkStarted();
    var testFn;
    switch (utils.betterTypeOf(test)) {
        case "string":
            testFn = function _testResourceExists_String(res) {
                return res.url.search(test) !== -1 && res.status !== 404;
            };
            break;
        case "regexp":
            testFn = function _testResourceExists_Regexp(res) {
                return test.test(res.url) && res.status !== 404;
            };
            break;
        case "function":
            testFn = test;
            if (phantom.casperEngine !== "slimerjs")
                testFn.name = "_testResourceExists_Function";
            break;
        default:
            throw new CasperError("Invalid type");
    }
    return this.resources.some(testFn);
};

/**
 * Runs the whole suite of steps.
 *
 * @param  function  onComplete  an optional callback
 * @param  Number    time        an optional amount of milliseconds for interval checking
 * @return Casper
 */
Casper.prototype.run = function run(onComplete, time) {
    "use strict";
    this.checkStarted();
    if (!this.steps || this.steps.length < 1) {
        throw new CasperError('No steps defined, aborting');
    }
    this.log(f("Running suite: %d step%s", this.steps.length, this.steps.length > 1 ? "s" : ""), "info");
    this.emit('run.start');
    this.checker = setInterval(this.checkStep, (time ? time: this.options.retryTimeout), this, onComplete);
    return this;
};

/**
 * Runs a step.
 *
 * @param  Function  step
 */
Casper.prototype.runStep = function runStep(step) {
    "use strict";
    /*jshint maxstatements:20*/
    this.checkStarted();
    var skipLog = utils.isObject(step.options) && step.options.skipLog === true,
        stepInfo = f("Step %s %d/%d", step.name || "anonymous", this.step, this.steps.length),
        stepResult;
    function getCurrentSuiteId(casper) {
        try {
            return casper.test.getCurrentSuiteId();
        } catch (e) {
            return casper.step;
        }
    }
    if (!skipLog && /^http/.test(this.getCurrentUrl())) {
        this.log(stepInfo + f(' %s (HTTP %d)', this.getCurrentUrl(), this.currentHTTPStatus), "info");
    }
    if (utils.isNumber(this.options.stepTimeout) && this.options.stepTimeout > 0) {
        var stepTimeoutCheckInterval = setInterval(function _check(self, start, stepNum) {
            if (new Date().getTime() - start > self.options.stepTimeout) {
                if (getCurrentSuiteId(self) === stepNum) {
                    self.emit('step.timeout', stepNum, self.options.onStepTimeout);
                    if (utils.isFunction(self.options.onStepTimeout)) {
                        self.options.onStepTimeout.call(self, self.options.stepTimeout, stepNum);
                    }
                }
                clearInterval(stepTimeoutCheckInterval);
            }
        }, this.options.stepTimeout, this, new Date().getTime(), getCurrentSuiteId(this));
    }
    this.emit('step.start', step);
    if (this.currentResponse) {
        this.currentResponse.data = step.options && step.options.data || null;
    }
    try {
        stepResult = step.call(this, this.currentResponse);
        if (utils.isFunction(this.options.onStepComplete)) {
            this.options.onStepComplete.call(this, this, stepResult);
        }
    } catch (err) {
        this.emit('step.error', err);
        if (!this.options.silentErrors) {
            throw err;
        }
    }
    if (!skipLog) {
        this.emit('step.complete', stepResult);
        this.log(stepInfo + f(": done in %dms.", new Date().getTime() - this.startTime), "info");
    }
};

/**
 * Sends keys to given element.
 *
 * Options:
 *
 * - eventType: "keypress", "keyup" or "keydown" (default: "keypress")
 * - modifiers: a string defining the key modifiers, eg. "alt", "alt+shift"
 *
 * @param  String  selector  A DOM CSS3 compatible selector
 * @param  String  keys      A string representing the sequence of char codes to send
 * @param  Object  options   Options
 * @return Casper
 */
Casper.prototype.sendKeys = function(selector, keys, options) {
    "use strict";
    this.checkStarted();
    options = utils.mergeObjects({
        eventType: 'keypress',
        reset: false
    }, options || {});
    var elemInfos = this.getElementInfo(selector),
        tag = elemInfos.nodeName.toLowerCase(),
        type = utils.getPropertyPath(elemInfos, 'attributes.type'),
        supported = ["color", "date", "datetime", "datetime-local", "email",
                     "hidden", "month", "number", "password", "range", "search",
                     "tel", "text", "time", "url", "week"],
        isTextInput = false,
        isTextArea = tag === 'textarea',
        isValidInput = tag === 'input' && (typeof type === 'undefined' || supported.indexOf(type) !== -1),
        isContentEditable = !!elemInfos.attributes.contenteditable;

    if (isTextArea || isValidInput || isContentEditable) {
        // clicking on the input element brings it focus
        isTextInput = true;
        this.click(selector);
    }
    if (options.reset) {
        this.evaluate(function(selector) {
            __utils__.setField(__utils__.findOne(selector), '');
        }, selector);
        this.click(selector);
    }
    var modifiers = utils.computeModifier(options && options.modifiers,
                                          this.page.event.modifier)
    this.page.sendEvent(options.eventType, keys, null, null, modifiers);
    if (isTextInput && !options.keepFocus) {
        // remove the focus
        this.evaluate(function(selector) {
            __utils__.findOne(selector).blur();
        }, selector);
    }
    return this;
};

/**
 * Scrolls current document to x, y coordinates.
 *
 * @param  {Number} x X position
 * @param  {Number} y Y position
 * @return {Casper}
 */
Casper.prototype.scrollTo = function(x, y) {
    "use strict";
    this.callUtils("scrollTo", x, y);
    return this;
};

/**
 * Scrolls current document up to its bottom.
 *
 * @return {Casper}
 */
Casper.prototype.scrollToBottom = function scrollToBottom() {
    "use strict";
    this.callUtils("scrollToBottom");
    return this;
};

/**
 * Sets current page content.
 *
 * @param  String  content  Desired page content
 * @return Casper
 */
Casper.prototype.setContent = function setContent(content) {
    "use strict";
    this.checkStarted();
    this.page.content = content;
    return this;
};

/**
 * Sets current WebPage instance the credentials for HTTP authentication.
 *
 * @param  String  username
 * @param  String  password
 * @return Casper
 */
Casper.prototype.setHttpAuth = function setHttpAuth(username, password) {
    "use strict";
    this.checkStarted();
    this.page.settings.userName = username;
    this.page.settings.password = password;
    return this;
};

/**
 * Configures and starts Casper.
 *
 * @param  String   location  An optional location to open on start
 * @param  function then      Next step function to execute on page loaded (optional)
 * @return Casper
 */
Casper.prototype.start = function start(location, then) {
    "use strict";
    /*jshint maxstatements:30*/
    this.emit('starting');
    this.log('Starting...', "info");
    this.startTime = new Date().getTime();
    this.currentResponse = {};
    this.history = [];
    this.popups = pagestack.create();
    this.steps = [];
    this.step = 0;
    // Option checks
    if (this.logLevels.indexOf(this.options.logLevel) < 0) {
        this.log(f("Unknown log level '%d', defaulting to 'warning'", this.options.logLevel), "warning");
        this.options.logLevel = "warning";
    }
    if (!utils.isWebPage(this.page)) {
        this.page = this.mainPage = utils.isWebPage(this.options.page) ? this.options.page : createPage(this);
    }
    this.page.settings = utils.mergeObjects(this.page.settings, this.options.pageSettings);
    if (utils.isClipRect(this.options.clipRect)) {
        this.page.clipRect = this.options.clipRect;
    }
    if (utils.isObject(this.options.viewportSize)) {
        this.page.viewportSize = this.options.viewportSize;
    }
    // timeout handling
    if (utils.isNumber(this.options.timeout) && this.options.timeout > 0) {
        this.log(f("Execution timeout set to %dms", this.options.timeout), "info");
        setTimeout(function _check(self) {
            self.emit('timeout');
            if (utils.isFunction(self.options.onTimeout)) {
                self.options.onTimeout.call(self, self.options.timeout);
            }
        }, this.options.timeout, this);
    }
    this.started = true;
    this.emit('started');
    if (utils.isString(location) && location.length > 0) {
        return this.thenOpen(location, utils.isFunction(then) ? then : this.createStep(function _step() {
            this.log("start page is loaded", "debug");
        }, {skipLog: true}));
    }
    return this;
};

/**
 * Returns the current status of current instance
 *
 * @param  Boolean  asString  Export status object as string
 * @return Object
 */
Casper.prototype.status = function status(asString) {
    "use strict";
    var properties = ['currentHTTPStatus', 'loadInProgress', 'navigationRequested',
                      'options', 'pendingWait', 'requestUrl', 'started', 'step', 'url'];
    var currentStatus = {};
    properties.forEach(function(property) {
        currentStatus[property] = this[property];
    }.bind(this));
    return asString === true ? utils.dump(currentStatus) : currentStatus;
};

/**
 * Schedules the next step in the navigation process.
 *
 * @param  function  step  A function to be called as a step
 * @return Casper
 */
Casper.prototype.then = function then(step) {
    "use strict";
    this.checkStarted();
    if (!utils.isFunction(step)) {
        throw new CasperError("You can only define a step as a function");
    }
    // check if casper is running
    if (this.checker === null) {
        // append step to the end of the queue
        step.level = 0;
        this.steps.push(step);
    } else {
        // insert substep a level deeper
        try {
            step.level = this.steps[this.step - 1].level + 1;
        } catch (e) {
            step.level = 0;
        }
        var insertIndex = this.step;
        while (this.steps[insertIndex] && step.level === this.steps[insertIndex].level) {
            insertIndex++;
        }
        this.steps.splice(insertIndex, 0, step);
    }
    this.emit('step.added', step);
    return this;
};

/**
 * Adds a new navigation step for clicking on a provided link selector
 * and execute an optional next step.
 *
 * @param  String   selector        A DOM CSS3 compatible selector
 * @param  Function then            Next step function to execute on page loaded (optional)
 * @return Casper
 * @see    Casper#click
 * @see    Casper#then
 */
Casper.prototype.thenClick = function thenClick(selector, then) {
    "use strict";
    this.checkStarted();
    this.then(function _step() {
        this.click(selector);
    });
    return utils.isFunction(then) ? this.then(then) : this;
};

/**
 * Adds a new navigation step to perform code evaluation within the
 * current retrieved page DOM.
 *
 * @param  function  fn       The function to be evaluated within current page DOM
 * @param  object    context  Optional function parameters context
 * @return Casper
 * @see    Casper#evaluate
 */
Casper.prototype.thenEvaluate = function thenEvaluate(fn, context) {
    "use strict";
    this.checkStarted();
    var args = [fn].concat([].slice.call(arguments, 1));
    return this.then(function _step() {
        this.evaluate.apply(this, args);
    });
};

/**
 * Adds a new navigation step for opening the provided location.
 *
 * @param  String   location  The URL to load
 * @param  function then      Next step function to execute on page loaded (optional)
 * @return Casper
 * @see    Casper#open
 */
Casper.prototype.thenOpen = function thenOpen(location, settings, then) {
    "use strict";
    this.checkStarted();
    if (!(settings && !utils.isFunction(settings))) {
      then = settings;
      settings = null;
    }
    this.then(this.createStep(function _step() {
        this.open(location, settings);
    }, {
        skipLog: true
    }));
    return utils.isFunction(then) ? this.then(then) : this;
};

/**
 * Adds a step which bypasses `nb` steps.
 *
 * @param  Integer  nb  Number of steps to bypass
 */
Casper.prototype.thenBypass = function thenBypass(nb) {
    "use strict";
    return this.then(function _thenBypass() {
        this.bypass(nb);
    });
};

/**
 * Bypass `nb` steps if condition is true.
 *
 * @param  Mixed    condition  Test condition
 * @param  Integer  nb         Number of steps to bypass
 */
Casper.prototype.thenBypassIf = function thenBypassIf(condition, nb) {
    "use strict";
    return this.then(function _thenBypassIf() {
        if (utils.isFunction(condition)) {
            condition = condition.call(this);
        }
        if (utils.isTruthy(condition)) {
            this.bypass(nb);
        }
    });
};

/**
 * Bypass `nb` steps if condition is false.
 *
 * @param Mixed    condition  Test condition
 * @param Integer  nb         Number of tests to bypass
 */
Casper.prototype.thenBypassUnless = function thenBypassUnless(condition, nb) {
    "use strict";
    return this.then(function _thenBypassUnless() {
        if (utils.isFunction(condition)) {
            condition = condition.call(this);
        }
        if (utils.isFalsy(condition)) {
            this.bypass(nb);
        }
    });
};

/**
 * Adds a new navigation step for opening and evaluate an expression
 * against the DOM retrieved from the provided location.
 *
 * @param  String    location  The url to open
 * @param  function  fn        The function to be evaluated within current page DOM
 * @param  object    context   Optional function parameters context
 * @return Casper
 * @see    Casper#evaluate
 * @see    Casper#open
 */
Casper.prototype.thenOpenAndEvaluate = function thenOpenAndEvaluate(location, fn, context) {
    "use strict";
    this.checkStarted();
    return this.thenOpen(location).thenEvaluate(fn, context);
};

/**
 * Returns a string representation of current instance
 *
 * @return String
 */
Casper.prototype.toString = function toString() {
    "use strict";
    return '[object Casper], currently at ' + this.getCurrentUrl();
};

/**
 * Clear all wait processes.
 *
 * @return Casper
 */
Casper.prototype.unwait = function unwait() {
    "use strict";
    this.waiters.forEach(function(interval) {
        if (interval) {
            clearInterval(interval);
        }
    });
    this.waiters = [];
    return this;
};

/**
 * Sets the user-agent string currently used when requesting urls.
 *
 * @param  String  userAgent  User agent string
 * @return String
 */
Casper.prototype.userAgent = function userAgent(agent) {
    "use strict";
    this.options.pageSettings.userAgent = agent;
    if (this.started && this.page) {
        this.page.settings.userAgent = agent;
    }
    return this;
};

/**
 * Changes the current viewport size. That operation is asynchronous as the page
 * has to reflow its contents accordingly.
 *
 * @param  Number    width   The viewport width, in pixels
 * @param  Number    height  The viewport height, in pixels
 * @param  Function  then    Next step to process (optional)
 * @return Casper
 */
Casper.prototype.viewport = function viewport(width, height, then) {
    "use strict";
    this.checkStarted();
    if (!utils.isNumber(width) || !utils.isNumber(height) || width <= 0 || height <= 0) {
        throw new CasperError(f("Invalid viewport: %dx%d", width, height));
    }

    this.page.viewportSize = {
        width: width,
        height: height
    };
    // setting the viewport could cause a redraw and it can take
    // time. At least for Gecko, we should wait a bit, even
    // if this time could not be enough.
    var time = (phantom.casperEngine === 'slimerjs'?400:100);
    return this.then(function _step() {
        this.waitStart();
        setTimeout(function _check(self) {
            self.waitDone();
            self.emit('viewport.changed', [width, height]);
            if (utils.isFunction(then)){
                self.then(then);
            }
        }, time, this);
    });
};

/**
 * Checks if an element matching the provided DOM CSS3/XPath selector is visible
 * current page DOM by checking that offsetWidth and offsetHeight are
 * both non-zero.
 *
 * @param  String  selector  A DOM CSS3/XPath selector
 * @return Boolean
 */
Casper.prototype.visible = function visible(selector) {
    "use strict";
    this.checkStarted();
    return this.callUtils("visible", selector);
};

/**
 * Displays a warning message onto the console and logs the event. Also emits a
 * `warn` event with the message passed.
 *
 * @param  String  message
 * @return Casper
 */
Casper.prototype.warn = function warn(message) {
    "use strict";
    this.log(message, "warning", "phantom");
    var formatted = f.apply(null, ["⚠  " + message].concat([].slice.call(arguments, 1)));
    this.emit('warn', message);
    return this.echo(formatted, 'COMMENT');
};

/**
 * Adds a new step that will wait for a given amount of time (expressed
 * in milliseconds) before processing an optional next one.
 *
 * @param  Number    timeout  The max amount of time to wait, in milliseconds
 * @param  Function  then     Next step to process (optional)
 * @return Casper
 */
Casper.prototype.wait = function wait(timeout, then) {
    "use strict";
    this.checkStarted();
    timeout = ~~timeout;
    if (timeout < 1) {
        throw new CasperError("wait() only accepts a positive integer > 0 as a timeout value");
    }
    if (then && !utils.isFunction(then)) {
        throw new CasperError("wait() a step definition must be a function");
    }
    return this.then(function _step() {
        this.waitStart();
        setTimeout(function _check(self) {
            self.log(f("wait() finished waiting for %dms.", timeout), "info");
            if (then) {
                try {
                    then.call(self, self);
                } catch (error) {
                    self.emit('wait.error', error);
                    if (!self.options.silentErrors) {
                        throw error;
                    }
                }
            }
            self.waitDone();
        }, timeout, this);
    });
};

Casper.prototype.waitStart = function waitStart() {
    "use strict";
    this.emit('wait.start');
    this.pendingWait = true;
};

Casper.prototype.waitDone = function waitDone() {
    "use strict";
    this.emit('wait.done');
    this.pendingWait = false;
};

/**
 * Waits until a function returns true to process a next step.
 *
 * @param  Function  testFx     A function to be evaluated for returning condition satisfecit
 * @param  Function  then       The next step to perform (optional)
 * @param  Function  onTimeout  A callback function to call on timeout (optional)
 * @param  Number    timeout    The max amount of time to wait, in milliseconds (optional)
 * @param  Object    details    A property bag of information about the condition being waited on (optional)
 * @return Casper
 */
Casper.prototype.waitFor = function waitFor(testFx, then, onTimeout, timeout, details) {
    "use strict";
    this.checkStarted();
    timeout = timeout || this.options.waitTimeout;
    details = details || { testFx: testFx };
    if (!utils.isFunction(testFx)) {
        throw new CasperError("waitFor() needs a test function");
    }
    if (then && !utils.isFunction(then)) {
        throw new CasperError("waitFor() next step definition must be a function");
    }
    return this.then(function _step() {
        this.waitStart();
        var start = new Date().getTime();
        var condition = false;
        var interval = setInterval(function _check(self) {
            /*jshint maxstatements:20*/
            if ((new Date().getTime() - start < timeout) && !condition) {
                condition = testFx.call(self, self);
                return;
            }
            self.waitDone();
            if (!condition) {
                self.log("Casper.waitFor() timeout", "warning");
                var onWaitTimeout = onTimeout ? onTimeout : self.options.onWaitTimeout;
                self.emit('waitFor.timeout', timeout, details);
                clearInterval(interval); // refs #383
                if (!utils.isFunction(onWaitTimeout)) {
                    throw new CasperError('Invalid timeout function');
                }
                try {
                    return onWaitTimeout.call(self, timeout, details);
                } catch (error) {
                    self.emit('waitFor.timeout.error', error);
                    if (!self.options.silentErrors) {
                        throw error;
                    }
                } finally {
                    return;
                }
            }
            self.log(f("waitFor() finished in %dms.", new Date().getTime() - start), "info");
            clearInterval(interval);
            if (then) {
                self.then(then);
            }
        }, this.options.retryTimeout, this);
        this.waiters.push(interval);
    });
};

/**
 * Waits for a popup page having its url matching the provided pattern to be opened
 * and loaded.
 *
 * @param  String|RegExp  urlPattern  The popup url pattern
 * @param  Function       then        The next step function (optional)
 * @param  Function       onTimeout   Function to call on operation timeout (optional)
 * @param  Number         timeout     Timeout in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitForPopup = function waitForPopup(urlPattern, then, onTimeout, timeout) {
    "use strict";
    return this.waitFor(function() {
        try {
            this.popups.find(urlPattern);
            return true;
        } catch (e) {
            return false;
        }
    }, then, onTimeout, timeout, { popup: urlPattern });
};

/**
 * Waits until a given resource is loaded
 *
 * @param  String/Function/RegExp  test       A function to test if the resource exists.
 *                                            A string will be matched against the resources url.
 * @param  Function                then       The next step to perform (optional)
 * @param  Function                onTimeout  A callback function to call on timeout (optional)
 * @param  Number                  timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitForResource = function waitForResource(test, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        return this.resourceExists(test);
    }, then, onTimeout, timeout, { resource: test });
};

/**
 * Waits for a given url to be loaded.
 *
 * @param  String|RegExp  url  The url to wait for
 * @param  Function         then       The next step to perform (optional)
 * @param  Function         onTimeout  A callback function to call on timeout (optional)
 * @return Casper
 */
Casper.prototype.waitForUrl = function waitForUrl(url, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        if (utils.isString(url)) {
            return this.getCurrentUrl().indexOf(url) !== -1;
        } else if (utils.isRegExp(url)) {
            return url.test(this.getCurrentUrl());
        }
        throw new CasperError('invalid url argument');
    }, then, onTimeout, timeout, { url: url });
};

/**
 * Waits until an element matching the provided DOM CSS3/XPath selector exists in
 * remote DOM to process a next step.
 *
 * @param  String    selector   A DOM CSS3/XPath selector
 * @param  Function  then       The next step to perform (optional)
 * @param  Function  onTimeout  A callback function to call on timeout (optional)
 * @param  Number    timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitForSelector = function waitForSelector(selector, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        return this.exists(selector);
    }, then, onTimeout, timeout, { selector: selector });
};

/**
 * Waits until the page contains given HTML text or matches a given RegExp.
 *
 * @param  String|RegExp  pattern    Text or RegExp to wait for
 * @param  Function       then       The next step to perform (optional)
 * @param  Function       onTimeout  A callback function to call on timeout (optional)
 * @param  Number         timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitForText = function(pattern, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        var content = this.getPageContent();
        if (utils.isRegExp(pattern)) {
            return pattern.test(content);
        }
        return content.indexOf(pattern) !== -1;
    }, then, onTimeout, timeout, { text: pattern });
};

/**
 * Waits until the text on an element matching the provided DOM CSS3/XPath selector
 * is changed to a different value.
 *
 * @param String    selector    A DOM CSS3/XPath selector
 * @param Function  then        The next step to preform (optional)
 * @param Function  onTimeout   A callback function to call on timeout (optional)
 * @param Number    timeout     The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitForSelectorTextChange = function(selector, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    var currentSelectorText = this.fetchText(selector);
    return this.waitFor(function _check() {
        return currentSelectorText !== this.fetchText(selector);
    }, then, onTimeout, timeout, { selectorTextChange: selector });
};

/**
 * Waits until an element matching the provided DOM CSS3/XPath selector does not
 * exist in the remote DOM to process a next step.
 *
 * @param  String    selector   A DOM CSS3/XPath selector
 * @param  Function  then       The next step to perform (optional)
 * @param  Function  onTimeout  A callback function to call on timeout (optional)
 * @param  Number    timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitWhileSelector = function waitWhileSelector(selector, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        return !this.exists(selector);
    }, then, onTimeout, timeout, {
        selector: selector,
        waitWhile: true
    });
};

/**
 * Waits until an element matching the provided DOM CSS3/XPath selector is
 * visible in the remote DOM to process a next step.
 *
 * @param  String    selector   A DOM CSS3/XPath selector
 * @param  Function  then       The next step to perform (optional)
 * @param  Function  onTimeout  A callback function to call on timeout (optional)
 * @param  Number    timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitUntilVisible = function waitUntilVisible(selector, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        return this.visible(selector);
    }, then, onTimeout, timeout, { visible: selector });
};

/**
 * Waits until an element matching the provided DOM CSS3/XPath selector is no
 * longer visible in remote DOM to process a next step.
 *
 * @param  String    selector   A DOM CSS3/XPath selector
 * @param  Function  then       The next step to perform (optional)
 * @param  Function  onTimeout  A callback function to call on timeout (optional)
 * @param  Number    timeout    The max amount of time to wait, in milliseconds (optional)
 * @return Casper
 */
Casper.prototype.waitWhileVisible = function waitWhileVisible(selector, then, onTimeout, timeout) {
    "use strict";
    this.checkStarted();
    timeout = timeout ? timeout : this.options.waitTimeout;
    return this.waitFor(function _check() {
        return !this.visible(selector);
    }, then, onTimeout, timeout, {
        visible: selector,
        waitWhile: true
    });
};

/**
 * Makes the provided frame page as the currently active one. Note that the
 * active page will be reverted when finished.
 *
 * @param  String|Number    frameInfo  Target frame name or number
 * @param  Function  then       Next step function
 * @return Casper
 */
Casper.prototype.withFrame = function withFrame(frameInfo, then) {
    "use strict";
    this.then(function _step() {
        if (utils.isNumber(frameInfo)) {
            if (frameInfo > this.page.childFramesCount() - 1) {
                throw new CasperError(f('Frame number "%d" is out of bounds.', frameInfo));
            }
        } else if (this.page.childFramesName().indexOf(frameInfo) === -1) {
            throw new CasperError(f('No frame named "%s" was found.', frameInfo));
        }
        // make the frame page the currently active one
        this.page.switchToChildFrame(frameInfo);
    });
    try {
        this.then(then);
    } catch (e) {
        // revert to main page on error
        this.warn("Error while processing frame step: " + e);
        this.page.switchToParentFrame();
        throw e;
    }
    return this.then(function _step() {
        // revert to main page
        this.page.switchToParentFrame();
    });
};

/**
 * Makes the provided frame page as the currently active one. Note that the
 * active page will be reverted when finished.
 *
 * @param  String|RegExp|WebPage  popup  Target frame page information
 * @param  Function               then   Next step function
 * @return Casper
 */
Casper.prototype.withPopup = function withPopup(popupInfo, then) {
    "use strict";
    this.then(function _step() {
        var popupPage = this.popups.find(popupInfo);
        if (!utils.isFunction(then)) {
            throw new CasperError("withPopup() requires a step function.");
        }
        // make the popup page the currently active one
        this.page = popupPage;
    });
    try {
        this.then(then);
    } catch (e) {
        // revert to main page on error
        this.log("error while processing popup step: " + e, "error");
        this.page = this.mainPage;
        throw e;
    }
    return this.then(function _step() {
        // revert to main page
        this.page = this.mainPage;
    });
};

/**
 * Changes the current page zoom factor.
 *
 * @param  Number  factor  The zoom factor
 * @return Casper
 */
Casper.prototype.zoom = function zoom(factor) {
    "use strict";
    this.checkStarted();
    if (!utils.isNumber(factor) || factor <= 0) {
        throw new CasperError("Invalid zoom factor: " + factor);
    }
    this.page.zoomFactor = factor;
    return this;
};

/**
 * Extends Casper's prototype with provided one.
 *
 * @param  Object  proto  Prototype methods to add to Casper
 * @deprecated
 * @since 0.6
 */
Casper.extend = function(proto) {
    "use strict";
    this.emit("deprecated", "Casper.extend() has been deprecated since 0.6; check the docs")
    if (!utils.isObject(proto)) {
        throw new CasperError("extends() only accept objects as prototypes");
    }
    utils.mergeObjects(Casper.prototype, proto);
};

exports.Casper = Casper;

/**
 * Creates a new WebPage instance for Casper use.
 *
 * @param  Casper  casper  A Casper instance
 * @return WebPage
 */
function createPage(casper) {
    /*jshint maxstatements:20*/
    "use strict";
    var page = require('webpage').create();
    page.onAlert = function onAlert(message) {
        casper.log('[alert] ' + message, "info", "remote");
        casper.emit('remote.alert', message);
        if (utils.isFunction(casper.options.onAlert)) {
            casper.options.onAlert.call(casper, casper, message);
        }
    };
    page.onConfirm = function onConfirm(message) {
        if ('page.confirm' in casper._filters) {
            return casper.filter('page.confirm', message);
        }
        return true;
    };
    page.onConsoleMessage = function onConsoleMessage(msg) {
        // client utils casper console message
        var consoleTest = /^\[casper\.echo\]\s?([\s\S]*)/.exec(msg);
        if (consoleTest && consoleTest.length === 2) {
            casper.echo(consoleTest[1]);
            return; // don't trigger remote.message event for these
        }
        // client utils log messages
        var logLevel = "info",
            logTest = /^\[casper:(\w+)\]\s?([\s\S]*)/m.exec(msg);
        if (logTest && logTest.length === 3) {
            logLevel = logTest[1];
            msg = logTest[2];
            casper.log(msg, logLevel, "remote");
        } else {
            casper.emit('remote.message', msg);
        }
    };

    page.onCallback = function onCallback(data){
        casper.emit('remote.callback',data);
    };

    page.onError = function onError(msg, trace) {
        casper.emit('page.error', msg, trace);
    };
    page.onInitialized = function onInitialized() {
        casper.emit('page.initialized', page);
        if (utils.isFunction(casper.options.onPageInitialized)) {
            casper.log("Post-configuring WebPage instance", "debug");
            casper.options.onPageInitialized.call(casper, page);
        }
    };
    page.onLoadStarted = function onLoadStarted() {
        // in some case, there is no navigation requested event, so
        // be sure that browserInitializing is false to not block checkStep()
        casper.browserInitializing = false;
        casper.loadInProgress = true;
        casper.emit('load.started');
    };
    page.onLoadFinished = function onLoadFinished(status) {
        /*jshint maxstatements:20*/
        if (status !== "success") {
            casper.emit('load.failed', {
                status:      status,
                http_status: casper.currentHTTPStatus,
                url:         casper.requestUrl
            });
            var message = 'Loading resource failed with status=' + status;
            if (casper.currentHTTPStatus) {
                message += f(' (HTTP %d)', casper.currentHTTPStatus);
            }
            message += ': ' + casper.requestUrl;
            casper.log(message, "warning");
            casper.navigationRequested = false;
            casper.browserInitializing = false;
            if (utils.isFunction(casper.options.onLoadError)) {
                casper.options.onLoadError.call(casper, casper, casper.requestUrl, status);
            }
        }
        // local client scripts
        casper.injectClientScripts();
        // remote client scripts
        casper.includeRemoteScripts();
        // Client-side utils injection
        casper.injectClientUtils();
        // history
        casper.history.push(casper.getCurrentUrl());
        casper.emit('load.finished', status);
        casper.loadInProgress = false;
    };
    page.onNavigationRequested = function onNavigationRequested(url, type, willNavigate, isMainFrame) {
        casper.log(f('Navigation requested: url=%s, type=%s, willNavigate=%s, isMainFrame=%s',
                     url, type, willNavigate, isMainFrame), "debug");
        casper.browserInitializing = false;
        if (isMainFrame && casper.requestUrl !== url) {
            var currentUrl = casper.requestUrl;
            var newUrl = url;
            var pos = currentUrl.indexOf('#')
            if (pos !== -1) {
                currentUrl = currentUrl.substring(0, pos);
            }
            pos = newUrl.indexOf('#')
            if (pos !== -1) {
                newUrl = newUrl.substring(0, pos);
            }
            // for URLs that are only different by their hash part
            // or if navigation locked (willNavigate == false)
            // don't turn navigationRequested to true, because
            // there will not be loadStarted, loadFinished events
            // so it could cause issues (for exemple, checkStep that
            // do no execute the next step -> infinite loop on checkStep)
            if (willNavigate && currentUrl !== newUrl)
                casper.navigationRequested  = true;

            if (willNavigate) {
                casper.requestUrl = url;
            }
        }
        casper.emit('navigation.requested', url, type, willNavigate, isMainFrame);
    };
    page.onPageCreated = function onPageCreated(popupPage) {
        casper.emit('popup.created', popupPage);
        popupPage.onLoadFinished = function onLoadFinished() {
            // SlimerJS needs this line of code because of issue
            // https://github.com/laurentj/slimerjs/issues/48
            // else checkStep turns into an infinite loop
            // after clicking on an <a target="_blank">
            casper.navigationRequested  = false;
            casper.popups.push(popupPage);
            casper.emit('popup.loaded', popupPage);
        };
        popupPage.onClosing = function onClosing(closedPopup) {
            casper.popups.clean(closedPopup);
            casper.emit('popup.closed', closedPopup);
        };
    };
    page.onPrompt = function onPrompt(message, value) {
        return casper.filter('page.prompt', message, value);
    };
    page.onResourceReceived = function onResourceReceived(resource) {
        http.augmentResponse(resource);
        casper.emit('resource.received', resource);
        if (utils.isFunction(casper.options.onResourceReceived)) {
            casper.options.onResourceReceived.call(casper, casper, resource);
        }
        casper.handleReceivedResource(resource);
    };
    page.onResourceRequested = function onResourceRequested(requestData, request) {
        casper.emit('resource.requested', requestData, request);
        if (requestData.url === casper.requestUrl) {
            casper.emit('page.resource.requested', requestData, request);
        }
        if (utils.isFunction(casper.options.onResourceRequested)) {
            casper.options.onResourceRequested.call(casper, casper, requestData, request);
        }
    };
    page.onResourceError = function onResourceError(resourceError) {
        casper.emit('resource.error', resourceError);
    };
    page.onUrlChanged = function onUrlChanged(url) {
        casper.log(f('url changed to "%s"', url), "debug");
        casper.navigationRequested = false;
        casper.emit('url.changed', url);
    };
    casper.emit('page.created', page);
    return page;
}
