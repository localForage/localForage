# About this CHANGELOG

This file will include all API breakage, new features, and upgrade info in
localForage's lifetime.

### [Version 0.2.1](https://github.com/mozilla/localForage/releases/tag/0.2.1)

* Allow configuration of WebSQL DB size

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
