import localforage from '../dist/localforage';

var DRIVERS = [
  localforage.INDEXEDDB,
  localforage.LOCALSTORAGE,
  localforage.WEBSQL
];

DRIVERS.forEach(function(driverName) {
  if ((!localforage.supports(localforage.INDEXEDDB) &&
     driverName === localforage.INDEXEDDB) ||
    (!localforage.supports(localforage.LOCALSTORAGE) &&
     driverName === localforage.LOCALSTORAGE) ||
    (!localforage.supports(localforage.WEBSQL) &&
     driverName === localforage.WEBSQL)) {
    // Browser doesn't support this storage library, so we exit the API
    // tests.
    return;
  }

  describe(`Web Worker support in ${driverName}`, function() {
    'use strict';

    before(() => {
      return localforage.setDriver(driverName);

      // var bb = new BlobBuilder();
      // bb.append(`
      //   importScripts("/dist/localforage.js");
      //
      //   self.addEventListener('message', function(e) {
      //     function handleError(e) {
      //       self.postMessage({
      //         error: JSON.stringify(e),
      //         body: e,
      //         fail: true
      //       });
      //     }
      //
      //     localforage.setDriver(e.data.driver, function() {
      //       localforage.setItem('web worker', e.data.value, function() {
      //         localforage.getItem('web worker', function(err, value) {
      //           self.postMessage({
      //             body: value
      //           });
      //         });
      //       }, handleError).catch(handleError);
      //     }, handleError);
      //   }, false);
      // `);
      //
      // var workerURL = window.URL.createObjectURL(bb.getBlob());
      // var worker = new Worker(workerURL);
      // worker.onmessage = onmessage;
      // return workerURL;
    });

    beforeEach(() => {
      return localforage.clear();
    });

    if (!window.Worker) {
      it.skip("doesn't have web worker support");
      return;
    }

    if (driverName === localforage.LOCALSTORAGE ||
        driverName === localforage.WEBSQL) {
      it.skip(`${driverName} is not supported in web workers`);
      return;
    }

    it('saves data', function(done) {
      var webWorker = new Worker('/base/tests/webworker.js');

      webWorker.addEventListener('message', function(e) {
        var body = e.data.body;

        window.console.log(body);
        assert.equal(body, 'I have been set');
        done();
      });

      webWorker.addEventListener('error', function(e) {
        window.console.log(e);
      });

      webWorker.postMessage({
        driver: driverName,
        value: 'I have been set'
      });
    });
  });
});
