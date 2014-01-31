# localForage [![Build Status](https://secure.travis-ci.org/mozilla/localForage.png?branch=master)](http://travis-ci.org/mozilla/localForage) #

localForage is a handy library that improves the offline experience of your web
app by using asynchronous storage (via IndexedDB or WebSQL where available) but
with a simple, `localStorage`-like API.

localForage includes a localStorage-backed fallback store for browsers with no
IndexedDB or WebSQL support. This means that asynchronous storage is available
in Chrome, Firefox, and Safari (including Safari Mobile).

## Browser Support ##

All of 'em. Worst-case localStorage fallback will be used, but asynchronous
storage will be used for:

* Android Browser (2.1+)
* Blackberry (7+)
* Chrome (23+)
* Chrome for Android (32+)
* Firefox (10+)
* Firefox for Android (25+)
* IE (10+)
* IE Mobile (10+)
* Opera (15+)
* Opera Mobile (11+)
* Phonegap/Apache Cordova (1.2.0+)
* Safari (3.1+)

Note that, because of WebSQL support, apps packaged with Phonegap will also
use asynchronous storage. Pretty slick!

## Callbacks ##

Because localForage uses async storage, it has an async API. It's otherwise
exactly the same as the
[localStorage API](https://hacks.mozilla.org/2009/06/localstorage/).

```javascript
// In localStorage, we would do:
localStorage.setItem('key', JSON.stringify('value'));
doSomethingElse();

// With localForage, we use callbacks:
localForage.setItem('key', 'value', doSomethingElse);
```

Similarly, please don't expect a return value from calls to
`localForage.getItem()`. Instead, use a callback:

```javascript
// Synchronous; slower!
var value = JSON.parse(localStorage.getItem('key'));
alert(value);

// Async, fast, and non-blocking!
localForage.getItem('key', alert);
```

You can store any type in localForage; you aren't limited to strings like in
localStorage. Even if localStorage is your storage backend, localForage
automatically does `JSON.parse()` and `JSON.stringify()` when getting/setting
values.

## Promises ##

Promises are pretty cool! If you'd rather use promises than callbacks,
localForage supports that too:

```javascript
function doSomethingElse(value) {
    console.log(value);
}

// With localForage, we allow promises:
localForage.setItem('key', 'value').then(doSomethingElse);
```

localForage relies on native [ES6 Promises](http://www.promisejs.org/), but
[ships with an awesome polyfill](https://github.com/jakearchibald/ES6-Promises)
for browsers that don't yet support ES6 Promises natively.

## Forcing localStorage ##

For development, it can be easier to use the
slower--but easier to debug--localStorage driver. Because localStorage can
easily be inspected from the console, we allow for this with a simple global
variable assignment: 
    
```javascript
window._FORCE_LOCALSTORAGE = true;
```

If `window._FORCE_LOCALSTORAGE` is set to any truthy value, localStorage will
be used regardless of driver.

**TODO:** Allow actual driver selection. (Filed as
[issue #18](https://github.com/mozilla/localForage/issues/18).)

## Backbone.js ##

localForage includes a [Backbone.js](http://backbonejs.org/) storage library
that you can use to store your Backbone collections offline with only a few
lines of really simple code.

Of course, Backbone.js is entirely optional and you can use localForage
without it!

# License #

This program is free software; it is distributed under an
[Apache License](http://github.com/mozilla/localForage/blob/master/LICENSE).

---

Copyright (c) 2013-2014 [Mozilla](https://mozilla.org)
([Contributors](https://github.com/mozilla/localForage/graphs/contributors)).
