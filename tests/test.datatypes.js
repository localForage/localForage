import localforage from '../dist/localforage';

// kinda lame to define this twice, but it seems require() isn't available here
function createBlob(parts, properties) {
  /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== 'TypeError') {
      throw e;
    }
    var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
      typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
        typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder :
          WebKitBlobBuilder;
    var builder = new Builder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

// function isSerializeSkip() {
//   return (localforage.driver() === localforage.LOCALSTORAGE &&
//           );
// }

function isSerializeSkip() {
  if (/Chrome/.test(navigator.userAgent) &&
      /Google Inc/.test(navigator.vendor) &&
      localforage.driver() !== localforage.INDEXEDDB) {
    return false;
  }

  if (/WebKit/.test(navigator.userAgent) &&
      localforage.driver() === localforage.LOCALSTORAGE) {
    return false;
  }

  return true;
};

var DRIVERS = [
  localforage.INDEXEDDB,
  localforage.LOCALSTORAGE,
  localforage.WEBSQL
];

DRIVERS.forEach((driverName) => {
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

  describe(`Type handler for ${driverName}`, function() {
    // this.timeout(30000);

    before(() => {
      return localforage.setDriver(driverName);
    });

    beforeEach(() => {
      return localforage.clear();
    });

    it('saves a string [callback]', (done) => {
      localforage.setItem('office', 'Initech', (err, setValue) => {
        assert.equal(setValue, 'Initech');

        localforage.getItem('office', (err, value) => {
          assert.equal(value, setValue);
          done();
        });
      });
    });

    it('saves a string [promise]', () => {
      return localforage.setItem('office', 'Initech')
        .then((setValue) => {
          assert.equal(setValue, 'Initech');

          return localforage.getItem('office');
        })
        .then((value) => {
          assert.equal(value, 'Initech');
        });
    });

    it('saves a number [callback]', (done) => {
      localforage.setItem('number', 546, (err, setValue) => {
        assert.equal(setValue, 546);
        assert.typeOf(setValue, 'number');

        localforage.getItem('number', (err, value) => {
          assert.equal(value, setValue);
          assert.typeOf(value, 'number');
          done();
        });
      });
    });

    it('saves a number [promise]', () => {
      return localforage.setItem('number', 546)
        .then((setValue) => {
          assert.equal(setValue, 546);
          assert.typeOf(setValue, 'number');

          return localforage.getItem('number');
        }).then((value) => {
          assert.equal(value, 546);
          assert.typeOf(value, 'number');
        });
    });

    it('saves a boolean [callback]', (done) => {
      localforage.setItem('boolean', false, (err, setValue) => {
        assert.equal(setValue, false);
        assert.typeOf(setValue, 'boolean');

        localforage.getItem('boolean', (err, value) => {
          assert.equal(value, setValue);
          assert.typeOf(value, 'boolean');
          done();
        });
      });
    });

    it('saves a boolean [promise]', () => {
      return localforage.setItem('boolean', false)
        .then((setValue) => {
          assert.equal(setValue, false);
          assert.typeOf(setValue, 'boolean');

          return localforage.getItem('boolean');
        })
        .then((value) => {
          assert.equal(value, false);
          assert.typeOf(value, 'boolean');
        });
    });

    it('saves null [callback]', (done) => {
      localforage.setItem('null', null, (err, setValue) => {
        assert.equal(setValue, null);

        localforage.getItem('null', (err, value) => {
          assert.equal(value, null);
          done();
        });
      });
    });

    it('saves null [promise]', () => {
      return localforage.setItem('null', null)
        .then((setValue) => {
          assert.equal(setValue, null);

          return localforage.getItem('null');
        })
        .then((value) => {
          assert.equal(value, null);
        });
    });

    it('saves undefined as null [callback]', (done) => {
      localforage.setItem('null', undefined, (err, setValue) => {
        assert.equal(setValue, null);

        localforage.getItem('null', (err, value) => {
          assert.equal(value, null);
          done();
        });
      });
    });

    it('saves undefined as null [promise]', () => {
      return localforage.setItem('null', undefined)
        .then((setValue) => {
          assert.equal(setValue, null);

          return localforage.getItem('null');
        })
        .then((value) => {
          assert.equal(value, null);
        });
    });

    it('saves a float [callback]', (done) => {
      localforage.setItem('float', 546.041, (err, setValue) => {
        assert.equal(setValue, 546.041);
        assert.typeOf(setValue, 'number');

        localforage.getItem('float', (err, value) => {
          assert.equal(value, setValue);
          assert.typeOf(value, 'number');
          done();
        });
      });
    });

    it('saves a float [promise]', () => {
      return localforage.setItem('float', 546.041)
        .then((setValue) => {
          assert.equal(setValue, 546.041);
          assert.typeOf(setValue, 'number');

          return localforage.getItem('float');
        })
        .then((value) => {
          assert.equal(value, 546.041);
          assert.typeOf(value, 'number');
        });
    });

    var arrayToSave = [2, 'one', true];
    it('saves an array [callback]', (done) => {
      localforage.setItem('array', arrayToSave, (err, setValue) => {
        assert.equal(setValue.length, arrayToSave.length);
        assert.equal(setValue instanceof Array, true);

        localforage.getItem('array', (err, value) => {
          assert.equal(value.length, arrayToSave.length);
          assert.equal(value instanceof Array, true);
          assert.typeOf(value[1], 'string');
          done();
        });
      });
    });

    it('saves an array [promise]', () => {
      return localforage.setItem('array', arrayToSave)
        .then((setValue) => {
          assert.equal(setValue.length, arrayToSave.length);
          assert.equal(setValue instanceof Array, true);

          return localforage.getItem('array');
        })
        .then((value) => {
          assert.equal(value.length, arrayToSave.length);
          assert.equal(value instanceof Array, true);
          assert.typeOf(value[1], 'string');
        });
    });

    var objectToSave = {
      floating: 43.01,
      nested: {
        array: [1, 2, 3]
      },
      nestedObjects: [
        {truth: true},
        {theCake: 'is a lie'},
        {happiness: 'is a warm gun'},
        false
      ],
      string: 'bar'
    };

    it('saves a nested object [callback]', (done) => {
      localforage.setItem('obj', objectToSave, (err, setValue) => {
        assert.lengthOf(Object.keys(setValue),
                        Object.keys(objectToSave).length);
        assert.typeOf(setValue, 'object');

        localforage.getItem('obj', (err, value) => {
          assert.lengthOf(Object.keys(value), Object.keys(objectToSave).length);
          assert.typeOf(value, 'object');
          assert.typeOf(value.nested, 'object');
          assert.typeOf(value.nestedObjects[0].truth, 'boolean');
          assert.typeOf(value.nestedObjects[1].theCake, 'string');
          assert.equal(value.nestedObjects[3], false);
          done();
        });
      });
    });

    it('saves a nested object [promise]', () => {
      return localforage.setItem('obj', objectToSave)
        .then((setValue) => {
          assert.lengthOf(Object.keys(setValue),
                          Object.keys(objectToSave).length);
          assert.typeOf(setValue, 'object');

          return localforage.getItem('obj');
        })
        .then((value) => {
          assert.lengthOf(Object.keys(value),
                          Object.keys(objectToSave).length);
          assert.typeOf(value, 'object');
          assert.typeOf(value.nested, 'object');
          assert.typeOf(value.nestedObjects[0].truth, 'boolean');
          assert.typeOf(value.nestedObjects[1].theCake, 'string');
          assert.equal(value.nestedObjects[3], false);
        });
    });

    // Skip binary (ArrayBuffer) data tests if Array Buffer isn't supported.
    if (typeof ArrayBuffer !== 'undefined') {
      var runBinaryTest = (url, done) => {
        var request = new XMLHttpRequest();

        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When the AJAX state changes, save the photo locally.
        request.onreadystatechange = () => {
          if (request.readyState === request.DONE) {
            var response = request.response;
            localforage.setItem('ab', response, (err, sab) => {
              assert.equal(sab.toString(), '[object ArrayBuffer]');
              assert.equal(sab.byteLength, response.byteLength);
            }).then(() => {
              // TODO: Running getItem from inside the setItem
              // callback times out on IE 10/11. Could be an
              // open transaction issue?
              localforage.getItem('ab', (err, arrayBuff) => {
                assert.equal(arrayBuff.toString(), '[object ArrayBuffer]');
                assert.equal(arrayBuff.byteLength, response.byteLength);
              });

              done();
            });
          }
        };

        request.send();
      };

      it('saves binary (ArrayBuffer) data', (done) => {
        runBinaryTest('/test/photo.jpg', done);
      });

      it('saves odd length binary (ArrayBuffer) data', (done) => {
        runBinaryTest('/test/photo2.jpg', done);
      });
    } else {
      it.skip(
        'saves binary (ArrayBuffer) data (ArrayBuffer type does not exist)');
    }

    // This does not run on PhantomJS < 2.0.
    // https://github.com/ariya/phantomjs/issues/11013
    // Skip binary(Blob) data tests if Blob isn't supported.
    if (typeof Blob === 'function') {
      it('saves binary (Blob) data', (done) => {
        var fileParts = ['<a id=\"a\"><b id=\"b\">hey!<\/b><\/a>'];
        var mimeString = 'text\/html';

        var testBlob = createBlob(fileParts, { 'type' : mimeString });

        localforage.setItem('blob', testBlob, (err, blob) => {
          assert.equal(err, null);
          assert.equal(blob.toString(), '[object Blob]');
          assert.equal(blob.size, testBlob.size);
          assert.equal(blob.type, testBlob.type);
        }).then(() => {
          localforage.getItem('blob', (err, blob) => {
            assert.equal(err, null);
            assert.equal(blob.toString(), '[object Blob]');
            assert.equal(blob.size, testBlob.size);
            assert.equal(blob.type, testBlob.type);

            done();
          });
        });
      });
    } else {
      it.skip('saves binary (Blob) data (Blob type does not exist)');
    }

    if (typeof Blob === 'function') {
      it('saves binary (Blob) data, iterate back', (done) => {
        var fileParts = ['<a id=\"a\"><b id=\"b\">hey!<\/b><\/a>'];
        var mimeString = 'text\/html';

        var testBlob = createBlob(fileParts, { 'type' : mimeString });

        localforage.setItem('blob', testBlob, (err, blob) => {
          assert.equal(err, null);
          assert.equal(blob.toString(), '[object Blob]');
          assert.equal(blob.size, testBlob.size);
          assert.equal(blob.type, testBlob.type);
        }).then(() => {
          localforage.iterate((blob, key) => {
            if (key !== 'blob') {
              return;
            }
            assert.equal(blob.toString(), '[object Blob]');
            assert.equal(blob.size, testBlob.size);
            assert.equal(blob.type, testBlob.type);

            done();
          });
        });
      });
    } else {
      it.skip('saves binary (Blob) data (Blob type does not exist)');
    }
  });

  describe('Typed Array handling in ' + driverName, () => {
    if (typeof Int8Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Int8Array', (done) => {
        var array = new Int8Array(8);
        array[2] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Int8Array, true);
            assert.equal(readValue[2], array[2]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Int8Array type");
    }

    if (typeof Uint8Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Uint8Array', (done) => {
        var array = new Uint8Array(8);
        array[0] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Uint8Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Uint8Array type");
    }

    if (typeof Uint8ClampedArray !== 'undefined' && isSerializeSkip()) {
      it('saves an Uint8ClampedArray', (done) => {
        var array = new Uint8ClampedArray(8);
        array[0] = 0;
        array[1] = 93;
        array[2] = 350;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            expect(readValue instanceof Uint8ClampedArray, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[1], array[1]);
            assert.equal(readValue[2], array[2]);
            assert.equal(readValue[1], writeValue[1]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Uint8Array type");
    }

    if (typeof Int16Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Int16Array', (done) => {
        var array = new Int16Array(8);
        array[0] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Int16Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Int16Array type");
    }

    if (typeof Uint16Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Uint16Array', (done) => {
        var array = new Uint16Array(8);
        array[0] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Uint16Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Uint16Array type");
    }

    if (typeof Int32Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Int32Array', (done) => {
        var array = new Int32Array(8);
        array[0] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Int32Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Int32Array type");
    }

    if (typeof Uint32Array !== 'undefined' && isSerializeSkip()) {
      it('saves an Uint32Array', (done) => {
        var array = new Uint32Array(8);
        array[0] = 65;
        array[4] = 0;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Uint32Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Uint32Array type");
    }

    if (typeof Float32Array !== 'undefined' && isSerializeSkip()) {
      it('saves a Float32Array', (done) => {
        var array = new Float32Array(8);
        array[0] = 6.5;
        array[4] = 0.1;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Float32Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Float32Array type");
    }

    if (typeof Float64Array !== 'undefined' && isSerializeSkip()) {
      it('saves a Float64Array', (done) => {
        var array = new Float64Array(8);
        array[0] = 6.5;
        array[4] = 0.1;

        localforage.setItem('array', array, (err, writeValue) => {
          localforage.getItem('array', (err, readValue) => {
            assert.equal(readValue instanceof Float64Array, true);
            assert.equal(readValue[0], array[0]);
            assert.equal(readValue[4], writeValue[4]);
            assert.equal(readValue.length, writeValue.length);

            done();
          });
        });
      });
    } else {
      it.skip("doesn't have the Float64Array type");
    }
  });
});
