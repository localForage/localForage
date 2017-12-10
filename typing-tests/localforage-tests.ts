import * as localforage from 'localforage';

let localForage: LocalForage = localforage;

namespace LocalForageTest {
    localForage.clear((err: any) => {
        let newError: any = err;
    });

    localForage.getSerializer().then((s: LocalForageSerializer) => {
        let serializer: LocalForageSerializer = s;
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

    const customDriver: LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForageOptions) => {},
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

    const customDriver2: LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForageOptions) => {},
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

    const customDriver3: LocalForageDriver = {
        _driver: "CustomDriver",
        _initStorage: (options: LocalForageOptions) => {},
        _support: () => Promise.resolve(true),
        getItem: <T>(key: string, callback?: (err: any, value: T) => void) => Promise.resolve({} as T),
        setItem: <T>(key: string, value: T, callback?: (err: any, value: T) => void) => Promise.resolve(value),
        removeItem: (key: string, callback?: (err: any) => void) => Promise.resolve(),
        clear: (callback?: (err: any) => void) => Promise.resolve(),
        length: (callback?: (err: any, numberOfKeys: number) => void) => Promise.resolve(5),
        key: (keyIndex: number, callback?: (err: any, key: string) => void) => Promise.resolve('aKey'),
        keys: (callback?: (err: any, keys: string[]) => void) => Promise.resolve(['1', '2']),
        iterate: <T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U, callback?: (err: any, result: U) => void) => Promise.resolve({} as U),
        dropInstance: (dbInstanceOptions?: LocalForageDbInstanceOptions, callback?: (err: any) => void) => Promise.resolve(),
    };
    localForage.defineDriver(customDriver3);

    localForage.getDriver("CustomDriver").then((result: LocalForageDriver) => {
        var driver: LocalForageDriver = result;
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

        const configOptions: LocalForageOptions = {
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
        let store: LocalForage;

        const configOptions: LocalForageOptions = {
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

        const dropInstanceOptions: LocalForageDbInstanceOptions = {
            name: "da instance",
            storeName: "da store"
        };

        localForage.dropInstance(dropInstanceOptions).then(() => {});

        localForage.dropInstance({
            name: "da instance",
            storeName: "da store"
        }).then(() => {});

        const dropDbOptions: LocalForageDbInstanceOptions = {
            name: "da instance",
        };

        localForage.dropInstance({
            name: "da instance",
        }).then(() => {});
    }

    {
        let testSerializer: LocalForageSerializer;

        localForage.getSerializer()
        .then((serializer: LocalForageSerializer) => {
            testSerializer = serializer;
        });

        localForage.getSerializer((serializer: LocalForageSerializer) => {
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
}
