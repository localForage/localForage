# localForage [![Build Status](https://secure.travis-ci.org/mozilla/localForage.png?branch=master)](http://travis-ci.org/mozilla/localForage)

localForage is a handy library that improves the offline experience of your web
app by using asynchronous storage (via IndexedDB or WebSQL where available) but
with a simple, `localStorage`-like API.

localForage includes a localStorage-backed fallback store for browsers with no
IndexedDB or WebSQL support. Asynchronous storage is available in the current
versions of all major browsers: Chrome, Firefox, IE, and Safari
(including Safari Mobile). See below for detailed compatibility info.

## Supported Browsers/Platforms

localForage works in all modern browsers (IE 8 and above).
_Asynchronous storage_ is available in all browsers **in bold**, with their
version that supports localStorage in parentheses.

* **Android Browser 2.1** 
* **Blackberry 7**
* **Chrome 23** (Chrome 4.0 with localStorage)
* **Chrome for Android 32**
* **Firefox 10** (Firefox 3.5 with localStorage)
* **Firefox for Android 25**
* **Firefox OS 1.0**
* **IE 10** (IE 8 with localStorage)
* **IE Mobile 10**
* **Opera 15** (Opera 10.5 with localStorage)
* **Opera Mobile 11**
* **Phonegap/Apache Cordova 1.2.0**
* **Safari 3.1** (includes Mobile Safari)

Note that, because of WebSQL support, apps packaged with Phonegap will also
use asynchronous storage. Pretty slick!

## Support

Lost? Need help? This README has some simple guides and the code has decent
documentation, but I'm working on a real API guide. In the meantime, if you're
stuck using the library, running the tests, or want to contribute, you can
visit [irc.mozilla.org](https://wiki.mozilla.org/IRC) and head to the `#apps`
channel to ask questions about localForage.

# How to use localForage

## Callbacks

Because localForage uses async storage, it has an async API. It's otherwise
exactly the same as the
[localStorage API](https://hacks.mozilla.org/2009/06/localstorage/).

```javascript
// In localStorage, we would do:
localStorage.setItem('key', JSON.stringify('value'));
doSomethingElse();

// With localForage, we use callbacks:
localforage.setItem('key', 'value', doSomethingElse);
```

Similarly, please don't expect a return value from calls to
`localforage.getItem()`. Instead, use a callback:

```javascript
// Synchronous; slower!
var value = JSON.parse(localStorage.getItem('key'));
alert(value);

// Async, fast, and non-blocking!
localforage.getItem('key', alert);
```

You can store any type in localForage; you aren't limited to strings like in
localStorage. Even if localStorage is your storage backend, localForage
automatically does `JSON.parse()` and `JSON.stringify()` when getting/setting
values.

## Promises

Promises are pretty cool! If you'd rather use promises than callbacks,
localForage supports that too:

```javascript
function doSomethingElse(value) {
    console.log(value);
}

// With localForage, we allow promises:
localforage.setItem('key', 'value').then(doSomethingElse);
```

localForage relies on native [ES6 Promises](http://www.promisejs.org/), but
[ships with an awesome polyfill](https://github.com/jakearchibald/ES6-Promises)
for browsers that don't yet support ES6 Promises natively.

## Driver Selection (i.e. forcing localStorage)

For development, it can be easier to use the
slower--but easier to debug--localStorage driver (mostly because localStorage
can easily be inspected from the console). You can use the `setDriver()` method
to change the driver localForage is using at any time.
    
```javascript
// If you aren't using JS modules, things are loaded synchronously.
localforage.setDriver('localStorageWrapper');
alert(localforage.driver);
  => 'localStorageWrapper'

// If you're using modules, things load asynchronously, so you should use
// callbacks or promises to ensure things have loaded.
localforage.setDriver('localStorageWrapper', function() {
    alert(localforage.driver);
});
  => 'localStorageWrapper'

// The promises version:
localforage.setDriver('localStorageWrapper').then(function() {
    alert(localforage.driver);
});
  => 'localStorageWrapper'
```

You can actually force any available driver with this method, but given that
the best driver will be selected automatically when the library is loaded, this
method is mostly useful in forcing localStorage.

Note that trying to load a driver unavailable on the current browser (like
trying to load WebSQL in Gecko) will fail and the previously loaded "best
choice" will continue to be used.

## Configuration

You can set database information, by giving the `window.localForageConfig`
variable a hash of options. Available options are `name`, `storeName`,
`version`, and `description`.

Example:
```javascript
window.localForageConfig = {
    name        : 'myApp',
    version     : 1.0,
    size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName   : 'keyvaluepairs',
    description : 'some description'
};
```

## RequireJS

You can use localForage with [RequireJS](http://requirejs.org/), but note that
because of the way drivers are loaded using RequireJS, you'll want to make sure
`localforage.ready`'s Promise has been fulfilled to ensure all of localForage
is ready to use before you make set/get calls. Essentially, to use localForage
with RequireJS, your code should look like this:

```javascript
define(['localforage'], function(localforage) {
    // As a callback:
    localforage.ready(function() {
        localforage.setItem('mykey', 'myvalue', console.log);
    });

    // With a Promise:
    localforage.ready().then(function() {
        localforage.setItem('mykey', 'myvalue', console.log);
    });
});
```

## Framework Support

If you use a framework listed, there's a localForage storage driver for the
models in your framework so you can store data offline with localForage. We
have drivers for the following frameworks:

* [AngularJS](https://github.com/ocombe/angular-localForage)
* [Backbone](https://github.com/mozilla/localForage-backbone)

If you have a driver you'd like listed, please
[open an issue](https://github.com/mozilla/localForage/issues/new) to have it
added to this list.

# Running Tests

**tl;dr:** You need PhantomJS and SlimerJS installed to run tests. Then, just
run `npm test` (or, directly, `grunt test`).

_Note for Windows users:_ SlimerJS doesn't seem to work on Windows for our
tests, so run the tests with `grunt test --force`. The SlimerJS versions will
be run on Travis when you submit a pull request.

localForage is designed to run in the browser, so the tests explicitly require
a browser environment instead of any JavaScript environment (i.e. node.js).
The tests are run on both a headless WebKit (using
[PhantomJS](http://phantomjs.org)) and
["headless" Gecko](http://slimerjs.org/faq.html) (using
[SlimerJS](http://slimerjs.org/)). The tests are written using
[CasperJS's tester module](http://docs.casperjs.org/en/latest/modules/tester.html).
We run tests against Gecko and WebKit to ensure that IndexedDB and WebSQL
support is functioning as-expected.

On Mac OS X, you'll need to install both PhantomJS and SlimerJS like so:

```
brew install phantomjs slimerjs
```

If you're using Windows or Linux, you can get
[get PhantomJS](http://phantomjs.org/download) and
[get SlimerJS](http://slimerjs.org/download) from their websites. I haven't
tried it myself, but it seems easy enough.

Generally you'll need a version of Firefox or XULRunner installed for SlimerJS
to run your tests. The exact steps how to install and setup SlimerJS are
described on the
[project homepage](http://slimerjs.org/install.html#install-firefox).

Once everything is installed you can simply type `grunt test`
to make sure the code is working as expected.

TODO: Provide Windows/Linux instructions; check into XULRunner setup.

# Frequently Asked Questions

### Will you add (or accept) support for X storage?

Maybe. If it's legacy storage (< IE 8), for a dead platform (WebOS), or
_really_ obscure (Apple Newton), I'm going to say "no". If it's for a new
browser technology or a platform-specific driver like Chrome Web Apps or
Firefox OS, then "yes" is probably the answer.

### Will you add support for node.js?

No. This is a library focused on offline storage inside a web browser. Node.js
already has lots of storage solutions. The problem this library aims to solve
is that web browsers differ greatly in their support for a common API for
dealing with the same kind of data. Node.js doesn't have that problem; if you
want to use an API, you just add a library to your `package.json`.

# License

This program is free software; it is distributed under an
[Apache License](http://github.com/mozilla/localForage/blob/master/LICENSE).

---

Copyright (c) 2013-2014 [Mozilla](https://mozilla.org)
([Contributors](https://github.com/mozilla/localForage/graphs/contributors)).
