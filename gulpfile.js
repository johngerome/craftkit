// GulpJS Documentation -> http://goo.gl/woLzJq

'use strict';


var gulp        = require('gulp');
var plugins     = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var pkg         = require('./package.json');
var browserSync = require('browser-sync');
var koutoSwiss  = require('kouto-swiss');
var argv        = require('yargs').argv;
var glob        = require('glob');
var reload      = browserSync.reload;

var APP_DIR     = 'app';
var BUILD_DIR   = 'dist';

var AUTOPREFIXER_BROWSERS = [
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];


////////////////////////////////////////////////////////////////////////////////
/// STYLESHEETS
////////////////////////////////////////////////////////////////////////////////
// Stylus to CSS
gulp.task('stylus-css', function() {
    return gulp.src([APP_DIR+ '/css/styl/*.styl'])
        .pipe(plugins.stylus({
            use: koutoSwiss(),
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css'));
});

//
gulp.task('style-improvement', function(){
    return gulp.src([BUILD_DIR+ '/css/style.css'])
    .pipe(plugins.pleeease({
            browsers: AUTOPREFIXER_BROWSERS,
            minifier: false
    }))
    .pipe(plugins.uncss({
            html: glob.sync(BUILD_DIR+ '/**/*.html')
    }))
    .pipe(gulp.dest(BUILD_DIR+ '/css'));
});

//
gulp.task('style-minify', function() {
    return gulp.src([BUILD_DIR+ '/css/**/*.css'])
        .pipe(plugins.minifyCss())
        .pipe(gulp.dest(BUILD_DIR+ '/css'));
});

// Validating CSS
gulp.task('style-lint', function() {
    return gulp.src([BUILD_DIR+ '/css/**/*.css'])
        .pipe(plugins.csslint())
        .pipe(plugins.csslint.reporter());
});


// Development
gulp.task('dev-styles', function(done) {
    runSequence(
        'stylus-css',
        'style-improvement',
        'style-lint'
    ,done);
});

// Production
gulp.task('prod-styles', function(done) {
    runSequence(
        'stylus-css',
        'style-improvement',
        'style-minify'
    ,done);
});



////////////////////////////////////////////////////////////////////////////////
/// SCRIPTS
////////////////////////////////////////////////////////////////////////////////

// Build Custom modernizr.js for better performance
gulp.task('build-modernizr', function() {
  gulp.src([BUILD_DIR+ '/js/**/*.js', BUILD_DIR+ '/css/**/*.css'])
    .pipe(plugins.modernizr())
    .pipe(plugins.uglify())
    .pipe(gulp.dest(BUILD_DIR+ '/js'))
});

//
gulp.task('jshint', function () {
  return gulp.src(APP_DIR+ '/js/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.if(!browserSync.active, plugins.jshint.reporter('fail')));
});

// compile all scripts
gulp.task('compile-scripts', ['jshint'], function() {
    return gulp.src(APP_DIR+ '/js/**/*.js')
        .pipe(plugins.uglify())
        .pipe(gulp.dest(BUILD_DIR+ '/js'));
});




////////////////////////////////////////////////////////////////////////////////
/// IMAGES
////////////////////////////////////////////////////////////////////////////////

// Optimize Images
gulp.task('images', function () {
    return gulp.src(APP_DIR+ '/**/*.{png,jpg,svg}')
        .pipe(plugins.cache(plugins.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist'))
        .pipe(plugins.size({title: 'images'}));
});




////////////////////////////////////////////////////////////////////////////////
/// HTML
////////////////////////////////////////////////////////////////////////////////
gulp.task('html', function() {
    var YOUR_LOCALS = {};

    return gulp.src(APP_DIR+ '/html/patterns/pages/**/*.jade')
        .pipe(plugins.jade({
            locals: YOUR_LOCALS
        }))
        .pipe(gulp.dest(BUILD_DIR));
});



// Copy Extra Files
gulp.task('copy-extra-files', function() {
    return gulp.src([
            APP_DIR+ '/.htaccess',
            APP_DIR+ '/browserconfig.xml',
            APP_DIR+ '/crossdomain.xml',
            APP_DIR+ '/humans.txt',
            APP_DIR+ '/robots.txt',
            APP_DIR+ '/favicon.ico',
        ])
        .pipe(gulp.dest(BUILD_DIR));
});


// clean build directory
gulp.task('clean', function (done) {
    require('del')(
        BUILD_DIR,
    done);
});



// Watch Files For Changes & Reload
gulp.task('serve', function () {
  browserSync({
    notify: false,
    // Customize the BrowserSync console logging prefix
    //logPrefix: 'styly',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: [BUILD_DIR]
  });
    gulp.watch(APP_DIR+ '/**/*.jade', ['html', reload]);
    gulp.watch(APP_DIR+ '/**/*.styl', ['dev-styles', reload]);
    gulp.watch(APP_DIR+ '/js/**/*.js', ['jshint']);
    gulp.watch(APP_DIR+ '/images/**/*', reload);
});


////////////////////////////////////////////////////////////////////////////////
/// MAIN TASKS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build', function(done) {
    runSequence(
        'clean',
        'html',
        ['prod-styles', 'images', 'compile-scripts'],
        'copy-extra-files',
        'build-modernizr'
    ,done);
});

gulp.task('development', function(done) {
    runSequence(
        'clean',
        'html',
        ['dev-styles', 'images', 'compile-scripts'],
        'copy-extra-files',
        'build-modernizr',
        'serve'
    ,done);
});



gulp.task('default', ['development']);
