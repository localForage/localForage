import localforage from 'localforage';

const unexpectedSuccess = () => {
  assert.fail(null, null, 'Unexpected success');
};

const DRIVERS = [localforage.INDEXEDDB, localforage.LOCALSTORAGE, localforage.WEBSQL];

const driverApiMethods = ['getItem', 'setItem', 'clear', 'length', 'removeItem', 'key', 'keys'];

describe('localForage', () => {
  let appropriateDriver =
    (localforage.supports(localforage.INDEXEDDB) && localforage.INDEXEDDB) ||
    (localforage.supports(localforage.WEBSQL) && localforage.WEBSQL) ||
    (localforage.supports(localforage.LOCALSTORAGE) && localforage.LOCALSTORAGE);

  it(`automatically selects the most appropriate driver (${appropriateDriver})`, () => {
    return localforage
      .ready()
      .then(() => {
        assert.equal(localforage.driver(), appropriateDriver);
      })
      .catch((error) => {
        assert.typeOf(error, 'Error');
        assert.equal(error.message, 'No available storage method found.');
        assert.isNull(localforage.driver());
      });
  });

  it('errors when a requested driver is not found [promise]', async () => {
    try {
      await localforage.getDriver('UnknownDriver');
    } catch (error) {
      assert.typeOf(error, 'Error');
      assert.equal(error.message, 'Driver not found.');
    }
  });

  it('retrieves the serializer [promise]', async () => {
    const serializer = await localforage.getSerializer();

    assert.typeOf(serializer, 'object');
  });

  it('does not support object parameter to setDriver', async () => {
    const driverPreferedOrder = {
      '0': localforage.INDEXEDDB,
      '1': localforage.WEBSQL,
      '2': localforage.LOCALSTORAGE,
      length: 3,
    };

    try {
      await localforage.setDriver(driverPreferedOrder);
    } catch (error) {
      assert.typeOf(error, 'Error');
      assert.equal(error.message, 'No available storage method found.');
    }
  });

  it('skips drivers that fail to initilize', () => {
    const failingStorageDriver = (() => {
      function driverDummyMethod() {
        return Promise.reject(new Error('Driver Method Failed.'));
      }

      return {
        _driver: 'failingStorageDriver',
        _initStorage: function _initStorage() {
          return Promise.reject(new Error('Driver Failed to Initialize.'));
        },
        iterate: driverDummyMethod,
        getItem: driverDummyMethod,
        setItem: driverDummyMethod,
        removeItem: driverDummyMethod,
        clear: driverDummyMethod,
        length: driverDummyMethod,
        key: driverDummyMethod,
        keys: driverDummyMethod,
      };
    })();

    const driverPreferedOrder = [
      failingStorageDriver._driver,
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE,
    ];

    return localforage
      .defineDriver(failingStorageDriver)
      .then(() => {
        return localforage.setDriver(driverPreferedOrder);
      })
      .then(() => {
        return localforage.ready();
      })
      .then(() => {
        assert.equal(localforage.driver(), appropriateDriver);
      });
  });
});

DRIVERS.forEach((driverName) => {
  if (
    (!localforage.supports(localforage.INDEXEDDB) && driverName === localforage.INDEXEDDB) ||
    (!localforage.supports(localforage.LOCALSTORAGE) && driverName === localforage.LOCALSTORAGE) ||
    (!localforage.supports(localforage.WEBSQL) && driverName === localforage.WEBSQL)
  ) {
    // Browser doesn't support this storage library, so we exit the API
    // tests.
    return;
  }

  describe(`${driverName} driver`, function() {
    'use strict';

    this.timeout(10000);

    before(async () => {
      await localforage.setDriver(driverName);
    });

    beforeEach(async () => {
      await localStorage.clear();
      await localforage.ready();
      await localforage.clear();
    });

    it('has a localStorage API', () => {
      assert.typeOf(localforage.getItem, 'function');
      assert.typeOf(localforage.setItem, 'function');
      assert.typeOf(localforage.clear, 'function');
      assert.typeOf(localforage.length, 'function');
      assert.typeOf(localforage.removeItem, 'function');
      assert.typeOf(localforage.key, 'function');
    });

    it('has the localForage API', () => {
      assert.typeOf(localforage._initStorage, 'function');
      assert.typeOf(localforage.config, 'function');
      assert.typeOf(localforage.defineDriver, 'function');
      assert.typeOf(localforage.driver, 'function');
      assert.typeOf(localforage.supports, 'function');
      assert.typeOf(localforage.iterate, 'function');
      assert.typeOf(localforage.getItem, 'function');
      assert.typeOf(localforage.setItem, 'function');
      assert.typeOf(localforage.clear, 'function');
      assert.typeOf(localforage.length, 'function');
      assert.typeOf(localforage.removeItem, 'function');
      assert.typeOf(localforage.key, 'function');
      assert.typeOf(localforage.getDriver, 'function');
      assert.typeOf(localforage.setDriver, 'function');
      assert.typeOf(localforage.ready, 'function');
      assert.typeOf(localforage.createInstance, 'function');
      assert.typeOf(localforage.getSerializer, 'function');
    });

    // Make sure we don't support bogus drivers.
    it(`supports ${driverName} database driver`, () => {
      assert.isTrue(localforage.supports(driverName));
      assert.isFalse(localforage.supports('I am not a driver'));
    });

    it('sets the right database driver', () => {
      assert.equal(localforage.driver(), driverName);
    });

    it('has an empty length by default', async () => {
      const length = await localforage.length();

      assert.equal(length, 0);
    });

    if (driverName === localforage.INDEXEDDB) {
      describe('Blob support', () => {
        let transaction;
        let called = false;
        let db;
        let blob = new Blob([''], { type: 'image/png' });

        before(() => {
          db = localforage._dbInfo.db;
          transaction = db.transaction;
          db.transaction = function() {
            called = true;
            return transaction.apply(db, arguments);
          };
        });

        beforeEach(() => {
          called = false;
        });

        it('not check for non Blob', () => {
          assert.isFalse(called);
          return localforage.setItem('key', {}).then(() => {
            assert.isTrue(called);
          });
        });

        it('check for Blob', () => {
          assert.isFalse(called);
          return localforage.setItem('key', blob).then(() => {
            assert.isTrue(called);
          });
        });

        it('check for Blob once', () => {
          assert.isFalse(called);
          return localforage.setItem('key', blob).then(() => {
            assert.isTrue(called);
          });
        });

        after(() => {
          localforage._dbInfo.db.transaction = transaction;
        });
      });
    }

    it('should iterate [promise]', () => {
      const accumulator = {};
      const iterationNumbers = [];

      return localforage
        .setItem('officeX', 'InitechX')
        .then((setValue) => {
          assert.equal(setValue, 'InitechX');
          return localforage.getItem('officeX');
        })
        .then((value) => {
          assert.equal(value, 'InitechX');
          return localforage.setItem('officeY', 'InitechY');
        })
        .then((setValue) => {
          assert.equal(setValue, 'InitechY');
          return localforage.getItem('officeY');
        })
        .then((value) => {
          assert.equal(value, 'InitechY');

          return localforage.iterate((value, key, iterationNumber) => {
            accumulator[key] = value;
            iterationNumbers.push(iterationNumber);
          });
        })
        .then(() => {
          assert.equal(accumulator.officeX, 'InitechX');
          assert.equal(accumulator.officeY, 'InitechY');
          assert.deepEqual(iterationNumbers, [1, 2]);
        });
    });

    it('should break iteration with defined return value [promise]', () => {
      const breakCondition = 'Some value!';

      return localforage
        .setItem('officeX', 'InitechX')
        .then((setValue) => {
          assert.equal(setValue, 'InitechX');
          return localforage.getItem('officeX');
        })
        .then((value) => {
          assert.equal(value, 'InitechX');
          return localforage.setItem('officeY', 'InitechY');
        })
        .then((setValue) => {
          assert.equal(setValue, 'InitechY');
          return localforage.getItem('officeY');
        })
        .then((value) => {
          assert.equal(value, 'InitechY');
          return localforage.iterate(() => {
            return breakCondition;
          });
        })
        .then((result) => {
          assert.equal(result, breakCondition);
        });
    });

    it('should iterate() through only its own keys/values', (done) => {
      // Loop through all key/value pairs; {local: 'forage'} set
      // manually should not be returned.
      let numberOfItems = 0;
      let iterationNumberConcat = '';

      localStorage.setItem('local', 'forage');
      localforage
        .setItem('office', 'Initech')
        .then(() => {
          return localforage.setItem('name', 'Bob');
        })
        .then(() => {
          localStorage.setItem('locals', 'forages');

          return localforage.iterate((value, key, iterationNumber) => {
            assert.notEqual(key, 'local');
            assert.notEqual(value, 'forage');
            numberOfItems++;
            iterationNumberConcat += iterationNumber;
          });
        })
        .then(() => {
          // While there are 4 items in localStorage,
          // only 2 items were set using localForage.
          assert.equal(numberOfItems, 2);

          // Only 2 items were set using localForage,
          // so we should get '12' and not '1234'
          assert.equal(iterationNumberConcat, '12');

          done();
        });
    });

    // Test for https://github.com/mozilla/localForage/issues/175
    it('nested getItem inside clear works [promise]', () => {
      return localforage
        .setItem('hello', 'Hello World !')
        .then(() => {
          return localforage.clear();
        })
        .then(() => {
          return localforage.getItem('hello');
        })
        .then((secondValue) => {
          assert.isNull(secondValue);
        });
    });

    // Because localStorage doesn't support saving the `undefined` type, we
    // always return `null` so that localForage is consistent across
    // browsers.
    // https://github.com/mozilla/localForage/pull/42
    it('returns null for undefined key [promise]', () => {
      return localforage.getItem('key').then((value) => {
        assert.isNull(value);
      });
    });

    it('saves an item [promise]', () => {
      localforage
        .setItem('office', 'Initech')
        .then((setValue) => {
          assert.equal(setValue, 'Initech');

          return localforage.getItem('office');
        })
        .then((value) => {
          assert.equal(value, 'Initech');
        });
    });

    it('saves an item over an existing key [promise]', () => {
      localforage
        .setItem('4e', 'Mozilla')
        .then((setValue) => {
          assert.equal(setValue, 'Mozilla');

          return localforage.setItem('4e', 'Quora');
        })
        .then((newValue) => {
          assert.notEqual(newValue, 'Mozilla');
          assert.equal(newValue, 'Quora');

          return localforage.getItem('4e');
        })
        .then((value) => {
          assert.notEqual(value, 'Mozilla');
          assert.equal(value, 'Quora');
        });
    });

    it('returns null when saving undefined [promise]', () => {
      return localforage.setItem('undef', undefined).then((setValue) => {
        assert.isNull(setValue);
      });
    });

    it('returns null for a non-existant key [promise]', () => {
      return localforage.getItem('undef').then((value) => {
        assert.isNull(value);
      });
    });

    // github.com/mozilla/localforage/pull/24#discussion-diff-9389662R158
    // localStorage's method API (`localStorage.getItem('foo')`) returns
    // `null` for undefined keys, even though its getter/setter API
    // (`localStorage.foo`) returns `undefined` for the same key. Gaia's
    // asyncStorage API, which is based on localStorage and upon which
    // localforage is based, ALSO returns `null`. BLARG! So for now, we
    // just return null, because there's no way to know from localStorage
    // if the key is ACTUALLY `null` or undefined but returning `null`.
    // And returning `undefined` here would break compatibility with
    // localStorage fallback. Maybe in the future we won't care...
    it('returns null from an undefined key [promise]', () => {
      return localforage.key(0).then((key) => {
        assert.isNull(key);
      });
    });

    it('returns key name [promise]', () => {
      return localforage
        .setItem('office', 'Initech')
        .then(() => {
          return localforage.key(0);
        })
        .then((key) => {
          assert.equal(key, 'office');
        });
    });

    it('removes an item [promise]', () => {
      return localforage
        .setItem('office', 'Initech')
        .then(() => {
          return localforage.setItem('otherOffice', 'Initrode');
        })
        .then(() => {
          return localforage.removeItem('office');
        })
        .then(() => {
          return localforage.getItem('office');
        })
        .then((emptyValue) => {
          assert.isNull(emptyValue);

          return localforage.getItem('otherOffice');
        })
        .then((value) => {
          assert.equal(value, 'Initrode');
        });
    });

    it('removes all items [promise]', () => {
      return localforage
        .setItem('office', 'Initech')
        .then(() => {
          return localforage.setItem('otherOffice', 'Initrode');
        })
        .then(() => {
          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 2);

          return localforage.clear();
        })
        .then(() => {
          return localforage.getItem('office');
        })
        .then((value) => {
          assert.isNull(value);

          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 0);
        });
    });

    if (driverName === localforage.LOCALSTORAGE) {
      it('removes only own items upon clear', () => {
        localStorage.setItem('local', 'forage');

        return localforage
          .setItem('office', 'Initech')
          .then(() => {
            return localforage.clear();
          })
          .then(() => {
            assert.equal(localStorage.getItem('local'), 'forage');

            localStorage.clear();
          });
      });

      it('returns only its own keys from keys()', () => {
        localStorage.setItem('local', 'forage');

        return localforage
          .setItem('office', 'Initech')
          .then(() => {
            return localforage.keys();
          })
          .then((keys) => {
            assert.deepEqual(keys, ['office']);

            localStorage.clear();
          });
      });

      it('counts only its own items with length()', () => {
        localStorage.setItem('local', 'forage');
        localStorage.setItem('another', 'value');

        return localforage
          .setItem('office', 'Initech')
          .then(() => {
            return localforage.length();
          })
          .then((length) => {
            assert.equal(length, 1);

            localStorage.clear();
          });
      });
    }

    it('has a length after saving an item [promise]', () => {
      return localforage
        .length()
        .then((length) => {
          assert.equal(length, 0);

          return localforage.setItem('lame rapper', 'Vanilla Ice');
        })
        .then(() => {
          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 1);
        });
    });

    // Deal with non-string keys, see issue #250
    // https://github.com/mozilla/localForage/issues/250
    it('casts an undefined key to a String', () => {
      return localforage
        .setItem(undefined, 'goodness!')
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.getItem(undefined);
        })
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.removeItem(undefined);
        })
        .then(() => {
          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 0);
        });
    });

    it('casts a null key to a String', () => {
      return localforage
        .setItem(null, 'goodness!')
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.getItem(null);
        })
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.removeItem(null);
        })
        .then(() => {
          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 0);
        });
    });

    it('casts a float key to a String', () => {
      localforage
        .setItem(537.35737, 'goodness!')
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.getItem(537.35737);
        })
        .then((value) => {
          assert.equal(value, 'goodness!');

          return localforage.removeItem(537.35737);
        })
        .then(() => {
          return localforage.length();
        })
        .then((length) => {
          assert.equal(length, 0);
        });
    });

    it('is retrieved by getDriver [promise]', () => {
      return localforage.getDriver(driverName).then((driver) => {
        assert.typeOf(driver, 'object');
        driverApiMethods.concat('_initStorage').forEach((methodName) => {
          assert.typeOf(driver[methodName], 'function');
        });
        assert.equal(driver._driver, driverName);
      });
    });

    if (driverName === localforage.WEBSQL || driverName === localforage.LOCALSTORAGE) {
      it('exposes the serializer on the dbInfo object', () => {
        return localforage.ready().then(() => {
          assert.typeOf(localforage._dbInfo.serializer, 'object');
        });
      });
    }
  });

  function prepareStorage(storageName) {
    // Delete IndexedDB storages (start from scratch)
    // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
    if (driverName === localforage.INDEXEDDB) {
      return new Promise((resolve) => {
        const indexedDB =
          indexedDB ||
          window.indexedDB ||
          window.webkitIndexedDB ||
          window.mozIndexedDB ||
          window.OIndexedDB ||
          window.msIndexedDB;

        indexedDB.deleteDatabase(storageName).onsuccess = resolve;
      });
    }

    // Otherwise, do nothing
    return Promise.resolve();
  }

  describe(`${driverName} driver multiple instances`, () => {
    let localforage2 = null;
    let localforage3 = null;

    before(() => {
      return prepareStorage('storage2').then(() => {
        localforage2 = localforage.createInstance({
          name: 'storage2',
          // We need a small value here
          // otherwise local PhantomJS test
          // will fail with SECURITY_ERR.
          // TravisCI seem to work fine though.
          size: 1024,
          storeName: 'storagename2',
        });

        // Same name, but different storeName since this has been
        // malfunctioning before w/ IndexedDB.
        localforage3 = localforage.createInstance({
          name: 'storage2',
          // We need a small value here
          // otherwise local PhantomJS test
          // will fail with SECURITY_ERR.
          // TravisCI seem to work fine though.
          size: 1024,
          storeName: 'storagename3',
        });

        return Promise.all([
          localforage.setDriver(driverName),
          localforage2.setDriver(driverName),
          localforage3.setDriver(driverName),
        ]);
      });
    });

    beforeEach(() => {
      return Promise.all([localforage.clear(), localforage2.clear(), localforage3.clear()]);
    });

    it('is not be able to access values of other instances', () => {
      return Promise.all([
        localforage.setItem('key1', 'value1a'),
        localforage2.setItem('key2', 'value2a'),
        localforage3.setItem('key3', 'value3a'),
      ]).then(() => {
        return Promise.all([
          localforage.getItem('key2').then((value) => {
            assert.isNull(value);
          }),
          localforage2.getItem('key1').then((value) => {
            assert.isNull(value);
          }),
          localforage2.getItem('key3').then((value) => {
            assert.isNull(value);
          }),
          localforage3.getItem('key2').then((value) => {
            assert.isNull(value);
          }),
        ]);
      });
    });

    it('retrieves the proper value when using the same key with other instances', () => {
      return Promise.all([
        localforage.setItem('key', 'value1'),
        localforage2.setItem('key', 'value2'),
        localforage3.setItem('key', 'value3'),
      ]).then(() => {
        return Promise.all([
          localforage.getItem('key').then((value) => {
            assert.equal(value, 'value1');
          }),
          localforage2.getItem('key').then((value) => {
            assert.equal(value, 'value2');
          }),
          localforage3.getItem('key').then((value) => {
            assert.equal(value, 'value3');
          }),
        ]);
      });
    });
  });

  // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
  describe(`${driverName} driver multiple instances (concurrent on same database)`, () => {
    it('chains operation on multiple stores', () => {
      return prepareStorage('storage3').then(() => {
        const localforage1 = localforage.createInstance({
          name: 'storage3',
          storeName: 'store1',
          size: 1024,
        });

        const localforage2 = localforage.createInstance({
          name: 'storage3',
          storeName: 'store2',
          size: 1024,
        });

        const localforage3 = localforage.createInstance({
          name: 'storage3',
          storeName: 'store3',
          size: 1024,
        });

        const promise1 = localforage1
          .setItem('key', 'value1')
          .then(() => {
            return localforage1.getItem('key');
          })
          .then((value) => {
            assert.equal(value, 'value1');
          });

        const promise2 = localforage2
          .setItem('key', 'value2')
          .then(() => {
            return localforage2.getItem('key');
          })
          .then((value) => {
            assert.equal(value, 'value2');
          });

        const promise3 = localforage3
          .setItem('key', 'value3')
          .then(() => {
            return localforage3.getItem('key');
          })
          .then((value) => {
            assert.equal(value, 'value3');
          });

        return Promise.all([promise1, promise2, promise3]);
      });
    });
  });

  describe(`${driverName} driver`, () => {
    let driverPreferedOrder;

    before(() => {
      // add some unsupported drivers before
      // and after the target driver
      driverPreferedOrder = ['I am a not supported driver'];

      if (!localforage.supports(localforage.WEBSQL)) {
        driverPreferedOrder.push(localforage.WEBSQL);
      }
      if (!localforage.supports(localforage.INDEXEDDB)) {
        driverPreferedOrder.push(localforage.INDEXEDDB);
      }
      if (!localforage.supports(localforage.LOCALSTORAGE)) {
        driverPreferedOrder.push(localforage.localStorage);
      }

      driverPreferedOrder.push(driverName);

      driverPreferedOrder.push('I am another not supported driver');
    });

    it('is used according to setDriver preference order', () => {
      return localforage.setDriver(driverPreferedOrder).then(() => {
        assert.equal(localforage.driver(), driverName);
      });
    });
  });

  describe(`${driverName} driver when ready() gets rejected`, () => {
    let _oldReady;

    beforeEach(() => {
      _oldReady = localforage.ready;
      localforage.ready = () => {
        return Promise.reject(new Error('Explode!'));
      };
    });

    afterEach(() => {
      localforage.ready = _oldReady;
      _oldReady = null;
    });

    driverApiMethods.forEach((methodName) => {
      it(`rejects ${methodName}() promise`, () => {
        return localforage[methodName]()
          .then(unexpectedSuccess)
          .catch((err) => {
            assert.typeOf(err, 'error');
            assert.equal(err.message, 'Explode!');
          });
      });
    });
  });
});

DRIVERS.forEach((driverName) => {
  describe(driverName + ' driver instance', () => {
    it('creates a new instance and sets the driver', () => {
      const localforage2 = localforage.createInstance({
        name: 'storage2',
        driver: driverName,
        // We need a small value here
        // otherwise local PhantomJS test
        // will fail with SECURITY_ERR.
        // TravisCI seem to work fine though.
        size: 1024,
        storeName: 'storagename2',
      });

      // since config actually uses setDriver which is async,
      // and since driver() and supports() are not defered (are sync),
      // we have to wait till an async method returns
      return localforage2
        .length()
        .then(() => {
          assert.equal(localforage2.driver(), driverName);
        })
        .catch(() => {
          assert.isNull(localforage2.driver());
        });
    });
  });
});
