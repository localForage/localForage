# About this CHANGELOG

This file will include all API breakage, new features, and upgrade info in
localForage's lifetime.

### Next Version

* `setDriver` now accepts an array of drivers to be used, in order of preference, instead of simply a string. The string option is still supported. (eg. now one can use `setDriver(['WebSQL', 'localStorage'])` instead of `setDriver('WebSQL')`)

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
