import localforage from '../dist/localforage';

describe('Config API', () => {
  var DRIVERS = [
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE,
    localforage.WEBSQL
  ];

  var defaultConfig = localforage.config();
  var supportedDrivers = [];

  before(() => {
    supportedDrivers = [];
    for (let i = 0; i <= DRIVERS.length; i++) {
      if (localforage.supports(DRIVERS[i])) {
        supportedDrivers.push(DRIVERS[i]);
      }
    }
  });

  // Reset localForage before each test so we can call `config()` without
  // errors.
  beforeEach(() => {
    localforage._ready = null;
    localforage.config(defaultConfig);
  });

  it('returns the default values', () => {
    assert.equal(localforage.config('description'), '');
    assert.equal(localforage.config('name'), 'localforage');
    assert.equal(localforage.config('size'), 4980736);
    assert.equal(localforage.config('storeName'), 'keyvaluepairs');
    assert.equal(localforage.config('version'), 1.0);
    return localforage.ready()
      .then(() => {
        assert.equal(localforage.config('driver'), localforage.driver());
      });
  });

  it('returns error if API call was already made', (done) => {
    localforage.length(() => {
      var configResult = localforage.config({
        description: '123',
        driver: 'I am not set driver',
        name: 'My Cool App',
        storeName: 'myStoreName',
        version: 2.0
      });

      var error = "Error: Can't call config() after localforage has been used.";

      assert.notEqual(configResult, true);
      assert.equal(configResult.toString(), error);

      // Expect the config values to be as they were before.
      assert.notEqual(localforage.config('description'), '123');
      assert.equal(localforage.config('description'), '');
      assert.equal(localforage.config('driver'), localforage.driver());
      assert.notEqual(localforage.config('driver'), 'I am not set driver');
      assert.equal(localforage.config('name'), 'localforage');
      assert.notEqual(localforage.config('name'), 'My Cool App');
      assert.equal(localforage.config('size'), 4980736);
      assert.equal(localforage.config('storeName'), 'keyvaluepairs');
      assert.equal(localforage.config('version'), 1.0);

      done();
    });
  });

  it('sets new values and returns them properly', (done) => {
    var secondSupportedDriver = supportedDrivers.length >= 2 ? supportedDrivers[1] : null;

    localforage.config({
      description: 'The offline datastore for my cool app',
      driver: secondSupportedDriver,
      name: 'My Cool App',
      storeName: 'myStoreName',
      version: 2.0
    });

    assert.notEqual(localforage.config('description'), '');
    assert.equal(localforage.config('description'),
                 'The offline datastore for my cool app');
    assert.equal(localforage.config('driver'), secondSupportedDriver);
    assert.equal(localforage.config('name'), 'My Cool App');
    assert.equal(localforage.config('size'), 4980736);
    assert.equal(localforage.config('storeName'), 'myStoreName');
    assert.equal(localforage.config('version'), 2.0);

    localforage.ready(() => {
      if (supportedDrivers.length >= 2) {
        assert.equal(localforage.config('driver'), secondSupportedDriver);
      } else {
        assert.equal(localforage.config('driver'), supportedDrivers[0]);
      }
      done();
    });
  });

  if (supportedDrivers.length >= 2) {
    it('sets new driver using preference order', (done) => {
      var otherSupportedDrivers = supportedDrivers.slice(1);

      localforage.config({
        driver: otherSupportedDrivers
      });

      localforage.ready(() => {
        assert.equal(localforage.config('driver'), otherSupportedDrivers[0]);
        done();
      });
    });
  }

  it('it does not set an unsupported driver', (done) => {
    var oldDriver = localforage.driver();
    localforage.config({
      driver: 'I am a not supported driver'
    });

    localforage.ready(() => {
      assert.equal(localforage.config('driver'), oldDriver);
      done();
    });
  });

  it('it does not set an unsupported driver using preference order', (done) => {
    var oldDriver = localforage.driver();
    localforage.config({
      driver: [
        'I am not a supported driver',
        'I am another not supported driver'
      ]
    });

    localforage.ready(() => {
      assert.equal(localforage.config('driver'), oldDriver);
      done();
    });
  });

  it('converts bad config values across drivers', () => {
    localforage.config({
      name: 'My Cool App',
      // https://github.com/mozilla/localForage/issues/247
      storeName: 'my store&name-v1',
      version: 2.0
    });

    assert.equal(localforage.config('name'), 'My Cool App');
    assert.equal(localforage.config('storeName'), 'my_store_name_v1');
    assert.equal(localforage.config('version'), 2.0);
  });

  it(`uses the config values in ${localforage.driver()}`, (done) => {
    localforage.config({
      description: 'The offline datastore for my cool app',
      driver: localforage.driver(),
      name: 'My Cool App',
      storeName: 'myStoreName',
      version: 2.0
    });

    localforage.setItem('some key', 'some value')
      .then((value) => {
        if (localforage.driver() === localforage.INDEXEDDB) {
          var indexedDB = (indexedDB || window.indexedDB ||
                   window.webkitIndexedDB ||
                   window.mozIndexedDB || window.OIndexedDB ||
                   window.msIndexedDB);
          var req = indexedDB.open('My Cool App', 2.0);

          req.onsuccess = () => {
            var dbValue = req.result
                     .transaction('myStoreName', 'readonly')
                     .objectStore('myStoreName')
                     .get('some key');
            assert.equal(dbValue, value);
            done();
          };
        } else if (localforage.driver() === localforage.WEBSQL) {
          window.openDatabase('My Cool App', String(2.0), '',
                              4980736).transaction((t) => {
            t.executeSql('SELECT * FROM myStoreName WHERE key = ? LIMIT 1',
                         ['some key'], (t, results) => {
              var dbValue = JSON.parse(results.rows.item(0).value);

              assert.equal(dbValue, value);
              done();
            });
          });
        } else if (localforage.driver() === localforage.LOCALSTORAGE) {
          var dbValue = JSON.parse(
            localStorage['My Cool App/myStoreName/some key']);

          assert.equal(dbValue, value);
          done();
        }
    });
  });

  it("returns all values when config isn't passed arguments", () => {
    assert.typeOf(localforage.config(), 'object');
    assert.lengthOf(Object.keys(localforage.config()), 6);
  });

  // This may go away when https://github.com/mozilla/localForage/issues/168
  // is fixed.
  it('maintains config values across setDriver calls', () => {
    localforage.config({
      name: 'Mega Mozilla Dino'
    });

    return localforage.length()
      .then(() => {
        return localforage.setDriver(localforage.LOCALSTORAGE);
      })
      .then(() => {
        assert.equal(localforage.config('name'), 'Mega Mozilla Dino');
      });
  });
});
