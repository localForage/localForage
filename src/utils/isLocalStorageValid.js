function isLocalStorageValid() {
    try {
        return typeof localStorage !== 'undefined' &&
            ('setItem' in localStorage) &&
            typeof localStorage.setItem === 'function';
    } catch (e) {
        return false;
    }
}

export default isLocalStorageValid;
