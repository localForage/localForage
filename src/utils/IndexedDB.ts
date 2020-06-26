import { global } from './global';

export const getIndexedDB = (): IDBFactory | undefined => {
  try {
    return global.indexedDB;
  } catch (err) {
    return undefined;
  }
};

export const isIndexedDBValid = (indexedDB = getIndexedDB()): boolean => {
  try {
    // If there's no IndexedDB available in this environment, then IndexedDB
    // is certainly not valid.
    if (!indexedDB || !indexedDB.open) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};
