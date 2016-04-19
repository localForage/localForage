
/*!
    Node.js support by emulation of browser environment (emulated DOMStorage).

    DOMStorage emulation from 'dom-storage', which strives to be:
        'An inefficient, but as W3C-compliant as possible using only pure
            JavaScript, DOMStorage implementation.'
*/
// We depend on the dom-storage library
var domStorage = require('dom-storage');
// We utilize the './.db.json' file for persistency. 
var localStorageEmulation = new domStorage('./.db.json', { strict: false, ws: '  ' });
// Save the local storage implementation to the 'self' object
self = {};
self.localStorage = localStorageEmulation;

