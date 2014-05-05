/*global exports:true, require:true */
var path = require('path');

module.exports = exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        casper: {
            options: {
                pre: './test/init.coffee',
                test: true
            },

            indexedDB: {
                options: {
                    args: [
                        '--driver=asyncStorage',
                        '--driver-name=IndexedDB',
                        '--url=indexeddb'
                    ],
                    engine: 'slimerjs'
                },
                src: [
                    'test/test.*.coffee'
                ]
            },

            localstorageGecko: {
                options: {
                    args: [
                        '--driver=localStorageWrapper',
                        '--driver-name=localStorage',
                        '--url=localstorage'
                    ],
                    engine: 'slimerjs'
                },
                src: [
                    'test/test.*.coffee'
                ]
            },

            localstorageWebKit: {
                src: [
                    'test/test.*.coffee'
                ]
            },

            websql: {
                options: {
                    args: [
                        '--driver=webSQLStorage',
                        '--driver-name=WebSQL',
                        '--url=websql'
                    ]
                },
                src: [
                    'test/test.*.coffee'
                ]
            }
        },
        concat: {
            options: {
                separator: '',
            },
            localforage: {
                src: [
                    // https://github.com/jakearchibald/es6-promise
                    'bower_components/es6-promise/promise.js',
                    'src/drivers/**/*.js',
                    'src/localforage.js'
                ],
                dest: 'dist/localforage.js',
                options: {
                    banner:
                        '/*!\n' +
                        '    localForage -- Offline Storage, Improved\n' +
                        '    Version 0.7.0\n' +
                        '    http://mozilla.github.io/localForage\n' +
                        '    (c) 2013-2014 Mozilla, Apache License 2.0\n' +
                        '*/\n'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            source: ['Gruntfile.js', 'src/*.js', 'src/**/*.js']
        },
        shell: {
            options: {
                stdout: true
            },
            component: {
                command: path.resolve('node_modules', 'component', 'bin',
                                      'component-build') +
                         ' -o test -n localforage.component'
            },
            publishDocs: {
                command: 'rake publish ALLOW_DIRTY=true'
            },
            serveDocs: {
                command: 'bundle exec middleman server'
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js'],
                    'docs/localforage.min.js': ['dist/localforage.js']
                }
            }
        },
        watch: {
            build: {
                files: ['src/*.js', 'src/**/*.js'],
                tasks: ['build']
            },
            grunt: {
                files: [
                    'Gruntfile.js'
                ]
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('docs', ['shell:serveDocs']);
    grunt.registerTask('publish', ['build', 'shell:publishDocs']);

    grunt.registerTask('test-server', function() {
        grunt.log.writeln('Starting web servers at test/server.coffee');

        require('./test/server.coffee').listen(8181);
        // Used to test cross-origin iframes.
        require('./test/server.coffee').listen(8182);
    });

    grunt.registerTask('serve', ['build', 'test-server', 'watch']);
    grunt.registerTask('test', ['build', 'jshint', 'shell:component', 'test-server', 'casper']);
};
