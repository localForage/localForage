/*global exports:true */
module.exports = exports = function(grunt) {
    'use strict';
    grunt.initConfig({
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['concat', 'uglify']);
};
