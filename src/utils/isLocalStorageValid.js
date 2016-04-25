function isLocalStorageValid() {
    try {
        return typeof localStorage !== 'undefined' &&
            ('setItem' in localStorage) &&
            localStorage.setItem;
    } catch (e) {
        return false;
    }
}

export default isLocalStorageValid;
