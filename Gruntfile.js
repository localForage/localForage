/*global config:true, exports:true, require:true */
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
                    './test/test.*.coffee'
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
                    './test/test.*.coffee'
                ]
            },

            localstorageWebKit: {
                options: {
                    engine: 'phantomjs'
                },
                src: [
                    './test/test.*.coffee'
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
                    './test/test.*.coffee'
                ]
            }
        },
        concat: {
            options: {
                separator: '',
            },
            localforage: {
                src: [
                    'vendor/promise.js',
                    'src/drivers/**/*.js',
                    'src/localforage.js'
                ],
                dest: 'dist/localforage.js',
                options: {
                    banner:
                        '/*!\n' +
                        '    localForage -- Offline Storage, Improved\n' +
                        '    http://mozilla.github.io/localForage\n' +
                        '    (c) 2013-2014 Mozilla, Apache License 2.0\n' +
                        '*/\n'
                }
            },
            backbone: {
                src: [
                    'src/adapters/backbone.js'
                ],
                dest: 'dist/backbone.localforage.js',
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js']
                }
            },
            backbone: {
                files: {
                    'dist/backbone.localforage.min.js': ['dist/backbone.localforage.js']
                }
            }
        },
        watch: {
            concat: {
                files: ['src/*.js', 'src/**/*.js'],
                tasks: ['concat']
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
