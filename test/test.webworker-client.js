importScripts("../dist/localforage.js");

self.addEventListener('message', function(e) {
    var data = e.data;

    function handleError(e) {
        data.value = e.message;
        self.postMessage({
            error: JSON.stringify(e),
            body: data,
            fail: true
        });
    }

    localforage.setDriver(data.driver)
        .then(function () {
            data.value += ' with ' + localforage.driver();
            return localforage.setItem(data.key, data);
        }, handleError)
        .then(function () {
            return localforage.getItem(data.key);
        }, handleError)
        .then(function (data) {
            self.postMessage({
                body: data
            });
        }, handleError)
        .catch(handleError);
}, false);
