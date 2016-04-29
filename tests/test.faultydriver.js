import localforage from '../dist/localforage';

var unexpectedSuccess = () => {
  assert.fail(null, null, 'Unexpected success');
};

describe('When Driver Fails to Initialize', () => {
  var FAULTYDRIVERS = [
    localforage.WEBSQL
  ];

  before(() => {
    try {
      window.originalOpenDatabase = window.openDatabase;
      window.openDatabase = function faultyOpenDatabase() {
        throw new Error('OpenDatabase Faulty Driver Test!');
      };
    } catch (err) {

    }
  });

  after(() => {
    try {
      window.openDatabase = window.originalOpenDatabase;
    } catch (err) {

    }
  });

  FAULTYDRIVERS.forEach((driverName) => {
    it(`fails to setDriver ${driverName} [callback]`, (done) => {
      localforage.setDriver(driverName);
      localforage.ready((err) => {
        assert.typeOf(err, 'Error');
        assert.equal(err.message, 'No available storage method found.');
        done();
      });
    });

    it(`fails to setDriver ${driverName} [promise]`, () => {
      localforage.setDriver(driverName);
      return localforage.ready()
        .then(unexpectedSuccess)
        .catch((err) => {
          assert.typeOf(err, 'Error');
          assert.equal(err.message, 'No available storage method found.');
        });
    });
  });
});
