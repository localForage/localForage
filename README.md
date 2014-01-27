# localForage #

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
* Safari (3.1+)

## Callbacks ##

Because localForage uses async storage, it has an async API. It's otherwise
exactly the same as the
[localStorage API](https://hacks.mozilla.org/2009/06/localstorage/).

    // In localStorage, we would do:
    localStorage.setItem('key', JSON.stringify('value'));
    doSomethingElse();

    // With localForage, we use callbacks:
    localForage.setItem('key', 'value', doSomethingElse);

Similarly, please don't expect a return value from calls to
`localForage.getItem()`. Instead, use a callback:
    
    // Synchronous; slower!
    var value = JSON.parse(localStorage.getItem('key'));
    alert(value);

    // Async, fast, and non-blocking!
    localForage.getItem('key', alert);

Also of note is that localForage will automatically convert the values you
get and set to JSON if you happen to be using localStorage as a backend. You
don't have to pollute your code with `JSON.stringify()` and `JSON.parse` calls!

If you try to read a key that hasn't been stored yet, `null` will be returned
in the callback.

## Promises ##

Promises are pretty cool! If you'd rather use promises than callbacks,
localForage supports that too:

    function doSomethingElse(value) {
        console.log(value);
    }

    // With localForage, we allow promises:
    localForage.setItem('key', 'value').then(doSomethingElse);

localForage relies on native [ES6 Promises](http://www.promisejs.org/), but
[ships with an awesome polyfill](https://github.com/jakearchibald/ES6-Promises)
for browsers that don't yet support ES6 Promises natively.

## Forcing localStorage ##

For development, it can be easier to use the
slower--but easier to debug--localStorage driver. Because localStorage can
easily be inspected from the console, we allow for this with a simple global
variable assignment: `window._FORCE_LOCALSTORAGE = true;`. If this is set to
any truthy value, localStorage will be used regardless of driver.

**TODO:** Allow actual driver selection. (Filed as issue #18.)

## Backbone.js ##

localForage includes a [Backbone.js](http://backbonejs.org/) storage library
that you can use to store your Backbone collections offline with only a few
lines of really simple code.

Of course, Backbone.js is entirely optional and you can use localForage
without it!
