# localForage [![Build Status](https://secure.travis-ci.org/mozilla/localForage.png?branch=master)](http://travis-ci.org/mozilla/localForage)

localForage is a fast and simple storage library for JavaScript. localForage
improves the offline experience of your web app by using asynchronous storage
(IndexedDB or WebSQL) with a simple, `localStorage`-like API.

localForage uses localStorage in browsers with no IndexedDB or
WebSQL support. See [the wiki for detailed compatibility info][supported browsers].

To use localForage, just drop a single JavaScript file into your page:

```html
<script src="localforage.js"></script>
<script>localforage.getItem('something', myCallback);</script>
```

Download the [latest localForage from GitHub](https://github.com/mozilla/localForage/releases/latest), or install with
[npm](https://www.npmjs.org/):

```bash
npm install localforage
```

or [bower](http://bower.io):

```bash
bower install localforage
```

localForage is compatible with [browserify](http://browserify.org/).

[supported browsers]: https://github.com/mozilla/localForage/wiki/Supported-Browsers-Platforms

## Support

Lost? Need help? Try the
[localForage API documentation](https://mozilla.github.io/localForage).

If you're stuck using the library, running the tests, or want to contribute
to localForage, you can visit
[irc.mozilla.org](https://wiki.mozilla.org/IRC) and head to the `#apps`
channel to ask questions about localForage.

The best person to ask about localForage is [**tofumatt**][tofumatt], who
is usually online from 8am-8pm GMT (London Time).

[tofumatt]: http://tofumatt.com/

# How to use localForage

## Callbacks

Because localForage uses async storage, it has an async API.
It's otherwise exactly the same as the
[localStorage API](https://hacks.mozilla.org/2009/06/localstorage/).

```javascript
// In localStorage, we would do:
var obj = { value: "hello world" };
localStorage.setItem('key', JSON.stringify(obj));
alert(obj.value);

// With localForage, we use callbacks:
localforage.setItem('key', obj, function(err, result) { alert(result.value); });
```

Similarly, please don't expect a return value from calls to
`localforage.getItem()`. Instead, use a callback:

```javascript
// Synchronous; slower!
var value = JSON.parse(localStorage.getItem('key'));
alert(value);

// Async, fast, and non-blocking!
localforage.getItem('key', function(err, value) { alert(value) });
```

Callbacks in localForage are Node-style (error argument first) since version
`0.9.3`. This means if you're using callbacks, your code should look like this:

```javascript
// Use err as your first argument.
localforage.getItem('key', function(err, value) {
    if (err) {
        console.error('Oh noes!');
    } else {
        alert(value);
    }
});
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

When using Promises, `err` is **not** the first argument passed to a function.
Instead, you handle an error with the rejection part of the Promise:

```javascript
// A full setItem() call with Promises.
localforage.setItem('key', 'value').then(function(value) {
    alert(value + ' was set!');
}, function(error) {
    console.error(error);
});
```

localForage relies on native [ES6 Promises](http://www.promisejs.org/), but
[ships with an awesome polyfill](https://github.com/jakearchibald/ES6-Promises)
for browsers that don't support ES6 Promises yet.

## Storing Blobs, TypedArrays, and other JS objects

localForage supports storing all native JS objects that can be serialized to
JSON, as well as ArrayBuffers, Blobs, and TypedArrays. Check the
[API docs][api] for a full list of types supported by localForage.

All types are supported in every storage backend, though storage limits in
localStorage make storing many large Blobs impossible.

[api]: https://mozilla.github.io/localForage/#setitem

## Configuration

You can set database information with the `config()` method.
Available options are `driver`, `name`, `storeName`, `version`, `size`, and
`description`.

Example:
```javascript
localforage.config({
    driver      : localforage.WEBSQL, // Force WebSQL; same as using setDriver()
    name        : 'myApp',
    version     : 1.0,
    size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName   : 'keyvaluepairs', // Should be alphanumeric, with underscores.
    description : 'some description'
});
```

**Note:** you must call `config()` _before_ you interact with your data. This
means calling `config()` before using `getItem()`, `setItem()`, `removeItem()`,
`clear()`, `key()`, `keys()` or `length()`.

## Multiple instances

You can create multiple instances of localForage that point to different stores
using `createInstance`. All the configuration options used by
`[config](#configuration)` are supported.

``` javascript
var store = localforage.createInstance({
  name: "nameHere"
});

var otherStore = localforage.createInstance({
  name: "otherName"
});

// Setting the key on one of these doesn't affect the other.
store.setItem("key", "value");
otherStore.setItem("key", "value2");
```

## RequireJS

You can use localForage with [RequireJS](http://requirejs.org/):

```javascript
define(['localforage'], function(localforage) {
    // As a callback:
    localforage.setItem('mykey', 'myvalue', console.log);

    // With a Promise:
    localforage.setItem('mykey', 'myvalue').then(console.log);
});
```

## Browserify and Webpack

localForage should work with both Browserify and Webpack as of the current
master branch. Older releases have spotty support but this will soon be fixed.

**For browserify:** ensure that you have the
[required plugins and transformers](https://github.com/mozilla/localForage/blob/master/package.json#L57)
installed.

**For Webpack:** currently, you need to require localForage as `require('script!localforage')` using [webpack script-loader](https://github.com/webpack/script-loader).

## Framework Support

If you use a framework listed, there's a localForage storage driver for the
models in your framework so you can store data offline with localForage. We
have drivers for the following frameworks:

* [AngularJS](https://github.com/ocombe/angular-localForage)
* [Backbone](https://github.com/mozilla/localForage-backbone)
* [Ember](https://github.com/genkgo/ember-localforage-adapter)

If you have a driver you'd like listed, please
[open an issue](https://github.com/mozilla/localForage/issues/new) to have it
added to this list.

## Custom Drivers

You can create your own driver if you want; see the
[`defineDriver`](https://mozilla.github.io/localForage/#definedriver) API docs.

There is a [list of custom drivers on the wiki][custom drivers].

[custom drivers]: https://github.com/mozilla/localForage/wiki/Custom-Drivers

# Working on localForage

You'll need [node/npm](http://nodejs.org/),
[bower](http://bower.io/#installing-bower), and
[Grunt](http://gruntjs.com/getting-started#installing-the-cli).

To work on localForage, you should start by
[forking it](https://github.com/mozilla/localForage/fork) and installing its
dependencies. Replace `USERNAME` with your GitHub username and run the
following:

```bash
# Install bower and grunt globally if you don't have them:
npm install -g bower grunt-cli

# Replace USERNAME with your GitHub username:
git clone git@github.com:USERNAME/localForage.git
cd localForage
npm install
bower install
```

Omitting the bower dependencies will cause the tests to fail!

## Running Tests

You need PhantomJS installed to run local tests. Run `npm test` (or,
directly: `grunt test`). Your code must also pass the
[linter](http://www.jshint.com/).

localForage is designed to run in the browser, so the tests explicitly require
a browser environment. Local tests are run on a headless WebKit (using
[PhantomJS](http://phantomjs.org)).

When you submit a pull request, tests will be run against all browsers that
localForage supports on Travis CI using [Sauce Labs](https://saucelabs.com/).

## Building the API Documentation

We currently use a Ruby tool to build our
[API documentation](https://mozilla.github.io/localForage). You can install the Ruby dependencies with [Bundler](http://bundler.io):

```bash
# From inside the localForage directory
bundle install
```

Then use `grunt` to serve the site:

```bash
grunt site
```

Navigate to [localhost:4567](http://localhost:4567/) in your browser to see the
docs.

There is an [open issue to move to a node tool for the docs](https://github.com/mozilla/localForage/issues/192).

# License

This program is free software; it is distributed under an
[Apache License](https://github.com/mozilla/localForage/blob/master/LICENSE).

---

Copyright (c) 2013-2015 [Mozilla](https://mozilla.org)
([Contributors](https://github.com/mozilla/localForage/graphs/contributors)).
