function getIDB() {
    /* global indexedDB,webkitIndexedDB,mozIndexedDB,OIndexedDB,msIndexedDB */
    if (typeof indexedDB !== 'undefined') {
        return indexedDB;
    }
    if (typeof webkitIndexedDB !== 'undefined') {
        return webkitIndexedDB;
    }
    if (typeof mozIndexedDB !== 'undefined') {
        return mozIndexedDB;
    }
    if (typeof OIndexedDB !== 'undefined') {
        return OIndexedDB;
    }
    if (typeof msIndexedDB !== 'undefined') {
        return msIndexedDB;
    }
}

var idb = getIDB();
export default idb;
