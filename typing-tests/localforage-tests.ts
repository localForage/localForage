import * as LocalForage from 'localforage';
import * as localForageExt from 'localforage-ext';
import * as testDriver from 'localforage-testdriver';

let localForage: LocalForage.LocalForage = LocalForage;

namespace LocalForageTest {
    localForage.clear((err: any) => {
        let newError: any = err;
    });

    localForage.getSerializer().then((s: LocalForage.LocalForageSerializer) => {
        let serializer: LocalForage.LocalForageSerializer = s;
        typeof serializer.bufferToString === "function";
        typeof serializer.deserialize === "function";
        typeof serializer.serialize === "function";
        typeof serializer.stringToBuffer === "function";
    });

    localForage.iterate((value, key: string, num: number) => {
        let newStr: any = value;
        let newKey: string = key;
        let newNum: number = num;
    });

    localForage.iterate((value: any, key: string, num: number) => {
        let newStr: any = value;
        let newKey: string = key;
        let newNum: number = num;
    });

    localForage.iterate<any, void>((value: any, key: string, num: number) => {
        let newStr: any = value;
        let newKey: string = key;
        let newNum: number = num;
    });

    localForage.iterate((str: string, key: string, num: number) => {
        let newStr: string = str;
        let newKey: string = key;
        let newNum: number = num;
    });

    localForage.iterate((str: string, key: string, num: number) => {
        let newStr: string = str;
        let newKey: string = key;
        let newNum: number = num;
        if (newStr === 'END') {
            return newNum;
        }
    }).then((result: number | undefined) => {
        if (result) {
            let numResult: number = result;
        }
    });

    localForage.iterate<string, number | void>((str, key: string, num: number) => {
        let newStr: string = str;
        let newKey: string = key;
        let newNum: number = num;
        if (newStr === 'END') {
            return newNum;
        }
    }).then((result: number | void) => {
        if (result) {
            let numResult: number = result;
        }
    });

    localForage.iterate<string, number | void>((str: string, key: string, num: number) => {
        let newStr: string = str;
        let newKey: string = key;
        let newNum: number = num;
        if (newStr === 'END') {
            return newNum;
        }
    }).then((result: number | void) => {
        if (result) {
            let numResult: number = result;
        }
    });

    localForage.length((err: any, num: number) => {
        let newError: any = err;
        let newNumber: number = num;
    });

    localForage.length().then((num: number) => {
        var newNumber: number = num;
    });

    localForage.key(0, (err: any, value: string) => {
        let newError: any = err;
        let newValue: string = value;
    });

    localForage.keys((err: any, keys: Array<string>) => {
        let newError: any = err;
        let newArray: Array<string> = keys;
    });

    localForage.keys().then((keys: Array<string>) => {
        var newArray: Array<string> = keys;
    });

    localForage.getItem("key",(err: any, str: string) => {
        let newError: any = err;
        let newStr: string = str
    });

    localForage.getItem<string>("key").then((str: string) => {
        let newStr: string = str;
    });

    localForage.setItem("key", "value",(err: any, str: string) => {
        let newError: any = err;
        let newStr: string = str
    });

    localForage.setItem("key", "value").then((str: string) => {
        let newStr: string = str;
    });

    localForage.removeItem("key",(err: any) => {
        let newError: any = err;
    });

    localForage.removeItem("key").then(() => {
    });

    const customDriver: LocalForage.LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForage.LocalForageOptions) => {},
        getItem: <T>(key: string, callback?: (err: any, value: T) => void) => Promise.resolve({} as T),
        setItem: <T>(key: string, value: T, callback?: (err: any, value: T) => void) => Promise.resolve(value),
        removeItem: (key: string, callback?: (err: any) => void) => Promise.resolve(),
        clear: (callback?: (err: any) => void) => Promise.resolve(),
        length: (callback?: (err: any, numberOfKeys: number) => void) => Promise.resolve(5),
        key: (keyIndex: number, callback?: (err: any, key: string) => void) => Promise.resolve('aKey'),
        keys: (callback?: (err: any, keys: string[]) => void) => Promise.resolve(['1', '2']),
        iterate: <T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U, callback?: (err: any, result: U) => void) => Promise.resolve({} as U),
    };
    localForage.defineDriver(customDriver);

    const customDriver2: LocalForage.LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForage.LocalForageOptions) => {},
        _support: true,
        getItem: <T>(key: string, callback?: (err: any, value: T) => void) => Promise.resolve({} as T),
        setItem: <T>(key: string, value: T, callback?: (err: any, value: T) => void) => Promise.resolve(value),
        removeItem: (key: string, callback?: (err: any) => void) => Promise.resolve(),
        clear: (callback?: (err: any) => void) => Promise.resolve(),
        length: (callback?: (err: any, numberOfKeys: number) => void) => Promise.resolve(5),
        key: (keyIndex: number, callback?: (err: any, key: string) => void) => Promise.resolve('aKey'),
        keys: (callback?: (err: any, keys: string[]) => void) => Promise.resolve(['1', '2']),
        iterate: <T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U, callback?: (err: any, result: U) => void) => Promise.resolve({} as U),
    };
    localForage.defineDriver(customDriver2);

    const customDriver3: LocalForage.LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForage.LocalForageOptions) => {},
        _support: () => Promise.resolve(true),
        getItem: <T>(key: string, callback?: (err: any, value: T) => void) => Promise.resolve({} as T),
        setItem: <T>(key: string, value: T, callback?: (err: any, value: T) => void) => Promise.resolve(value),
        removeItem: (key: string, callback?: (err: any) => void) => Promise.resolve(),
        clear: (callback?: (err: any) => void) => Promise.resolve(),
        length: (callback?: (err: any, numberOfKeys: number) => void) => Promise.resolve(5),
        key: (keyIndex: number, callback?: (err: any, key: string) => void) => Promise.resolve('aKey'),
        keys: (callback?: (err: any, keys: string[]) => void) => Promise.resolve(['1', '2']),
        iterate: <T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U, callback?: (err: any, result: U) => void) => Promise.resolve({} as U),
        dropInstance: (dbInstanceOptions?: LocalForage.LocalForageOptions, callback?: (err: any) => void) => Promise.resolve(),
    };
    localForage.defineDriver(customDriver3);

    localForage.getDriver("CustomDriver").then((result: LocalForage.LocalForageDriver) => {
        var driver: LocalForage.LocalForageDriver = result;
        // we need to use a variable for proper type guards before TS 2.0
        var _support = driver._support;
        if (typeof _support === "function") {
            // _support = _support.bind(driver);
            _support().then((result: boolean) => {
                let doesSupport: boolean = result;
            });
        } else if (typeof _support === "boolean") {
            let doesSupport: boolean = _support;
        }
    });

    {
        let config: boolean;

        const configOptions: LocalForage.LocalForageOptions = {
            name: "testyo",
            driver: localForage.LOCALSTORAGE
        };

        config = localForage.config(configOptions);
        config = localForage.config({
            name: "testyo",
            driver: localForage.LOCALSTORAGE
        });
    }

    {
        let store: LocalForage.LocalForage;

        const configOptions: LocalForage.LocalForageOptions = {
            name: "da instance",
            driver: localForage.LOCALSTORAGE
        };

        store = localForage.createInstance(configOptions);
        store = localForage.createInstance({
            name: "da instance",
            driver: localForage.LOCALSTORAGE
        });
    }

    {
        localForage.dropInstance().then(() => {});

        const dropInstanceOptions: LocalForage.DbInstanceOptions = {
            name: "da instance",
            storeName: "da store"
        };

        localForage.dropInstance(dropInstanceOptions).then(() => {});

        localForage.dropInstance({
            name: "da instance",
            storeName: "da store"
        }).then(() => {});

        const dropDbOptions: LocalForage.DbInstanceOptions = {
            name: "da instance",
        };

        localForage.dropInstance({
            name: "da instance",
        }).then(() => {});
    }

    {
        let testSerializer: LocalForage.LocalForageSerializer;

        localForage.getSerializer()
        .then((serializer: LocalForage.LocalForageSerializer) => {
            testSerializer = serializer;
        });

        localForage.getSerializer((serializer: LocalForage.LocalForageSerializer) => {
            testSerializer = serializer;
        });
    }

    {
        localForage.ready().then(() => {});

        localForage.ready((error) => {
            if (error) {

            } else {
                
            }
        });
    }

    {
        const testdriver: LocalForage.LocalForageDriver = testDriver;
        localForage.defineDriver(testdriver);

        localForage.defineDriver(testDriver);
    }

    {
        localForage.testExtensionMethod();

        localForageExt.extendPrototype(localForage).testExtensionMethod();

        const lfe1: localForageExt.IHaveTestExtensionMethod = localForageExt.extendPrototype(localForage);
        lfe1.testExtensionMethod();

        const lfe2: localForageExt.LocalForageWithTestExtensionMethod = localForageExt.extendPrototype(localForage);
        lfe2.testExtensionMethod();
    }
}
