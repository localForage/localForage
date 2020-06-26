import { LocalForageValue } from './LocalForage';

export type IteratorFunction = <T = LocalForageValue, U = any>(
  value: T,
  key: string,
  iterationNumber: number,
) => Promise<U>;
