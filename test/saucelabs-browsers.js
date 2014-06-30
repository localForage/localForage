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
];

module.exports = SAUCELAB_BROWSERS;
