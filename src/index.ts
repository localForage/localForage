import {
  LocalForage,
  LocalForageConfig,
  LocalForageDriver,
  LocalForageInstanceMethods,
} from '../types/LocalForage';
import { DefaultConfig, DefaultDrivers } from './defaults';
import { DriverManager } from './driverManager';
import { createConfig } from './config';

// TODO: Would be nice to not have to redeclare these, but this is fine for now.
// export const LocalForageDriverMethodsAsArray: Array<keyof LocalForageDriverMethods> = [
export const LocalForageDriverMethodsAsArray: LocalForageInstanceMethods[] = [
  'getItem',
  'setItem',
  'removeItem',
  'clear',
  'length',
  'key',
  'keys',
  'iterate',
  'dropInstance',
];

const sharedDriverManager = DriverManager(DefaultDrivers);

const createLocalForage = (
  config = DefaultConfig,
  _driverManager = sharedDriverManager,
): LocalForage => {
  let instanceConfig = createConfig(config);

  const isReady = async (): Promise<LocalForageDriver> => {
    const supportedDrivers = await _driverManager.getSupportedDrivers();

    // There might be a driver initialization in progress
    // so wait for it to finish in order to avoid a possible
    // race condition to set _dbInfo
    // TODO: RESTORE THIS.
    // const oldDriverSetDone =
    //   DriverIsSet !== null ? DriverIsSet.catch(() => Promise.resolve()) : Promise.resolve();

    // Set this to be the active driver.
    try {
      return _driverManager.getDriver(supportedDrivers[0]);
    } catch (err) {
      throw new Error('No available storage method found.');
    }
  };

  /**
   * localForage methods.
   */

  const createInstance = (config?: LocalForageConfig) => {
    return createLocalForage(config);
  };

  const getItem: LocalForageDriver['getItem'] = async (key) => {
    const currentDriver = await isReady();

    return currentDriver.getItem(key);
  };

  const setItem: LocalForageDriver['setItem'] = async (key, value) => {
    const currentDriver = await isReady();

    return currentDriver.setItem(key, value);
  };

  const removeItem: LocalForageDriver['removeItem'] = async (key) => {
    const currentDriver = await isReady();

    return currentDriver.removeItem(key);
  };

  const key: LocalForageDriver['key'] = async (keyIndex) => {
    const currentDriver = await isReady();

    return currentDriver.key(keyIndex);
  };

  const keys: LocalForageDriver['keys'] = async () => {
    const currentDriver = await isReady();

    return currentDriver.keys();
  };

  const clear: LocalForageDriver['clear'] = async () => {
    const currentDriver = await isReady();

    return currentDriver.clear();
  };

  const length: LocalForageDriver['length'] = async () => {
    const currentDriver = await isReady();

    return currentDriver.length();
  };

  const iterate: LocalForageDriver['iterate'] = async (iterator) => {
    const currentDriver = await isReady();

    return currentDriver.iterate(iterator);
  };

  const dropInstance: LocalForageDriver['dropInstance'] = async (config) => {
    const currentDriver = await isReady();

    return currentDriver.dropInstance(config);
  };

  const localForageInstance = {
    get config() {
      return instanceConfig;
    },
    set config(config: LocalForageConfig) {
      instanceConfig = createConfig(config, instanceConfig);
      _driverManager.setDriver(instanceConfig.driver);
    },
    createInstance,
    defineDriver: _driverManager.defineDriver,
    getItem,
    setItem,
    removeItem,
    key,
    keys,
    clear,
    length,
    iterate,
    dropInstance,
    ready: async () => {
      return !!(await isReady());
    },
  };

  return localForageInstance;
};

// The actual localForage object that we expose as a module or via a
// global. It's extended by pulling in one of our other libraries.
const localForage = createLocalForage();

// globalThis.localforage = localForage;
window.localforage = localForage;

export default localForage;
