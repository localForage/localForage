# localForage #

localForage is a handy library that improves the offline experience of your web
app by using asynchronous storage (via IndexedDB where available) but with a
simple, `localStorage`-like API.

localForage uses IndexedDB primarily, but includes a localStorage-backed
fallback store for browsers with no IndexedDB storage. A WebSQL driver is in
the works.

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

    // Async and sexy!
    localForage.getItem('key', alert);

Also of note is that localForage will automatically convert the values you
get and set to JSON if you happen to be using localStorage as a backend. You
don't have to pollute your code with `JSON.stringify()` calls!

## Backbone.js

localForage includes a [Backbone.js](http://backbonejs.org/) storage library
that you can use to store your Backbone collections offline with only a few
lines of really simple code.

Of course, Backbone.js is entirely optional and you can use localForage
without it!
