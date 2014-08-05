var gulp = require('gulp');

var component = require('gulp-component-build');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha-phantomjs');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var browserify = require('browserify');
var del = require('del');
var source = require('vinyl-source-stream');

// Define source target
var src = gulp.src([
    'gulpfile.js',
    'src/*.js',
    'src/**/*.js',
    'test/**/test.*.js'
]);

// ---------------------

// Clean build directory
gulp.task('clean', function(callback) {
    del(['dist'], callback);
});

// Browserify
gulp.task('browserify', function() {
    return browserify({
            standalone: 'localforage'
        })
        .add('./src/localforage.js')
        .bundle()
        .pipe(source('localforage.js'))
        .pipe(gulp.dest('./dist/'));
});

// Minify
gulp.task('uglify', function() {
    gulp.src('./dist/localforage.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/'));
});

// ---------------------

// Style
gulp.task('jscs', function() {
    return gulp.src([
            './src/*.js'
        ])
        .pipe(jscs());
});

// Lint
gulp.task('jshint', function() {
    return src
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Integration
gulp.task('mocha', function() {
    return gulp.src([
            'test/test.main.html',
            'test/test.min.html',
            'test/test.nodriver.html',
            'test/test.require.html',
            'test/test.component.html'
        ])
        .pipe(mocha());
});

// ---------------------

gulp.task('component', function() {
    return gulp.src('./component.json')
        .pipe(component.scripts({ install: true }))
        .pipe(rename('component.js'))
        .pipe(gulp.dest('./test/'));
});

// ---------------------

gulp.task('build', ['clean', 'browserify', 'uglify']);
gulp.task('test', ['jscs', 'jshint', 'mocha']);
gulp.task('publish', ['component']);