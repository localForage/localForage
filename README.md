# localForage
[![Build Status](https://travis-ci.org/localForage/localForage.svg?branch=master)](http://travis-ci.org/localForage/localForage)
[![NPM version](https://badge.fury.io/js/localforage.svg)](http://badge.fury.io/js/localforage)
[![Dependency Status](https://img.shields.io/david/localForage/localForage.svg)](https://david-dm.org/localForage/localForage)
[![npm](https://img.shields.io/npm/dm/localforage.svg?maxAge=2592000)]()

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

Download the [latest localForage from GitHub](https://github.com/localForage/localForage/releases/latest), or install with
[npm](https://www.npmjs.com/):

```bash
npm install localforage
```

or [bower](http://bower.io):

```bash
bower install localforage
```

localForage is compatible with [browserify](http://browserify.org/).

[supported browsers]: https://github.com/localForage/localForage/wiki/Supported-Browsers-Platforms

## Support

Lost? Need help? Try the
[localForage API documentation](https://localforage.github.io/localForage).

If you're stuck using the library, running the tests, or want to contribute
to localForage, you can visit
[irc.freenode.net](https://freenode.net/) and head to the `#localforage`
channel to ask questions about localForage.

The best person to ask about localForage is [**tofumatt**][tofumatt], who
is usually online from 8am-8pm GMT (London Time).

[tofumatt]: http://tofumatt.com/

# How to use localForage

## Callbacks vs Promises

Because localForage uses async storage, it has an async API.
It's otherwise exactly the same as the
[localStorage API](https://hacks.mozilla.org/2009/06/localstorage/).

localForage has a dual API that allows you to either use Node-style callbacks 
or [Promises](https://www.promisejs.org/). If you are unsure which one is right for you, it's recommended to use Promises.

Here's an example of the Node-style callback form:

```js
localforage.setItem('key', 'value', function (err) {
  // if err is non-null, we got an error
  localforage.getItem('key', function (err, value) {
    // if err is non-null, we got an error. otherwise, value is the value 
  });
});
```

And the Promise form:

```js
localforage.setItem('key', 'value').then(function () {
  return localforage.getItem('key');
}).then(function (value) {
  // we got our value
}).catch(function (err) {
  // we got an error
});
```

For more examples, please visit [the API docs](https://localforage.github.io/localForage). 

## Storing Blobs, TypedArrays, and other JS objects

You can store any type in localForage; you aren't limited to strings like in
localStorage. Even if localStorage is your storage backend, localForage
automatically does `JSON.parse()` and `JSON.stringify()` when getting/setting
values.

localForage supports storing all native JS objects that can be serialized to
JSON, as well as ArrayBuffers, Blobs, and TypedArrays. Check the
[API docs][api] for a full list of types supported by localForage.

All types are supported in every storage backend, though storage limits in
localStorage make storing many large Blobs impossible.

[api]: https://localforage.github.io/localForage/#setitem

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
[`config`](#configuration) are supported.

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

localForage 1.3+ works with both Browserify and Webpack. If you're using an
earlier version of localForage and are having issues with Browserify or
Webpack, please upgrade to 1.3.0 or above.

If you're using localForage in your own build system (eg. browserify or
webpack) make sure you have the
[required plugins and transformers](https://github.com/localForage/localForage/blob/master/package.json#L24)
installed (eg. `npm install --save-dev babel-plugin-system-import-transformer`).

## TypeScript

To import localForage in TypeScript use:

```javascript
import * as localForage from "localforage";
```

For older versions of Typescript, where ES6 style imports are not supported for UMD modules like localForage, you should use:

```javascript
import localForage = require("localforage");
```

## Framework Support

If you use a framework listed, there's a localForage storage driver for the
models in your framework so you can store data offline with localForage. We
have drivers for the following frameworks:

* [AngularJS](https://github.com/ocombe/angular-localForage)
* [Backbone](https://github.com/localForage/localForage-backbone)
* [Ember](https://github.com/genkgo/ember-localforage-adapter)

If you have a driver you'd like listed, please
[open an issue](https://github.com/localForage/localForage/issues/new) to have it
added to this list.

## Custom Drivers

You can create your own driver if you want; see the
[`defineDriver`](https://localforage.github.io/localForage/#definedriver) API docs.

There is a [list of custom drivers on the wiki][custom drivers].

[custom drivers]: https://github.com/localForage/localForage/wiki/Custom-Drivers

# Working on localForage

You'll need [node/npm](http://nodejs.org/) and
[bower](http://bower.io/#installing-bower).

To work on localForage, you should start by
[forking it](https://github.com/localForage/localForage/fork) and installing its
dependencies. Replace `USERNAME` with your GitHub username and run the
following:

```bash
# Install bower globally if you don't have it:
npm install -g bower

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
[linter](http://jshint.com/).

localForage is designed to run in the browser, so the tests explicitly require
a browser environment. Local tests are run on a headless WebKit (using
[PhantomJS](http://phantomjs.org)).

When you submit a pull request, tests will be run against all browsers that
localForage supports on Travis CI using [Sauce Labs](https://saucelabs.com/).

# License

This program is free software; it is distributed under an
[Apache License](https://github.com/localForage/localForage/blob/master/LICENSE).

---

Copyright (c) 2013-2016 [Mozilla](https://mozilla.org)
([Contributors](https://github.com/localForage/localForage/graphs/contributors)).
