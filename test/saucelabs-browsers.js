/*jshint node:true */ 

var SAUCELAB_BROWSERS = [
    {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7',
        version: '34',
    },
    {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '28',
    },
    {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '29',
    },

    // {
    //     base: 'SauceLabs',
    //     browserName: 'internet explorer',
    //     version: '8',
    //     platform: 'Windows XP'
    // },
    {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '9',
    },
    {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '10',
    },
    {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11',
    },

    
    {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '10',
        platform: 'Windows 8'
    },
    {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11',
        platform: 'Windows 8.1'
    },

    {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '28',
        platform: 'OS X 10.9'
    },
    {
        base: 'SauceLabs',
        browserName: 'safari',
        version: '7',
        platform: 'OS X 10.9'
    },

    // {
    //     deviceName: 'Android',
    //     browserName: 'android',
    //     version: '4.0',
    // },
    // {
    //     deviceName: 'Android',
    //     browserName: 'android',
    //     version: '4.1',
    // },
    // {
    //     deviceName: 'Android',
    //     browserName: 'android',
    //     version: '4.2',
    // },
    // {
    //     deviceName: 'Android',
    //     browserName: 'android',
    //     version: '4.3',
    // },

    {
        base: 'SauceLabs',
        deviceName: 'iPhone',
        browserName: 'iphone',
        version: '6.0',
    },
    {
        base: 'SauceLabs',
        deviceName: 'iPhone',
        browserName: 'iphone',
        version: '6.1',
    },
    {
        base: 'SauceLabs',
        deviceName: 'iPhone',
        browserName: 'iphone',
        version: '7.0',
    },
    {
        base: 'SauceLabs',
        deviceName: 'iPhone',
        browserName: 'iphone',
        version: '7.1'
    }
];

module.exports = SAUCELAB_BROWSERS;
