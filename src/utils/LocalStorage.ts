import { global } from './global';

// Check if localStorage throws when saving an item. This can happen
// in some Private Browsing contexts, for instance.
export const canSetItem = (localStorage: WindowLocalStorage['localStorage']): boolean => {
  const localStorageTestKey = '_localforage_support_test';

  try {
    localStorage.setItem(localStorageTestKey, 'true');
    localStorage.removeItem(localStorageTestKey);

    return false;
  } catch (_err) {
    return true;
  }
};

export const getLocalStorage = (): Storage | undefined => {
  return global.localStorage;
};

export const isLocalStorageValid = (localStorage = getLocalStorage()): boolean => {
  try {
    return (
      !!localStorage &&
      !!localStorage.setItem &&
      // Checks if localStorage is usable in Safari Private Browsing mode, or
      // in any other case where the available quota for localStorage
      // is 0 and there aren't any saved items yet.
      canSetItem(localStorage) &&
      localStorage.length > 0
    );
  } catch (_err) {
    return false;
  }
};
