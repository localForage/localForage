import { LocalStorageDriver } from './drivers/LocalStorage';
// import includes from 'utils/includes';
import { isArray } from './utils/isArray';
import {
  LocalForage,
  LocalForageInstanceMethods,
  LocalForageConfig,
  LocalForageDriver,
} from '../types/LocalForage';
import { logger } from './utils/logger';

export const DefaultConfig: LocalForageConfig = {
  description: '',
  driver: ['localStorageWrapper'],
  name: 'localforage',
  // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
  // we can use without a prompt.
  size: 4980736,
  storeName: 'keyvaluepairs',
  version: 1.0,
};

export const DefaultDrivers: {
  [driverName: string]: LocalForageDriver;
} = {
  //   INDEXEDDB: idbDriver,
  //   WEBSQL: websqlDriver,
  LOCALSTORAGE: LocalStorageDriver(DefaultConfig),
};

export const DefaultDriverOrder = [
  //   DefaultDrivers.INDEXEDDB._driver,
  //   DefaultDrivers.WEBSQL._driver,
  DefaultDrivers.LOCALSTORAGE._driver,
];
