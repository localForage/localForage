---
title: localForage API Reference

language_tabs:
  - javascript
  - coffeescript

toc_footers:
  - <a href="https://github.com/mozilla/localForage">Contribute to localForage</a>
  - <a href="https://github.com/tripit/slate">(Docs Powered by Slate)</a>

---

# localForage

```javascript
// In localStorage, we would do:
localStorage.setItem('key', JSON.stringify('value'));
doSomethingElse();

// With localForage, we use callbacks:
localforage.setItem('key', 'value', doSomethingElse);

// Or we can use Promises:
localforage.setItem('key', 'value').then(doSomethingElse);
```

```coffeescript
# In localStorage, we would do:
localStorage.setItem "key", JSON.stringify("value")
doSomethingElse()

# With localForage, we use callbacks:
localforage.setItem "key", "value", doSomethingElse

# Or we can use Promises:
localforage.setItem("key", "value").then doSomethingElse
```

**Offline storage, improved.**

localForage is a JavaScript library that improves the offline experience of
your web app by using an asynchronous data store with a simple,
`localStorage`-like API. It allows developers to
[store many types of data](#setitem) instead of just strings.

localForage includes a localStorage-backed fallback store for browsers with no
IndexedDB or WebSQL support. Asynchronous storage is available in the current
versions of all major browsers: Chrome, Firefox, IE, and Safari
(including Safari Mobile).

**localForage offers a callback API as well as support for the
[ES6 Promises API][]**, so you can use whichever you prefer.

[Download localforage.min.js][download]

[download]: https://mozilla.github.io/localForage/localforage.min.js
[ES6 Promises API]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise

# Installation

```bash
# Install via npm:
npm install localforage

# Or with bower:
bower install localforage
```
```html
<script src="localforage.js"></script>
<script>localforage.getItem('somekey', function(err, val) { alert(val) });</script>
```

To use localForage, [download the latest release](https://github.com/mozilla/localForage/releases) or install with [npm](https://www.npmjs.org/) (`npm install localforage`) or [bower](http://bower.io/) (`bower install localforage`).

Then simply include the JS file and start using localForage:
`<script src="localforage.js"></script>`. You don't need to run any init method
or wait for any `onready` events.

# Data API

These APIs deal with getting and setting data in the offline store.

## getItem

```javascript
localforage.getItem('somekey', function(err, value) {
    // Run this code once the value has been
    // loaded from the offline store.
    console.log(value);
});
localforage.getItem('somekey').then(function(value) {
    // The same code, but using ES6 Promises.
    console.log(value);
});
```

```coffeescript
localforage.getItem "somekey", (err, value) ->
  # Run this code once the value has been loaded
  # from the offline store.
  console.log value

localforage.getItem("somekey").then (value) ->
  # The same code, but using ES6 Promises.
  console.log(value)
```

`getItem(key, successCallback)`

Gets an item from the storage library and supplies the result to a callback.
If the key does not exist, `getItem()` will return `null`.

<aside class="notice">
  Even if `undefined` is saved, `null` will be returned by `getItem()`. This
  is due to a
  [limitation in localStorage](https://github.com/mozilla/localForage/pull/42),
  and for compatibility reasons localForage cannot store the value `undefined`.
</aside>

## setItem

```javascript
localforage.setItem('somekey', 'some value', function(err, value) {
    // Do other things once the value has been saved.
    console.log(value);
});

// Unlike localStorage, you can store non-strings.
localforage.setItem('my array', [1, 2, 'three'], function(err, value) {
    // This will output `1`.
    console.log(value[0]);
});

// You can even store binary data from an AJAX request.
request = new XMLHttpRequest();
request.open('GET', '/photo.jpg', true);
request.responseType = 'arraybuffer';

request.addEventListener('readystatechange', function() {
    if (request.readyState === 4) { // readyState DONE
        localforage.setItem('photo', request.response, function(image) {
            // This will be a valid blob URI for an <img> tag.
            var blob = new Blob([image]);
            var imageURI = window.URL.createObjectURL(blob);
        }
    }
});
```

```coffeescript
localforage.setItem "somekey", "some value", (err, value) ->
  # Do other things once the value has been saved.
  console.log value

# Unlike localStorage, you can store non-strings.
localforage.setItem "my array", [1, 2, "three"], (err, value) ->
  # This will output `1`.
  console.log value[0]

# You can even store binary data from an AJAX request.
request = new XMLHttpRequest()
request.open "GET", "photo.jpg", true
request.responseType = "arraybuffer"

request.addEventListener "readystatechange", ->
  if request.readyState == 4 # readyState DONE
    localforage.setItem "photo", request.response, image) ->
      # This will be a valid blob URI for an <img> tag.
      blob = new Blob [image]
      imageURI = window.URL.createObjectURL blob
```

`setItem(key, value, successCallback)`

Saves data to an offline store. You can store the following types of JavaScript
objects:

* **`Array`**
* **`ArrayBuffer`**
* **`Blob`**
* **`Float32Array`**
* **`Float64Array`**
* **`Int8Array`**
* **`Int16Array`**
* **`Int32Array`**
* **`Number`**
* **`Object`**
* **`Uint8Array`**
* **`Uint8ClampedArray`**
* **`Uint16Array`**
* **`Uint32Array`**
* **`String`**

<aside class="notice">
  When using localStorage and WebSQL backends, binary data will be serialized
  before being saved (and retrieved). This serialization will incur a size
  increase when binary data is saved.
</aside>

<a href="http://jsfiddle.net/ryfo1jk4/">Live demo</a>

## removeItem

```javascript
localforage.removeItem('somekey', function(err) {
    // Run this code once the key has been removed.
    console.log('Key is cleared!');
});
```

```coffeescript
localforage.removeItem "somekey", (err) ->
  # Run this code once the key has been removed.
  console.log "Key is cleared!"
```

`removeItem(key, successCallback)`

Removes the value of a key from the offline store.

<a href="http://jsfiddle.net/y1Ly0hk1/1/">Live demo</a>

## clear

```javascript
localforage.clear(function(err) {
    // Run this code once the database has been entirely deleted.
    console.log('Database is now empty.');
});
```

```coffeescript
localforage.clear (err) ->
  # Run this code once the database has been entirely deleted.
  console.log "Database is now empty."
```

`clear(successCallback)`

Removes every key from the database, returning it to a blank slate.

<aside class="warning">
  `localforage.clear()` will remove **every item in the offline store**. Use
  this method with caution.
</aside>

## length

```javascript
localforage.length(function(err, numberOfKeys) {
    // Outputs the length of the database.
    console.log(numberOfKeys);
});
```

```coffeescript
localforage.length (err, numberOfKeys) ->
  # Outputs the length of the database.
  console.log numberOfKeys
```

`length(successCallback)`

Gets the number of keys in the offline store (i.e. its "length").

## key

```javascript
localforage.key(2, function(err, keyName) {
    // Name of the key.
    console.log(keyName);
});
```

```coffeescript
localforage.key 2, (err, keyName) ->
  # Name of the key.
  console.log keyName
```

`key(keyIndex, successCallback)`

Get the name of a key based on its ID.

<aside class="notice">
  This method is inherited from the localStorage API, but is acknowledged to
  be kinda weird.
</aside>

## keys

```javascript
localforage.keys(function(err, keys) {
    // An array of all the key names.
    console.log(keys);
});
```

```coffeescript
localforage.keys (err, keys) ->
  # An array of all the key names.
  console.log keys
```

`keys(successCallback)`

Get the list of all keys in the datastore.

## iterate

```javascript
localforage.iterate(function(value, key, iterationNumber) {
    // Resulting key/value pair -- this callback
    // will be executed for every item in the
    // database.
    console.log([key, value]);
}, function(err) {
    if (!err) {
        console.log('Iteration has completed');
    }
});

// The same code, but using ES6 Promises.
localforage.iterate(function(value, key, iterationNumber) {
    // Resulting key/value pair -- this callback
    // will be executed for every item in the
    // database.
    console.log([key, value]);
}).then(function() {
    console.log('Iteration has completed');
});

// Exit the iteration early:
localforage.iterate(function(value, key, iterationNumber) {
    if (iterationNumber < 3) {
        console.log([key, value]);
    } else {
        return [key, value];
    }
}, function(err, result) {
    if (!err) {
        console.log('Iteration has completed, last iterated pair:');
        console.log(result);
    }
});

// The same code for early exit, but using ES6 Promises.
localforage.iterate(function(value, key, iterationNumber) {
    if (iterationNumber < 3) {
        console.log([key, value]);
    } else {
        return [key, value];
    }
}).then(function(result) {
    console.log('Iteration has completed, last iterated pair:');
    console.log(result);
});
```

```coffeescript
localforage.iterate (value, key, iterationNumber) ->
  # Resulting key/value pair -- this callback
  # will be executed for every item in the
  # database.
  console.log [key, value]
  return
, (err) ->
  unless err
    console.log "Iteration has completed"

# The same code, but using ES6 Promises.
localforage.iterate (value, key, iterationNumber) ->
  # Resulting key/value pair -- this callback
  # will be executed for every item in the
  # database.
  console.log [key, value]
  return
.then ->
  console.log "Iteration has completed"

# Exit the iteration early:
localforage.iterate (value, key, iterationNumber) ->
  if iterationNumber < 3
    console.log [key, value]
    return
  else
    return [key, value]
), (err, result) ->
  unless err
    console.log "Iteration has completed, last iterated pair:"
    console.log result

# The same code for early exit, but using ES6 Promises.
localforage.iterate((value, key, iterationNumber) ->
  if iterationNumber < 3
    console.log [key, value]
    return
  else
    return [key, value]
).then (result) ->
  console.log "Iteration has completed, last iterated pair:"
  console.log result
```

`iterate(iteratorCallback, successCallback)`

Iterate over all value/key pairs in datastore.

`iteratorCallback` is called once for each pair, with the following arguments:

1. value
2. key
3. iterationNumber - one-based number

<aside class="notice">
  <code>iterate</code> supports early exit by returning non `undefined`
  value inside `iteratorCallback` callback. Resulting value will be passed
  to `successCallback` as the result of iteration.

  This means if you're using CoffeeScript, you'll need to manually `return`
  nothing to keep iterating through each key/value pair.
</aside>

# Settings API

These methods allow driver selection and database configuration. These methods
should generally be called before the first _data_ API call to localForage (
i.e. before you call `getItem()` or `length()`, etc.)

## setDriver

```javascript
// Force localStorage to be the backend driver.
localforage.setDriver(localforage.LOCALSTORAGE);

// Supply a list of drivers, in order of preference.
localforage.setDriver([localforage.WEBSQL, localforage.INDEXEDDB]);
```

```coffeescript
# Force localStorage to be the backend driver.
localforage.setDriver localforage.LOCALSTORAGE

# Supply a list of drivers, in order of preference.
localforage.setDriver [localforage.WEBSQL, localforage.INDEXEDDB]
```

`setDriver(driverName)`<br>
`setDriver([driverName, nextDriverName])`

Force usage of a particular driver or drivers, if available.

By default, localForage selects backend drivers for the datastore in this
order:

1. IndexedDB
2. WebSQL
3. localStorage

If you would like to force usage of a particular driver you can use
`setDriver()` with one or more of the following parameters.

* localforage.INDEXEDDB
* localforage.WEBSQL
* localforage.LOCALSTORAGE

<aside class="notice">
  If the backend you're trying to load isn't available on the user's browser,
  localForage will continue to use whatever backend driver it was previously
  using. This means that if you try to force a Gecko browser to use WebSQL,
  it will fail and continue using IndexedDB.
</aside>

## config

```javascript
// This will rename the database from "localforage"
// to "Hipster PDA App".
localforage.config({
    name: 'Hipster PDA App'
});

// This will force localStorage as the storage
// driver even if another is available. You can
// use this instead of `setDriver()`.
localforage.config({
    driver: localforage.LOCALSTORAGE,
    name: 'I-heart-localStorage'
});

// This will use a different driver order.
localforage.config({
    driver: [localforage.WEBSQL,
             localforage.INDEXEDDB,
             localforage.LOCALSTORAGE],
    name: 'WebSQL-Rox'
});
```

```coffeescript
# This will rename the database from "localforage"
# to "Hipster PDA App".
localforage.config
  name: "Hipster PDA App"


# This will force localStorage as the storage
# driver even if another is available. You can
# use this instead of `setDriver()`.
localforage.config
  driver: localforage.LOCALSTORAGE
  name: "I-heart-localStorage"

# This will use a different driver order.
localforage.config
  driver: [localforage.WEBSQL,
           localforage.INDEXEDDB,
           localforage.LOCALSTORAGE]
  name: "WebSQL-Rox"
```

`config(options)`

Set and persist localForage options. This must be called *before* any other
calls to localForage are made, but can be called after localForage is loaded.
If you set any config values with this method they will persist after driver
changes, so you can call `config()` then `setDriver()`. The following config
values can be set:

<dl>
  <dt>driver</dt>
  <dd>
    The preferred driver(s) to use. Same format as what is passed to `setDriver()`, above.<br>
    Default: <code>[localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]</code>
  </dd>
  <dt>name</dt>
  <dd>
    The name of the database. May appear during storage limit prompts.
    Useful to use the name of your app here. In localStorage, this is used as a
    key prefix for all keys stored in localStorage.<br>
    Default: <code>'localforage'</code>
  </dd>
  <dt>size</dt>
  <dd>
    The size of the database in bytes. Used only in WebSQL for now.<br>
    Default: <code>4980736</code>
  </dd>
  <dt>storeName</dt>
  <dd>
    The name of the datastore. In IndexedDB this is the
    <code>dataStore</code>, in WebSQL this is the name of the key/value
    table in the database. <strong>Must be alphanumeric,
    with underscores.</strong> Any non-alphanumeric characters will be converted
    to underscores.<br>
    Default: <code>'keyvaluepairs'</code>
  </dd>
  <dt>version</dt>
  <dd>
    The version of your database. May be used for upgrades in the future;
    currently unused.<br>
    Default: <code>1.0</code>
  </dd>
  <dt>description</dt>
  <dd>
    A description of the database, essentially for developer usage.<br>
    Default: <code>''</code>
  </dd>
</dl>

<aside class="notice">
  Unlike most of the localForage API, the <code>config</code> method is
  synchronous.
</aside>

# Custom Driver API

You can write your own, custom driver for localForage since **version 1.1**.

## defineDriver

```javascript
// Implement the driver here.
var myCustomDriver = {
    _driver: 'customDriverUniqueName',
    _initStorage: function(options) {
        // Custom implementation here...
    },
    clear: function(callback) {
        // Custom implementation here...
    },
    getItem: function(key, callback) {
        // Custom implementation here...
    },
    key: function(n, callback) {
        // Custom implementation here...
    },
    keys: function(callback) {
        // Custom implementation here...
    },
    length: function(callback) {
        // Custom implementation here...
    },
    removeItem: function(key, callback) {
        // Custom implementation here...
    },
    setItem: function(key, value, callback) {
        // Custom implementation here...
    }
}

// Add the driver to localForage.
localforage.defineDriver(myCustomDriver);
```

```coffeescript
# Implement the driver here.
myCustomDriver =
  _driver: 'customDriverUniqueName'
  _initStorage: (options) ->
    # Custom implementation here...
  clear: (callback) ->
    # Custom implementation here...
  getItem: (key, callback) ->
    # Custom implementation here...
  key: (n, callback) ->
    # Custom implementation here...
  keys: (callback) ->
    # Custom implementation here...
  length: (callback) ->
    # Custom implementation here...
  removeItem: (key, callback) ->
    # Custom implementation here...
  setItem: (key, value, callback) ->
    # Custom implementation here...

# Add the driver to localForage.
localforage.defineDriver(myCustomDriver)
```

You'll want to make sure you accept a `callback` argument and that you pass
the same arguments to callbacks as the default drivers do. You'll also want to
resolve or reject promises. Check any of the [default drivers][] for an idea
of how to implement your own, custom driver.

The custom implementation may contain a `_support` property that is either
boolean (`true`/`false`) or returns a `Promise` that resolves to a boolean
value. If `_support` is omitted, then `true` is the default value. You can
use this to make sure the browser in use supports your custom driver.

<aside class="notice">
  These drivers are available to every instance of localForage on the page,
  regardless of which instance you use to add the implementation.
</aside>

[default drivers]: https://github.com/mozilla/localForage/tree/master/src/drivers
