import { LocalForageConfig } from '../types/LocalForage';
import { logger } from './utils/logger';
import { DefaultConfig } from './defaults';

/**
 * Create config values for localForage from a new and existing config.
 *
 * It is best to call this method _before_ interacting with your database.
 *
 * While this function can be called at any time, re-configuring localForage
 * after calls to the database have been made will cancel all in-flight
 * operations.
 *
 * Be careful not to call this method unless you are sure no methods are
 * currently getting/setting/removing data. Those operations will be aborted
 * and could leave you with an unexpected state in your database.
 *
 * @param {LocalForageConfig} config         Configuration options for this localForage instance.
 * @param {LocalForageConfig} existingConfig Existing options already set. Defaults to `DefaultConfig`.
 */
export const createConfig = (
  config: LocalForageConfig,
  existingConfig: LocalForageConfig = DefaultConfig,
  isReady: boolean = false,
  _driverManager = null,
): LocalForageConfig => {
  // If localforage is ready and fully initialized, this is a dangerous
  // operation. We'll notify the user.
  if (isReady) {
    logger.warn(
      'Called config() after localforage has been used. This has no effect. Do all initialization before using localForage.',
    );
    // return;
  }

  if (typeof config.version !== 'number') {
    throw new Error('Database version must be a number.');
  }

  try {
    config.storeName = config.storeName.replace(/\W/g, '_');
  } catch (err) {
    throw err;
  }

  config = {
    ...existingConfig,
    ...config,
  };

  //   if (_driverManager) {
  //     _driverManager.setDriver(config.driver);
  //   }

  return config;
};
