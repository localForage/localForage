import localforage from '../dist/localforage';

var unexpectedSuccess = () => {
  assert.fail(null, null, 'Unexpected success');
};

describe('Driver API', () => {
  'use strict';

  beforeEach(() => {
    if (localforage.supports(localforage.INDEXEDDB)) {
      return localforage.setDriver(localforage.INDEXEDDB);
    } else if (localforage.supports(localforage.WEBSQL)) {
      return localforage.setDriver(localforage.WEBSQL);
    }
    return localforage.setDriver(localforage.LOCALSTORAGE);
  });

  if ((localforage.supports(localforage.INDEXEDDB) &&
     localforage.driver() === localforage.INDEXEDDB) ||
    (localforage.supports(localforage.WEBSQL) &&
     localforage.driver() === localforage.WEBSQL)) {
    it(`can change to localStorage from #{localforage.driver()} [callback]`,
    (done) => {
      var previousDriver = localforage.driver();

      localforage.setDriver(localforage.LOCALSTORAGE, () => {
        assert.equal(localforage.driver(), localforage.LOCALSTORAGE);
        assert.notEqual(localforage.driver(), previousDriver);
        done();
      });
    });

    it(`can change to localStorage from #{localforage.driver()} [promise]`,
    () => {
      var previousDriver = localforage.driver();

      return localforage.setDriver(localforage.LOCALSTORAGE)
        .then(() => {
          assert.equal(localforage.driver(), localforage.LOCALSTORAGE);
          assert.notEqual(localforage.driver(), previousDriver);
        });
    });
  }

  if (!localforage.supports(localforage.INDEXEDDB)) {
    it("can't use unsupported IndexedDB [callback]", (done) => {
      var previousDriver = localforage.driver();
      assert.notEqual(previousDriver, localforage.INDEXEDDB);

      // These should be rejected in component builds but aren't.
      // TODO: Look into why.
      localforage.setDriver(localforage.INDEXEDDB, null, () => {
        assert.equal(localforage.driver(), previousDriver);
        done();
      });
    });

    it("can't use unsupported IndexedDB [promise]", () => {
      var previousDriver = localforage.driver();
      assert.notEqual(previousDriver, localforage.INDEXEDDB);

      localforage.setDriver(localforage.INDEXEDDB);
      return localforage.ready()
        .then(unexpectedSuccess)
        .catch(() => {
          assert.equal(localforage.driver(), previousDriver);
        });
    });
  } else {
    it('can set already active IndexedDB [callback]', (done) => {
      var previousDriver = localforage.driver();
      assert.equal(previousDriver, localforage.INDEXEDDB);

      localforage.setDriver(localforage.INDEXEDDB, () => {
        assert.equal(localforage.driver(), previousDriver);
        done();
      });
    });

    it('can set already active IndexedDB [promise]', () => {
      var previousDriver = localforage.driver();
      assert.equal(previousDriver, localforage.INDEXEDDB);

      return localforage.setDriver(localforage.INDEXEDDB)
        .then(() => {
          assert.equal(localforage.driver(), previousDriver);
        });
    });
  }

  if (!localforage.supports(localforage.LOCALSTORAGE)) {
    it("can't use unsupported localStorage [callback]", (done) => {
      var previousDriver = localforage.driver();
      assert.notEqual(previousDriver, localforage.LOCALSTORAGE);

      localforage.setDriver(localforage.LOCALSTORAGE);
      localforage.ready(() => {
        assert.equal(localforage.driver(), previousDriver);
        done();
      });
    });

    // it("can't use unsupported localStorage [promise]", () => {
    //   var previousDriver = localforage.driver();
    //   assert.notEqual(previousDriver, localforage.LOCALSTORAGE);
    //
    //   localforage.setDriver(localforage.LOCALSTORAGE);
    //   return localforage.ready()
    //     .then(unexpectedSuccess)
    //     .catch(() => {
    //       assert.equal(localforage.driver(), previousDriver);
    //     });
    // });
  } else if (!localforage.supports(localforage.INDEXEDDB) &&
         !localforage.supports(localforage.WEBSQL)) {
    it('can set already active localStorage [callback]', (done) => {
      var previousDriver = localforage.driver();
      assert.equal(previousDriver, localforage.LOCALSTORAGE);

      localforage.setDriver(localforage.LOCALSTORAGE, () => {
        assert.equal(localforage.driver(), previousDriver);
        done();
      });
    });

    it('can set already active localStorage [promise]', (done) => {
      var previousDriver = localforage.driver();
      assert.equal(previousDriver, localforage.LOCALSTORAGE);

      return localforage.setDriver(localforage.LOCALSTORAGE)
        .then(() => {
          assert.equal(localforage.driver(), previousDriver);
        });
    });
  }

  if (!localforage.supports(localforage.WEBSQL)) {
    it("can't use unsupported WebSQL [callback]", (done) => {
      var previousDriver = localforage.driver();
      assert.notEqual(previousDriver, localforage.WEBSQL);

      localforage.setDriver(localforage.WEBSQL, null, () => {
        assert.equal(localforage.driver(), previousDriver);
        done();
      });
    });

    it("can't use unsupported WebSQL [promise]", () => {
      var previousDriver = localforage.driver();
      assert.notEqual(previousDriver, localforage.WEBSQL);

      return localforage.setDriver(localforage.WEBSQL)
        .then(unexpectedSuccess)
        .catch(() => {
          assert.equal(localforage.driver(), previousDriver);
        });
    });
  } else {
    it('can set already active WebSQL [callback]', (done) => {
      localforage.setDriver(localforage.WEBSQL, () => {
        var previousDriver = localforage.driver();
        assert.equal(previousDriver, localforage.WEBSQL);

        localforage.setDriver(localforage.WEBSQL, () => {
          assert.equal(localforage.driver(), previousDriver);
          done();
        });
      });
    });

    it('can set already active WebSQL [promise]', () => {
      localforage.setDriver(localforage.WEBSQL).then(() => {
        var previousDriver = localforage.driver();
        assert.equal(previousDriver, localforage.WEBSQL);

        localforage.setDriver(localforage.WEBSQL)
          .then(() => {
            assert.equal(localforage.driver(), previousDriver);
          });
      });
    });
  }
});
