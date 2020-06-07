import { logger } from './logger';

export const normalizeKey = (key: any): String => {
  // Cast the key to a string, as that's all we can set as a key across
  // storage engines.
  if (typeof key !== 'string') {
    logger.warn(`${key} used as a key, but it is not a string.`);

    return String(key);
  }

  return key;
};
