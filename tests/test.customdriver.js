import localforage from '../dist/localforage';
import dummyStorageDriver from './dummy-storage';

var unexpectedSuccess = () => {
  assert.fail(null, null, 'Unexpected success');
};

describe('When Custom Drivers are used', () => {
  var errorMessage = 'Custom driver not compliant; see ' +
                     'https://mozilla.github.io/localForage/#definedriver';
  var nameErrorMessage = (driverName) => {
    return 'Custom driver name already in use: ' + driverName;
  };

  it('fails to define a no-name custom driver', (done) => {
    localforage.defineDriver({
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: () => {},
      key: () => {},
      keys: () => {}
    }, null, (err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, errorMessage);
      done();
    });
  });

  it('fails to define a no-name custom driver [promise]', () => {
    return localforage.defineDriver({
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: () => {},
      key: () => {},
      keys: () => {}
    })
    .then(unexpectedSuccess)
    .catch((err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, errorMessage);
    });
  });

  it('fails to define a driver with an overlapping name', (done) => {
    localforage.defineDriver({
      _driver: localforage.INDEXEDDB,
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: () => {},
      key: () => {},
      keys: () => {}
    }, unexpectedSuccess, (err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, nameErrorMessage(localforage.INDEXEDDB));
      done();
    });
  });

  it('fails to define a driver with an overlapping name [promise]', () => {
    return localforage.defineDriver({
      _driver: localforage.INDEXEDDB,
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: () => {},
      key: () => {},
      keys: () => {}
    })
    .then(unexpectedSuccess)
    .catch((err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, nameErrorMessage(localforage.INDEXEDDB));
    });
  });

  it('fails to define a custom driver with missing methods', (done) => {
    localforage.defineDriver({
      _driver: 'missingMethodsDriver',
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }, null, (err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, errorMessage);
      done();
    });
  });

  it('fails to define a custom driver with missing methods [promise]', () => {
    localforage.defineDriver({
      _driver: 'missingMethodsDriver',
      _initStorage: () => {},
      iterate: () => {},
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    })
    .then(unexpectedSuccess)
    .catch((err) => {
      assert.typeOf(err, 'Error');
      assert.equal(err.message, errorMessage);
    });
  });

  it('defines a compliant custom driver', function(done) {
    this.timeout(5000);

    localforage.defineDriver(dummyStorageDriver, done);
  });

  it('defines a compliant custom driver [promise]', () => {
    return localforage.defineDriver(dummyStorageDriver)
      .then(() => {
        assert.ok(true);
      });
  });

  it('sets a custom driver', (done) => {
    localforage.defineDriver(dummyStorageDriver, () => {
      localforage.setDriver(dummyStorageDriver._driver, () => {
        assert.equal(localforage.driver(), dummyStorageDriver._driver);
        done();
      });
    });
  });

  it('sets a custom driver [promise]', () => {
    return localforage.defineDriver(dummyStorageDriver)
      .then(() => {
        return localforage.setDriver(dummyStorageDriver._driver);
      }).then(() => {
        assert.equal(localforage.driver(), dummyStorageDriver._driver);
      });
  });

  it('sets and uses a custom driver', (done) => {
    localforage.defineDriver(dummyStorageDriver, () => {
      localforage.setDriver(dummyStorageDriver._driver, (err) => {
        assert.equal(err, undefined);
        localforage.setItem('testCallbackKey', 'testCallbackValue', (err) => {
          assert.isNull(err);
          localforage.getItem('testCallbackKey', (err, value) => {
            assert.isNull(err);
            assert.equal(value, 'testCallbackValue');
            done();
          });
        });
      });
    });
  });

  it('sets and uses a custom driver [promise]', () => {
    return localforage.defineDriver(dummyStorageDriver)
      .then(() => {
        return localforage.setDriver(dummyStorageDriver._driver);
      }).then(() => {
        return localforage.setItem('testPromiseKey', 'testPromiseValue');
      }).then(() => {
        return localforage.getItem('testPromiseKey');
      }).then((value) => {
        assert.equal(value, 'testPromiseValue');
      });
  });
});
