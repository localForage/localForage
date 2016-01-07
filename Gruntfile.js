/* jshint node:true */
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
                 '    https://mozilla.github.io/localForage\n' +
                 '    (c) 2013-2015 Mozilla, Apache License 2.0\n' +
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
                modules: 'umd',
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
            }
        },
        concat: {
            options: {
                separator: ''
            },
            localforage: {
                files: {
                    'dist/localforage.js': [
                        'bower_components/es6-promise/promise.js',
                        'dist/localforage.nopromises.js'
                    ],
                    'dist/localforage.nopromises.js': [
                        // just to add the BANNER
                        // without adding an extra grunt module
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
        jscs: {
            source: sourceFiles
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            source: sourceFiles
        },
        mocha: {
            unit: {
                options: {
                    urls: [
                        'http://localhost:9999/test/test.component.html',
                        'http://localhost:9999/test/test.nodriver.html',
                        'http://localhost:9999/test/test.main.html',
                        'http://localhost:9999/test/test.min.html',
                        'http://localhost:9999/test/test.require.html',
                        'http://localhost:9999/test/test.require.unbundled.html',
                        'http://localhost:9999/test/test.browserify.html',
                        'http://localhost:9999/test/test.webpack.html',
                        'http://localhost:9999/test/test.callwhenready.html',
                        'http://localhost:9999/test/test.customdriver.html'
                    ]
                }
            }
        },
        open: {
            site: {
                path: 'http://localhost:4567/'
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
        shell: {
            options: {
                stdout: true
            },
            component: {
                command: path.resolve('node_modules', 'component', 'bin',
                                      'component-build') +
                         ' --dev -o test -n localforage.component'
            },
            'publish-site': {
                command: 'rake publish ALLOW_DIRTY=true'
            },
            'serve-site': {
                command: 'bundle exec middleman server'
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js'],
                    'dist/localforage.nopromises.min.js': [
                        'dist/localforage.nopromises.js'
                    ],
                    'site/localforage.min.js': ['dist/localforage.js']
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
            /*jshint scripturl:true */
            'mocha:unit': {
                files: [
                    'dist/localforage.js',
                    'test/runner.js',
                    'test/test.*.*'
                ],
                tasks: [
                    'jshint',
                    'jscs',
                    'shell:component',
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
            },
            localforage_nopromises: {
                entry: './src/localforage.js',
                output: {
                    path: 'dist/',
                    filename: 'localforage.nopromises.js',
                    library: ['localforage'],
                    libraryTarget: 'umd'
                },
                module: {
                    loaders: [{
                        test: /\.js?$/,
                        exclude: /(node_modules|bower_components)/,
                        loader: 'babel'
                    }]
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['build', 'connect', 'watch']);
    grunt.registerTask('build', ['webpack:localforage_nopromises', 'concat', 'es3_safe_recast', 'uglify']);
    grunt.registerTask('publish', ['build', 'shell:publish-site']);
    grunt.registerTask('serve', ['build', 'connect:test', 'watch']);
    grunt.registerTask('site', ['shell:serve-site']);

    // These are the test tasks we run regardless of Sauce Labs credentials.
    var testTasks = [
        'build',
        'babel',
        'jshint',
        'jscs',
        'shell:component',
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
