import idb from './idb';

function getSafariUserAgentVersion(userAgent) {
    try {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
        const match = /Version\/([0-9._]+)/.exec(userAgent);
        let versionParts = match && match[1].split(/[._]/).slice(0, 2);
        if (!versionParts || !versionParts.length) {
            return;
        }

        const version = Number(versionParts.join('.'));
        return version;
    } catch (e) {
        return;
    }
}

// export for testing, will not end up exported in the dist files
export function isBuggySafariVersion(userAgent) {
    const version = getSafariUserAgentVersion(userAgent);
    // if newer versions of Safari start using
    // a different Version pattern,
    // then consider them as non-buggy
    if (!version) {
        return false;
    }

    // Safari <10.1 does not meet our requirements for IDB support
    // https://github.com/pouchdb/pouchdb/issues/5572
    return version < 10.1;
}

function hasBuggyIndexedDBImplementation() {
    // some outdated implementations of IDB that appear on Samsung
    // and HTC Android devices <4.4 are missing IDBKeyRange
    // See: https://github.com/mozilla/localForage/issues/128
    // See: https://github.com/mozilla/localForage/issues/272
    if (typeof IDBKeyRange === 'undefined') {
        return true;
    }

    const { userAgent, platform } = navigator;
    // We mimic PouchDB here;
    //
    // We test for openDatabase because IE Mobile identifies itself
    // as Safari. Oh the lulz...
    const isSafari =
        typeof openDatabase !== 'undefined' &&
        /(Safari|iPhone|iPad|iPod)/.test(userAgent) &&
        !/Chrome/.test(userAgent) &&
        !/BlackBerry/.test(platform);

    return isSafari && isBuggySafariVersion(userAgent);
}

function isIndexedDBValid() {
    try {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        if (!idb) {
            return false;
        }

        return (
            typeof indexedDB !== 'undefined' &&
            !hasBuggyIndexedDBImplementation()
        );
    } catch (e) {
        return false;
    }
}

export default isIndexedDBValid;
