var path = require('path');
var saucelabsBrowsers = require(path.resolve('test', 'saucelabs-browsers.js'));

var sourceFiles = [
    'Gruntfile.js',
    'src/*.js',
    'src/**/*.js',
    'test/**/test.*.js'
];

module.exports = exports = function(grunt) {
    'use strict';

    var BANNER = '/*!\n' +
                 '    localForage -- Offline Storage, Improved\n' +
                 '    Version ' + grunt.file.readJSON('package.json').version + '\n' +
                 '    https://localforage.github.io/localForage\n' +
                 '    (c) 2013-2017 Mozilla, Apache License 2.0\n' +
                 '*/\n';

    var babelModuleIdProvider = function getModuleId(moduleName) {
        var files = {
            'src/localforage': 'localforage',
            'src/utils/serializer': 'localforageSerializer',
            'src/drivers/indexeddb': 'asyncStorage',
            'src/drivers/localstorage': 'localStorageWrapper',
            'src/drivers/websql': 'webSQLStorage'
        };

        return files[moduleName] || moduleName.replace('src/', '');
    };

    grunt.initConfig({
        babel: {
            options: {
                babelrc: false,
                extends: path.resolve('.babelrc-umd'),
                moduleIds: true,
                getModuleId: babelModuleIdProvider
            },
            dist: {
                files: {
                    'build/es5src/localforage.js': 'src/localforage.js',
                    'build/es5src/utils/serializer.js': 'src/utils/serializer.js',
                    'build/es5src/drivers/indexeddb.js': 'src/drivers/indexeddb.js',
                    'build/es5src/drivers/localstorage.js': 'src/drivers/localstorage.js',
                    'build/es5src/drivers/websql.js': 'src/drivers/websql.js'
                }
            }
        },
        browserify: {
            package_bundling_test: {
                src: 'test/runner.browserify.js',
                dest: 'test/localforage.browserify.js'
            },
            main: {
                files: {
                    'dist/localforage.js': 'src/localforage.js'
                },
                options: {
                    browserifyOptions: {
                        standalone: 'localforage'
                    },
                    transform: ['rollupify', 'babelify'],
                    plugin: ['bundle-collapser/plugin', 'browserify-derequire']
                }
            },
            no_promises: {
                files: {
                    'dist/localforage.nopromises.js': 'src/localforage.js'
                },
                options: {
                    browserifyOptions: {
                        standalone: 'localforage'
                    },
                    transform: ['rollupify', 'babelify'],
                    plugin: ['bundle-collapser/plugin', 'browserify-derequire'],
                    exclude: ['lie/polyfill']
                }
            }
        },
        concat: {
            options: {
                separator: ''
            },
            localforage: {
                // just to add the BANNER
                // without adding an extra grunt module
                files: {
                    'dist/localforage.js': [
                        'dist/localforage.js'
                    ],
                    'dist/localforage.nopromises.js': [
                        'dist/localforage.nopromises.js'
                    ]
                },
                options: {
                    banner: BANNER
                }
            }
        },
        connect: {
            test: {
                options: {
                    base: '.',
                    hostname: '*',
                    port: 9999,
                    middleware: function(connect) {
                        return [
                            function(req, res, next) {
                                res.setHeader('Access-Control-Allow-Origin',
                                              '*');
                                res.setHeader('Access-Control-Allow-Methods',
                                              '*');

                                return next();
                            },
                            connect.static(require('path').resolve('.'))
                        ];
                    }
                }
            }
        },
        es3_safe_recast: {
            dist: {
                files: [{
                    src: ['dist/localforage.js'],
                    dest: 'dist/localforage.js'
                }]
            },
            nopromises: {
                files: [{
                    src: ['dist/localforage.nopromises.js'],
                    dest: 'dist/localforage.nopromises.js'
                }]
            }
        },
        eslint: {
            target: sourceFiles
        },
        mocha: {
            unit: {
                options: {
                    urls: [
                        'http://localhost:9999/test/test.main.html',
                        'http://localhost:9999/test/test.min.html',
                        'http://localhost:9999/test/test.polyfill.html',
                        'http://localhost:9999/test/test.callwhenready.html',
                        'http://localhost:9999/test/test.customdriver.html',
                        'http://localhost:9999/test/test.faultydriver.html',
                        'http://localhost:9999/test/test.nodriver.html',
                        'http://localhost:9999/test/test.browserify.html',
                        'http://localhost:9999/test/test.require.html',
                        'http://localhost:9999/test/test.webpack.html'
                    ]
                }
            }
        },
        'saucelabs-mocha': {
            all: {
                options: {
                    username: process.env.SAUCE_USERNAME,
                    key: process.env.SAUCE_ACCESS_KEY,
                    urls: ['http://localhost:9999/test/test.main.html'],
                    tunnelTimeout: 5,
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3,
                    browsers: saucelabsBrowsers,
                    testname: 'localForage Tests'
                }
            }
        },
        ts: {
            typing_tests: {
                tsconfig: {
                    tsconfig: 'typing-tests',
                    passThrough: true
                }
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js'],
                    'dist/localforage.nopromises.min.js': [
                        'dist/localforage.nopromises.js'
                    ]
                },
                options: {
                    banner: BANNER
                }
            }
        },
        watch: {
            build: {
                files: ['src/*.js', 'src/**/*.js'],
                tasks: ['build']
            },
            'mocha:unit': {
                files: [
                    'dist/localforage.js',
                    'test/runner.js',
                    'test/test.*.*'
                ],
                tasks: [
                    'eslint',
                    'browserify:package_bundling_test',
                    'webpack:package_bundling_test',
                    'mocha:unit'
                ]
            }
        },
        webpack: {
            package_bundling_test: {
                entry: './test/runner.webpack.js',
                output: {
                    path: 'test/',
                    filename: 'localforage.webpack.js'
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['build', 'connect', 'watch']);
    grunt.registerTask('build', ['browserify:main', 'browserify:no_promises',
        'concat', 'es3_safe_recast', 'uglify']);
    grunt.registerTask('serve', ['build', 'connect:test', 'watch']);

    // These are the test tasks we run regardless of Sauce Labs credentials.
    var testTasks = [
        'build',
        'babel',
        'eslint',
        'ts:typing_tests',
        'browserify:package_bundling_test',
        'webpack:package_bundling_test',
        'connect:test',
        'mocha'
    ];
    grunt.registerTask('test:local', testTasks.slice());

    // Run tests using Sauce Labs if we are on Travis or have locally
    // available Sauce Labs credentials. Use `grunt test:local` to skip
    // Sauce Labs tests.
    // if (process.env.TRAVIS_JOB_ID ||
    //     (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY)) {
    //     testTasks.push('saucelabs-mocha');
    // }

    grunt.registerTask('test', testTasks);
};
