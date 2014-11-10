// GulpJS Documentation -> http://goo.gl/woLzJq
//
////////////////////////////////////////////////////////////////////////////////
//  GULP PLUGINS
////////////////////////////////////////////////////////////////////////////////
//
// [1] gulp-load-plugins : Load all gulp plugins automatically and attach them
//                         to the `plugins` object.
// [2] run-sequence      : Temporary solution until gulp 4.
//                         https://github.com/gulpjs/gulp/issues/355
// see package.json file for more plugins
////////////////////////////////////////////////////////////////////////////////

'use strict';


var gulp        = require('gulp');
var plugins     = require('gulp-load-plugins')(); //[1]
var runSequence = require('run-sequence');//[2]
var pkg         = require('./package.json');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var APP_DIR         = 'app';
var BUILD_DIR       = 'dist';




////////////////////////////////////////////////////////////////////////////////
/// STYLESHEETS
////////////////////////////////////////////////////////////////////////////////

gulp.task('dev-styles', function() {
    return gulp.src(APP_DIR+ '/styl/app.styl')
        .pipe(plugins.stylus({
            sourcemap: {
                inline: true
            }
        }))
        .pipe(plugins.pleeease({
            minifier: false
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css'));
});

gulp.task('prod-styles', function() {
    return gulp.src(APP_DIR+ '/styl/app.styl')
        .pipe(plugins.stylus())
        .pipe(plugins.pleeease({
            minifier: true
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css'));
});



////////////////////////////////////////////////////////////////////////////////
/// SCRIPTS
////////////////////////////////////////////////////////////////////////////////

gulp.task('jshint', function () {
  return gulp.src(APP_DIR+ '/js/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.if(!browserSync.active, plugins.jshint.reporter('fail')));
});

// Lint JS then copy it to build directory
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
    return gulp.src('app/**/*.{png,jpg,svg}')
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
gulp.task('templates', function() {
  var YOUR_LOCALS = {};

  gulp.src(APP_DIR+ '/patterns/pages/**/*.jade')
    .pipe(plugins.jade({
      locals: YOUR_LOCALS
    }))
    .pipe(gulp.dest(BUILD_DIR));
});



// Copy Other Files
gulp.task('copy', function() {
    gulp.src([
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
    gulp.watch(APP_DIR+ '/**/*.jade', ['templates', reload]);
    gulp.watch(APP_DIR+ '/styl/**/*.{styl,css}', ['prod-styles', reload]);
    gulp.watch(APP_DIR+ '/js/**/*.js', ['jshint']);
    gulp.watch(APP_DIR+ '/images/**/*', reload);
});


////////////////////////////////////////////////////////////////////////////////
/// MAIN TASKS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build', function(done) {
    runSequence(
        'clean',
        ['prod-styles', 'compile-scripts', 'images', 'templates', 'copy'],
    done);
});

gulp.task('development', function(done) {
    runSequence(
        'clean',
        ['dev-styles', 'compile-scripts', 'images', 'templates', 'copy'],
        'serve',
    done);
});



gulp.task('default', ['development']);