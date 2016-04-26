var path = require('path');

module.exports = function(config) {
  // Example set of browsers to run on Sauce Labs
  // Check out https://saucelabs.com/platforms for all browser/platform combos
  // var customLaunchers = {
  //   sl_chrome: {
  //     base: 'SauceLabs',
  //     browserName: 'chrome',
  //     platform: 'Windows 7',
  //     version: '45'
  //   },
  //   sl_firefox: {
  //     base: 'SauceLabs',
  //     browserName: 'firefox',
  //     version: '45'
  //   },
  //   // sl_ios_safari: {
  //   //   base: 'SauceLabs',
  //   //   // browserName: 'Safari',
  //   //   deviceName: 'iPhone Simulator',
  //   //   platform: 'OS X 10.10',
  //   //   platformName: 'iOS',
  //   //   version: '9.2'
  //   // },
  //   sl_ie_11: {
  //     base: 'SauceLabs',
  //     browserName: 'internet explorer',
  //     platform: 'Windows 8.1',
  //     version: '11'
  //   }
  // };

  config.set({
    // customLaunchers: customLaunchers,
    // browsers: Object.keys(customLaunchers),
    browsers: [
      'Chrome',
      'Firefox',
      'PhantomJS'
    ],
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
    ],
    frameworks: [
      'mocha',
      'chai'
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
