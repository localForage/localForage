function isLocalStorageValid() {
    try {
        return (
            typeof localStorage !== 'undefined' &&
            'setItem' in localStorage &&
            // in IE8 typeof localStorage.setItem === 'object'
            !!localStorage.setItem
        );
    } catch (e) {
        return false;
    }
}

export default isLocalStorageValid;
