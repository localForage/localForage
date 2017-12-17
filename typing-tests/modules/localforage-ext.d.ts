import * as localForage from 'localforage';

interface IHaveTestExtensionMethod {
    testExtensionMethod(): Promise<void>;
}

interface LocalForageWithTestExtensionMethod extends localForage.LocalForage, IHaveTestExtensionMethod { }

declare module 'localforage-ext' {
    export function extendPrototype(localforage: localForage.LocalForage)
        : LocalForageWithTestExtensionMethod;

    export function extendPrototype<T>(localforage: T)
        : T & IHaveTestExtensionMethod;

    export var extendPrototypeResult: boolean;
}

declare module 'localforage' {
    interface LocalForage extends IHaveTestExtensionMethod {}
}
