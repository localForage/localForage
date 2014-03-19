/*global exports:true, require:true */
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
                        '    Version 0.1.0\n' +
                        '    http://mozilla.github.io/localForage\n' +
                        '    (c) 2013-2014 Mozilla, Apache License 2.0\n' +
                        '*/\n'
                }
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js']
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

    grunt.loadNpmTasks('grunt-casper');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);

    grunt.registerTask('server', function() {
        grunt.log.writeln('Starting web server at test/server.coffee');

        require('./test/server.coffee').listen(8181);
    });

    grunt.registerTask('test', ['build', 'server', 'casper']);
};
