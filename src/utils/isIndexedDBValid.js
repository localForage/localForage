import idb from './idb';

function isIndexedDBValid() {
    try {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        if (!idb) {
            return false;
        }
        // We mimic PouchDB here; just UA test for Safari (which, as of
        // iOS 8/Yosemite, doesn't properly support IndexedDB).
        // IndexedDB support is broken and different from Blink's.
        // This is faster than the test case (and it's sync), so we just
        // do this. *SIGH*
        // http://bl.ocks.org/nolanlawson/raw/c83e9039edf2278047e9/
        //
        // We test for openDatabase because IE Mobile identifies itself
        // as Safari. Oh the lulz...
        if (typeof openDatabase !== 'undefined' && typeof navigator !== 'undefined' &&
            navigator.userAgent &&
            /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            return false;
        }

        return idb &&
            typeof idb.open === 'function' &&
                // Some Samsung/HTC Android 4.0-4.3 devices
                // have older IndexedDB specs; if this isn't available
                // their IndexedDB is too old for us to use.
                // (Replaces the onupgradeneeded test.)
            typeof IDBKeyRange !== 'undefined';
    } catch (e) {
        return false;
    }
}

export default isIndexedDBValid;
