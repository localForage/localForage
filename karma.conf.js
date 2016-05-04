var path = require('path');

module.exports = function(config) {
  // Example set of browsers to run on Sauce Labs
  // Check out https://saucelabs.com/platforms for all browser/platform combos
  var customLaunchers = {
    sl_chrome_45_windows_7: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '45'
    },
    sl_firefox_44_linux: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Linux',
      version: '44'
    },
    sl_firefox_45_linux: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Linux',
      version: '45'
    },
    // sl_firefox_44_mac: {
    //   base: 'SauceLabs',
    //   browserName: 'firefox',
    //   platform: 'OS X 10.10',
    //   version: '45'
    // },
    // sl_firefox_45_mac: {
    //   base: 'SauceLabs',
    //   browserName: 'firefox',
    //   platform: 'OS X 10.10',
    //   version: '45'
    // },
    // sl_firefox_46_mac: {
    //   base: 'SauceLabs',
    //   browserName: 'firefox',
    //   platform: 'OS X 10.10',
    //   version: '46'
    // },
    // sl_ios_safari: {
    //   base: 'SauceLabs',
    //   browserName: 'MobileSafari',
    //   deviceName: 'iPhone Simulator',
    //   deviceOrientation: 'portrait',
    //   platform: 'OS X 10.10',
    //   version: '9.2'
    // },
    sl_ie_9_windows_7: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '9'
    },
    sl_ie_10_windows_7: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '10'
    },
    sl_ie_11_windows_8_1: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    }
  };

  var browsers = Object.keys({} || customLaunchers).concat([
    'Chrome',
    'Firefox',
    'PhantomJS',
    // 'Safari'
  ]);

  config.set({
    customLaunchers: customLaunchers,
    browsers: browsers,
    client: {
      captureConsole: false
    },
    coverageReporter: {
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.' },
      ],
    },
    files: [
      'tests/test.*.js',
      {
        included: false,
        pattern: 'tests/**',
        served: true,
        watched: true,
      },
      {
        included: false,
        pattern: 'dist/localforage.js',
        served: true,
        watched: true,
      },
    ],
    frameworks: [
      'mocha',
      'chai',
      'sinon',
    ],
    // logLevel: 'error',
    preprocessors: {
      'tests/test.*.js': ['webpack', 'sourcemap'],
    },
    // reporters: ['progress', 'coverage'],
    reporters: ['progress', 'saucelabs'],
    reportSlowerThan: 500,
    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        preLoaders: [
          {
            test: /\.js?$/,
            include: /src|tests/,
            exclude: /(bower_components|node_modules)/,
            loader: 'babel',
            query: {
              cacheDirectory: true,
            },
          },
          {
            test: /\.js?$/,
            include: /src/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-istanbul',
            query: {
              cacheDirectory: true,
            },
          },
        ],
        loaders: [
          {
            test: /\.js$/,
            include: path.resolve(__dirname, '../src'),
            exclude: /(bower_components|node_modules)/,
            loader: 'babel',
            query: {
              cacheDirectory: true,
            },
          },
        ],
      },
    },
  });
};
