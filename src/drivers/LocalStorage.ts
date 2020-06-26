// If IndexedDB isn't available, we'll fall back to localStorage.
// Note that this will have considerable performance and storage
// side-effects (all data will be serialized on save and only data that
// can be converted to a string via `JSON.stringify()` will be saved).
import { isLocalStorageValid, getLocalStorage } from '../utils/LocalStorage';
import { normalizeKey } from '../utils/keys';
import { deserialize, serialize } from '../utils/serializer';
import { LocalForageDriver, LocalForageConfig } from '../../types/LocalForage';
import { DefaultConfig } from '../defaults';
import { IteratorFunction } from '../../types/Driver';

const getKeyPrefix = (config: LocalForageConfig) => {
  if (config.storeName !== DefaultConfig.storeName) {
    return `${config.name}/${config.storeName}/`;
  }

  return `${config.name}/`;
};

export const LocalStorageDriver = (config: LocalForageConfig): LocalForageDriver => {
  const keyPrefix = getKeyPrefix(config);

  const isSupported = async () => {
    return isLocalStorageValid();
  };

  /**
   * A Promise that resolves when localStorage is ready to be used.
   */
  const driverReady = new Promise<boolean>(async (resolve, reject) => {
    try {
      const hasSupport = await isSupported();

      resolve(hasSupport);
    } catch (err) {
      reject(err);
    }
  });

  /**
   * Remove all data from the current database.
   */
  const clear = async (): Promise<void> => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);

      if (key && key.indexOf(keyPrefix) === 0) {
        localStorage.removeItem(key);
      }
    }

    return;
  };

  /**
   * Retrieve an item from the store based on the key supplied.
   *
   * @param {string} key The name of the key to retrieve.
   */
  const getItem: LocalForageDriver['getItem'] = async (key): Promise<any> => {
    const result = localStorage.getItem(`${keyPrefix}${normalizeKey(key)}`);

    // If the value isn't truthy, it's probably `undefined`, and we should skip
    // deserialization, returning the value as-is.
    return result ? deserialize(result) : result;
  };

  /**
   * Iterate over all items in the store.
   *
   * @param {function} iterator Iterator function that iterates over every value in the database. Each iteration calls the iterator function like `iterator(value, key, iterationNumber)`.
   */
  const iterate: LocalForageDriver['iterate'] = async (iterator: IteratorFunction) => {
    const keyPrefixLength = keyPrefix.length;
    const length = localStorage.length;

    // We use a dedicated iterator instead of the `i` variable below
    // so other keys we fetch in localStorage aren't counted in
    // the `iterationNumber` argument passed to the `iterate()`
    // callback.
    //
    // See:
    // https://github.com/localForage/localForage/pull/435#discussion_r38061530
    let iterationNumber = 1;

    for (let i = 0; i < length; i++) {
      const key = localStorage.key(i);

      // Ignore this value if the key is null or the key doesn't belong to this
      // database.
      if (key === null || key.indexOf(keyPrefix) !== 0) {
        continue;
      }

      const value = await getItem<any>(key);

      const iteratorResult = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

      if (iteratorResult !== void 0) {
        return iteratorResult;
      }
    }

    return;
  };

  /**
   * Get the name of a key based on its index number.
   *
   * @param {number} keyIndex The index of the key name you're looking up.
   */
  const key: LocalForageDriver['key'] = async (keyIndex) => {
    if (typeof keyIndex !== 'number') {
      return undefined;
    }

    let result;
    try {
      result = localStorage.key(keyIndex);
    } catch (error) {
      result = undefined;
    }

    // Remove the prefix from the key, if a key is found.
    return result ? result.substring(keyPrefix.length) : undefined;
  };

  /**
   * Get the name of every key in this database.
   */
  const keys: LocalForageDriver['keys'] = async () => {
    const length = localStorage.length;
    const keys = [];

    for (let i = 0; i < length; i++) {
      const itemKey = localStorage.key(i);
      if (itemKey && itemKey.indexOf(keyPrefix) === 0) {
        keys.push(itemKey.substring(keyPrefix.length));
      }
    }

    return keys;
  };

  // Supply the number of keys in the datastore to the callback function.
  const length = async () => {
    const keysForDatabase = await keys();
    return keysForDatabase.length;
  };

  /**
   * Remove an item from the store based on the key supplied.
   *
   * @param {string} key The name of the key to remove from the database.
   */
  const removeItem: LocalForageDriver['removeItem'] = async (key) => {
    localStorage.removeItem(`${keyPrefix}${normalizeKey(key)}`);

    return;
  };

  /**
   * Saves a key and value to the database.
   *
   * Resolves once the data has been written successfully.
   *
   * The following types can be saved:
   *
   * - `Array`
   * - `ArrayBuffer`
   * - `Blob`
   * - `Float32Array`
   * - `Float64Array`
   * - `Int8Array`
   * - `Int16Array`
   * - `Int32Array`
   * - `Number`
   * - `Object`
   * - `Uint8Array`
   * - `Uint8ClampedArray`
   * - `Uint16Array`
   * - `Uint32Array`
   * - `String`
   *
   * @param {string} key    Name of the key to save the data by.
   * @param {any}    value  The value to be saved to the database.
   */
  const setItem: LocalForageDriver['setItem'] = async (key, value) => {
    // Convert undefined values to null.
    // https://github.com/mozilla/localForage/pull/42
    // if (value === undefined) {
    //   value = null;
    // }

    // Save the original value to pass to the callback.
    const originalValue = value;

    const serializedValue = await serialize(value);

    try {
      localStorage.setItem(`${keyPrefix}${normalizeKey(key)}`, serializedValue);
    } catch (err) {
      // localStorage capacity exceeded.
      // TODO: Make this a specific error/event.
      if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        throw err;
      }

      throw err;
    }

    return originalValue;
  };

  /**
   * Removes this entire database.
   *
   * @param {[LocalForageConfig]} config Configuration to drop an instance for. Will drop the default instance if no arguments are supplied.
   */
  const dropInstance: LocalForageDriver['dropInstance'] = async (
    dropConfig?: LocalForageConfig,
  ) => {
    const name = dropConfig && dropConfig.name ? dropConfig.name : config.name;
    const storeName = dropConfig && dropConfig.storeName ? dropConfig.storeName : config.storeName;

    if (!name) {
      throw new Error('Invalid arguments.');
    }

    let keyPrefix;
    if (!storeName) {
      keyPrefix = `${name}/`;
    } else {
      keyPrefix = getKeyPrefix(dropConfig || config);
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);

      if (key && key.indexOf(keyPrefix) === 0) {
        localStorage.removeItem(key);
      }
    }

    return;
  };

  return {
    _driver: 'localStorageWrapper',
    iterate,
    getItem,
    setItem,
    removeItem,
    clear,
    length,
    key,
    keys,
    dropInstance,
    isSupported,
    ready: async () => {
      return driverReady;
    },
  };
};
