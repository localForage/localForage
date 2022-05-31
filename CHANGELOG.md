# About this CHANGELOG

This file will include all API breakage, new features, and upgrade info in
localForage's lifetime.

### [1.10.0](https://github.com/localForage/localForage/releases/tag/1.10.0)

* Avoid uncaught error in `dropInstance`. You can now catch errors thrown by `dropInstance`, see #807.

### [1.9.0](https://github.com/mozilla/localForage/releases/tag/1.9.0)

* Fixed TypeScript definition for `getItem`. It now notes that `getItem` can return `null`, so this change may cause TypeScript code that didn't account for `null` values to fail. See #980.

### [1.8.1](https://github.com/mozilla/localForage/releases/tag/1.8.1)

* Reverted the ESM/`module` field change in #940, which broke many builds. See: #979. Sorry about that! 😓

### [1.8.0](https://github.com/mozilla/localForage/releases/tag/1.8.0)

* No changes to code, but added a `module` field in `package.json` for better ESM support. See: #940.

### [1.7.4](https://github.com/mozilla/localForage/releases/tag/1.7.4)

* Use `openKeyCursor` instead of `openCursor` for `key()` retrieval. Props to @MeMark2 for the fix, and thanks to @lincolnthree and @f for additional testing!

### [1.7.3](https://github.com/mozilla/localForage/releases/tag/1.7.3)

* Add `.npmignore` file to reduce package size when installed via npm.

### [1.6](https://github.com/mozilla/localForage/releases/tag/1.6.0)

* Add `dropInstance()` method to localforage.
* Improve IDB driver reliability when a connection gets closed.

### [1.5.7]

* Fix IE8 localStorage support detection.

### [1.5.6]

* Upgrade lie to 3.1.1 to work with yarn.

### [1.5.5]

* Roll back dropInstance breaking change.

### [1.5.4]

* Set `null` as `undefined` (for Edge).

### [1.5.3]

* Check whether localStorage is actually usable.

### [1.5.2]

* Prevent some unnecessary logs when calling `createInstance()`.

### [1.5.1]

* Try to re-establish IDB connection after an InvalidStateError.
* Added Generics to `iterate()` TS Typings.
* Define custom drivers syncronously when `_support` isn't a function.
* Use the custom driver API for internal drivers, which makes possible to override parts of their implementation.

### [1.5](https://github.com/mozilla/localForage/releases/tag/1.5.0)
* **Major storage engine change for Safari**: We now use IndexedDB as the storage engine for Safari v10.1 (and above). This means that **pre-existing Safari** `>= 10.1` users will experience "data loss" **after upgrading your site from a previous version of localForage to v1.5**. In fact no data is lost but the engine will change so localForage will seem empty.
  * You can use the [localForage 1.4 compatibility plugin](https://github.com/localForage/localForage-compatibility-1-4) after the upgrade so that all your Safari users (both old & new) continue to use the WebSQL driver.
  * Alternativelly you can force a connection to WebSQL using [localForage's config](https://localforage.github.io/localForage/#settings-api-setdriver) to either keep using your existing WebSQL database or migrate to IndexedDB.

### [1.4.2](https://github.com/mozilla/localForage/releases/tag/1.4.2)
* Fixes #562.

### [1.4.1](https://github.com/mozilla/localForage/releases/tag/1.4.1)
* Fixes #520; browserify builds work properly

### [1.4](https://github.com/mozilla/localForage/releases/tag/1.4.0)
* Fixes #516; this version should always load the correct driver without that bug.

### [1.3](https://github.com/mozilla/localForage/releases/tag/1.3.0)
* We now use ES6 for our source code and `webpack` to bundle the `dist/` files.

### [1.2](https://github.com/mozilla/localForage/releases/tag/1.2.0)
* Iterate through the entire database using `iterate()`. ([#283](https://github.com/mozilla/localForage/pull/283); fixes [#186](https://github.com/mozilla/localForage/pull/186))

### [1.1](https://github.com/mozilla/localForage/releases/tag/1.1.0)
* Custom drivers can be created using `defineDriver()`. ([#282](https://github.com/mozilla/localForage/pull/282); fixes [#267](https://github.com/mozilla/localForage/pull/267))

### [1.0.3](https://github.com/mozilla/localForage/releases/tag/1.0.3)
* `config()` accepts a new option: `driver`, so users can set the driver during config rather than using `setDriver()`. ([#273](https://github.com/mozilla/localForage/pull/273); fixes [#168](https://github.com/mozilla/localForage/pull/168))

### [1.0](https://github.com/mozilla/localForage/releases/tag/1.0.0)

* It is no longer necessary to queue commands using `ready()` when using RequireJS. ([723cc94e06](https://github.com/mozilla/localForage/commit/723cc94e06af4f5ba4c53fa65524ccd5f6c4432e))
* `setDriver` now accepts an array of drivers to be used, in order of preference, instead of simply a string. The string option is still supported. (eg. now one can use `setDriver(['WebSQL', 'localStorage'])` instead of `setDriver('WebSQL')`)
* node-style, error-first argument method signatures are used for callbacks. Promises don't use error-first method signatures; instead they supply an error to the promise's `reject()` function.

### [0.9](https://github.com/mozilla/localForage/releases/tag/0.9.1)

This release drops support for some legacy browsers, though not actually the
ones you might think. localForage's new policy is to support the current
version of all major browsers plus up to three versions back.

* Add built versions without the Promises polyfill to `dist/` directory. ([#172](https://github.com/mozilla/localForage/pull/172))
* **Drop support for Firefox 3.5. Minimum version is now Firefox 25.** (Technically, Firefox 4+ seems to work.)
* **Drop support for Chrome 31 and below. Minimum version is now Chrome 32.**
* Fix a **lot** of bugs. Especially in Internet Exploder.
* Switch to Mocha tests and test on [Sauce Labs](https://saucelabs.com/).
* Add a `keys()` method. ([#180](https://github.com/mozilla/localForage/pull/180))
* Check for localStorage instead of assuming it's available. ([#183](https://github.com/mozilla/localForage/pull/183))

### [Version 0.8](https://github.com/mozilla/localForage/releases/tag/0.8.1)

* Add support for web workers. ([#144](https://github.com/mozilla/localForage/pull/144), [#147](https://github.com/mozilla/localForage/pull/147)).

### [Version 0.6.1](https://github.com/mozilla/localForage/releases/tag/0.6.1)

* Put built versions back in `dist/` directory.

### [Version 0.6.0](https://github.com/mozilla/localForage/releases/tag/0.6.0)

* Add `localforage.config`. ([#40](https://github.com/mozilla/localForage/pull/140))
* Fix iFrame bug in WebKit. ([#78](https://github.com/mozilla/localForage/issues/78))
* Improve error handling. ([#60](https://github.com/mozilla/localForage/issues/60))
* Remove support for `window.localForageConfig`. ([#135](https://github.com/mozilla/localForage/issues/135))

### [Version 0.4](https://github.com/mozilla/localForage/releases/tag/0.4.0)

* Built versions of localForage are now in the top-level directory. ([2d11c90](https://github.com/mozilla/localForage/commit/2d11c90))

### [Version 0.3](https://github.com/mozilla/localForage/releases/tag/0.3.0)

* Check code quality in test suite ([#124](https://github.com/mozilla/localForage/pull/124))
* `_initDriver()` is called after first public API call ([#119](https://github.com/mozilla/localForage/pull/119))

### [Version 0.2.1](https://github.com/mozilla/localForage/releases/tag/0.2.1)

* Allow configuration of WebSQL DB size ([commit](https://github.com/mozilla/localForage/commit/6e78fff51a23e729206a03e5b750e959d8610f8c))
* Use bower for JS dependencies instead of `vendor/` folder ([#109](https://github.com/mozilla/localForage/pull/109))

### [Version 0.2.0](https://github.com/mozilla/localForage/releases/tag/0.2.0)

* Add support for ArrayBuffer, Blob, and TypedArrays ([#54](https://github.com/mozilla/localForage/pull/54), [#73](https://github.com/mozilla/localForage/pull/73))

### [Version 0.1.1](https://github.com/mozilla/localForage/releases/tag/0.1.1)

* Added config options to allow users to set their own database names, etc. ([#100](https://github.com/mozilla/localForage/pull/100))

---

### March 16th, 2014

* Moved Backbone adapter to its own repository ([b7987b3091855379d4908376b668b4b51a6fedfe](https://github.com/mozilla/localForage/commit/b7987b3091855379d4908376b668b4b51a6fedfe))

### March 13th, 2014

* Changed `localforage.driver` to a function instead of the string directly ([49415145021b0029d2521182de6e338e048fe5b1](https://github.com/mozilla/localForage/commit/49415145021b0029d2521182de6e338e048fe5b1))

### March 4th, 2014

* Changed the IndexedDB database name from `asyncStorage` to `localforage` ([f4e0156a29969a79005ac27b303d7e321a720fc6](https://github.com/mozilla/localForage/commit/f4e0156a29969a79005ac27b303d7e321a720fc6))
