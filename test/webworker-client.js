/*globals importScripts:true, self:true */
importScripts("/dist/localforage.js");

self.addEventListener('message', function(e) {
    function handleError(e) {
        self.postMessage({
            error: JSON.stringify(e),
            body: e,
            fail: true
        });
    }

    localforage.setDriver(e.data.driver, function() {
        localforage.setItem('web worker', e.data.value, function() {
            localforage.getItem('web worker', function(err, value) {
                self.postMessage({
                    body: value
                });
            });
        }, handleError).catch(handleError);
    }, handleError);
}, false);
