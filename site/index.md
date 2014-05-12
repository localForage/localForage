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

localForage supports both a callback-based and Promises-based API, so you can
use whichever you prefer. At the current time, these docs use the callback API.

[Download localforage.min.js](http://mozilla.github.io/localForage/localforage.min.js)

# Installation

``` bash
# Optional installation with bower:
bower install localforage
```
``` html
<script src="localforage.js"></script>
<script>localforage.getItem('my alert').then(alert);</script>
```

To use localForage, [download the latest release](https://github.com/mozilla/localForage/releases) or install with [bower](http://bower.io/) (`bower install localforage`).

Then simply include the JS file and start using localForage:
`<script src="localforage.js"></script>`. You don't need to run any init method
or wait for any `onready` events.

# Data API

These APIs deal with getting and setting data in the offline store.

## getItem

```javascript
localforage.getItem('somekey', function(value) {
    // Run this code once the value has been
    // loaded from the offline store.
    console.log(value);
});
```

```coffeescript
localforage.getItem "somekey", (value) ->
  # Run this code once the value has been loaded
  # from the offline store.
  console.log value
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
localforage.setItem('somekey', 'some value', function(value) {
    // Do other things once the value has been saved.
    console.log(value);
});

// Unlike localStorage, you can store non-strings.
localforage.setItem('my array', [1, 2, 'three'], function(value) {
    // This will output `1`.
    console.log(value[0]);
});

// You can even store binary data from an AJAX request.
request = new XMLHttpRequest();
request.open('GET', '/photo.jpg', true);
request.responseType = 'arraybuffer';

request.addEventListener('readystatechange', function() {
    if (request.readyState === 4) { // readyState DONE
        localforage.setItem('photo', request.response, function(img) {
            // This will be a valid blob URI for an <img> tag.
            var blob = new Blob([image]);
            var imageURI = window.URL.createObjectURL(blob);
        }
    }
});
```

```coffeescript
localforage.getItem "somekey", "some value" (value) ->
  # Do other things once the value has been saved.
  console.log value

# Unlike localStorage, you can store non-strings.
localforage.setItem "my array", [1, 2, "three"], (value) ->
  # This will output `1`.
  console.log value[0]

# You can even store binary data from an AJAX request.
request = new XMLHttpRequest()
request.open "GET", "photo.jpg", true
request.responseType = "arraybuffer"

request.addEventListener "readystatechange", ->
  if request.readyState == 4 # readyState DONE
    localforage.setItem "photo", request.response, (img) ->
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

## removeItem

```javascript
localforage.removeItem('somekey', function() {
    // Run this code once the key has been removed.
    console.log('Key is cleared!');
});
```

```coffeescript
localforage.removeItem "somekey", ->
  # Run this code once the key has been removed.
  console.log "Key is cleared!"
```

`removeItem(key, successCallback)`

Removes the value of a key from the offline store.

## clear

```javascript
localforage.clear(function() {
    // Run this code once the database has been entirely deleted.
    console.log('Database is now empty.');
});
```

```coffeescript
localforage.clear ->
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
localforage.length(function(numberOfKeys) {
    // Outputs the length of the database.
    console.log(numberOfKeys);
});
```

```coffeescript
localforage.length (numberOfKeys) ->
  # Outputs the length of the database.
  console.log numberOfKeys
```

`length(successCallback)`

Gets the number of keys in the offline store (i.e. its "length").

## key

```javascript
localforage.key(2, function(keyName) {
    // Name of the key.
    console.log(keyName);
});
```

```coffeescript
localforage.key 2, (keyName) ->
  # Name of the key.
  console.log keyName
```

`key(keyIndex, successCallback)`

Get the name of a key based on its ID.

<aside class="notice">
  This method is inherited from the localStorage API, but is acknowledged to
  be kinda weird.
</aside>

# Settings API

These methods allow driver selection and database configuration. These methods
should generally be called before the first _data_ API call to localForage (
i.e. before you call `getItem()` or `length()`, etc.)

## setDriver

```javascript
// Force localStorage to be the backend driver.
localforage.setDriver('localStorageWrapper');
```

```coffeescript
# Force localStorage to be the backend driver.
localforage.setDriver "localStorageWrapper"
```

`setDriver(driverName)`

Force usage of a particular driver, if it is available.

By default, localForage selects backend drivers for the datastore in this
order:

1. IndexedDB
2. WebSQL
3. localStorage

If you would like to force usage of a particular driver you can use
`setDriver()`.

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
```

```coffeescript
# This will rename the database from "localforage"
# to "Hipster PDA App".
localforage.config
  name: "Hipster PDA App"
```

`config(options)`

Set and persist localForage options. This must be called *before* any other
calls to localForage are made, but can be called after localForage is loaded.
If you set any config values with this method they will persist after driver
changes, so you can call `config()` then `setDriver()`. The following config
values can be set:

<dl>
  <dt>name</dt>
  <dd>
    The name of the database. May appear during storage limit prompts.
    Useful to use the name of your app here.<br>
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
    table in the database. In localStorage, this is used as a key prefix for
    all keys stored in localStorage.<br>
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
