import { IteratorFunction } from './Driver';
import { LocalStorageDriver } from '../src/drivers/LocalStorage';

declare global {
  interface Window {
    localforage: LocalForage;
  }
}

export type LocalForageValue =
  | Array<LocalForageValue>
  | ArrayBuffer
  | Blob
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | number
  | object
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | string
  | null
  | boolean
  | undefined;

export type LocalForageStatic = {
  createInstance: (config: LocalForageConfig) => LocalForage;
  defineDriver: (driver: LocalForageDriver) => void;
};

export type LocalForageDriverMethods = {
  getItem<T = LocalForageValue>(key: string): Promise<T>;
  setItem<T = LocalForageValue>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  length(): Promise<number>;
  key(keyIndex: number): Promise<string | undefined>;
  keys(): Promise<string[]>;
  iterate<_T, U>(iterator: IteratorFunction): Promise<U>;
  dropInstance: (config: LocalForageConfig) => Promise<void>;
  ready: () => Promise<boolean>;
};

export type LocalForageDriver = LocalForageDriverMethods & {
  _driver: string;
  isSupported: () => Promise<boolean>;
};

export type LocalForage = LocalForageStatic &
  LocalForageDriverMethods & {
    config: LocalForageConfig;
  };

export type LocalForageConfig = {
  description: string;
  driver: string[];
  // drivers: string[];
  name: string;
  // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
  // we can use without a prompt.
  size: number;
  storeName: string;
  version: number;
};

export type LocalForageInstanceMethods =
  | 'clear'
  | 'getItem'
  | 'iterate'
  | 'key'
  | 'keys'
  | 'length'
  | 'removeItem'
  | 'setItem'
  | 'dropInstance';
