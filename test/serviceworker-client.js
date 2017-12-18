/*globals importScripts:true, self:true */
importScripts('/dist/localforage.js');

self.onmessage = function(messageEvent) {
    return localforage
        .setDriver(messageEvent.data.driver)
        .then(function() {
            return localforage.setItem(
                'service worker',
                messageEvent.data.value
            );
        })
        .then(function() {
            return localforage.getItem('service worker');
        })
        .then(function(value) {
            messageEvent.ports[0].postMessage({
                body: value + ' using ' + localforage.driver()
            });
        })
        .catch(function(error) {
            messageEvent.ports[0].postMessage({
                error: JSON.stringify(error),
                body: error,
                fail: true
            });
        });
};

self.oninstall = function(event) {
    event.waitUntil(
        localforage
            .setItem('service worker registration', 'serviceworker present')
            .then(function(value) {
                console.log(value);
            })
    );
};
