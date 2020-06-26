import { isArray } from './utils/isArray';
import { LocalForageDriver } from '../types/LocalForage';
import { logger } from './utils/logger';
import { DefaultDrivers } from './defaults';

type DriverDictionary = {
  [driverName: string]: LocalForageDriver;
};

export const DriverManager = (drivers: DriverDictionary = DefaultDrivers) => {
  // Drivers are stored here when `defineDriver()` is called.
  // They are shared across all instances of localForage.
  const DefinedDrivers: DriverDictionary = {};

  const DriverSupport: {
    [driverName: string]: boolean;
  } = {};

  let currentDriver: string | null = null;

  const defineDriver = async (driverObject: LocalForageDriver): Promise<boolean> => {
    try {
      const driverName = driverObject._driver;

      // A driver name should be defined and not overlap with the
      // library-defined, default drivers.
      if (!driverObject._driver) {
        throw new Error(
          'Custom driver not compliant; see https://localforage.github.io/localforage/#definedriver',
        );
      }

      const isSupported = await driverObject.isSupported();

      if (DefinedDrivers[driverName]) {
        logger.warn(`Redefining localForage driver: ${driverName}`);
      }

      DefinedDrivers[driverName] = driverObject;
      DriverSupport[driverName] = isSupported;

      return isSupported;
    } catch (err) {
      throw err;
    }
  };

  const getDriver = (driverName: string | null = currentDriver): LocalForageDriver => {
    if (driverName === null) {
      throw new Error('getDriver() called with `null`.');
    }

    return DefinedDrivers[driverName];
  };

  const hasDriver = (driverName: string): boolean => {
    return !!DefinedDrivers[driverName];
  };

  const getSupportedDrivers = async (
    driverNames: string[] = ['localStorageWrapper'],
  ): Promise<string[]> => {
    return driverNames.filter(async (driverName) => {
      const isSupported = await getDriver(driverName).isSupported();

      return isSupported;
    });
  };

  const setDriver = async (drivers: string | string[]) => {
    if (!isArray(drivers)) {
      drivers = [drivers as string];
    }

    //     self._wrapLibraryMethodsWithReady();
    //     self._initDriver = initDriver(supportedDrivers);
    //   });
    // })
  };

  Object.values(drivers).forEach((driver) => {
    defineDriver(driver);
    setDriver(driver._driver);
  });

  return {
    currentDriver,
    defineDriver,
    hasDriver,
    getDriver,
    getSupportedDrivers,
    setDriver,
  };
};
