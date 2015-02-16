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
var critical    = require('critical');
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
gulp.task('css-styl', function() {
    return gulp.src([APP_DIR+ '/css/styl/**/*.styl'])
        .pipe(plugins.stylus({
            use: koutoSwiss(),
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css/'));
});

// Remove unused CSS
gulp.task('css-uncss', function() {
    return gulp.src([BUILD_DIR+ '/css/*.css'])
        .pipe(plugins.uncss({
            html: glob.sync(BUILD_DIR+ '/**/*.html')
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css/'));
});

// Lint CSS
gulp.task('css-lint', function() {
    return gulp.src([BUILD_DIR+ '/css/*.css'])
        .pipe(plugins.csslint())
        .pipe(plugins.csslint.reporter())
        .pipe(gulp.dest(BUILD_DIR+ '/css/'));
});

// Generating and inlining critical-path CSS
// -----------------------------------------
// Copy our site styles to a site.css file
// for async loading later
gulp.task('css-copystyles', function () {
    return gulp.src([BUILD_DIR+ '/css/style.css'])
        .pipe(plugins.rename({
            basename: "site"
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css'));
});
gulp.task('css-critical', ['css-copystyles'], function () {
    // At this point, we have our
    // production styles in css/styles.css
    // As we're going to overwrite this with
    // our critical-path CSS let's create a copy
    // of our site-wide styles so we can async
    // load them in later. We do this with
    // 'copystyles' above
    critical.generate({
        base: 'dist/',
        src: 'index.html',
        dest: 'css/site.css',
        width: 320,
        height: 480,
        minify: true
    }, function(err, output){
        critical.inline({
            base: 'dist/',
            src: 'index.html',
            dest: 'index-critical.html',
            minify: true
        });
    });
});


// CSS MAIN TASK
// Development
gulp.task('css-dev', function() {
    return gulp.src([
            APP_DIR+ '/css/styl/*.styl'
        ])
        .pipe(plugins.stylus({
            use: koutoSwiss(),
        }))
        .pipe(gulp.dest(BUILD_DIR+ '/css/'));
});
// Production
gulp.task('css-prod', function() {
    return gulp.src([
            APP_DIR+ '/css/styl/*.styl'
        ])
        .pipe(plugins.stylus({
            use: koutoSwiss(),
        }))
        .pipe(plugins.pleeease({
            browsers: AUTOPREFIXER_BROWSERS,
            minifier: false
        }))
        .pipe(plugins.minifyCss())
        .pipe(gulp.dest(BUILD_DIR+ '/css/'));
});





////////////////////////////////////////////////////////////////////////////////
/// SCRIPTS
////////////////////////////////////////////////////////////////////////////////

// Merge all scripts into one
gulp.task('js-concat', function() {
    return gulp.src([
        APP_DIR+ '/js/vendor/**/*.js',
        // '../bower_components/',
        APP_DIR+ '/js/app.js',
    ])
    .pipe(plugins.concat('app.js'))
    .pipe(gulp.dest(BUILD_DIR+ '/js/'));
});

// Build Custom modernizr.js for better performance
gulp.task('js-modernizr', function() {
  gulp.src([BUILD_DIR+ '/js/app.js', BUILD_DIR+ '/css/styles.css'])
    .pipe(plugins.modernizr())
    .pipe(gulp.dest(BUILD_DIR+ '/js/'))
});

//
gulp.task('js-hint', function () {
  return gulp.src(APP_DIR+ '/js/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.if(!browserSync.active, plugins.jshint.reporter('fail')));
});

// Minify for Production
gulp.task('js-minify', function() {
    return gulp.src([BUILD_DIR+ '/js/app.js'])
        .pipe(plugins.uglify())
        .pipe(gulp.dest(BUILD_DIR+ '/js'));
});


// JS MAIN TASK
gulp.task('js-dev', ['js-concat', ]);
gulp.task('js-prod', ['js-concat', 'js-minify']);





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
    return gulp.src(APP_DIR+ '/html/pages/**/*.twig')
        .pipe(plugins.twig({
            // data: {}
        }))
        .pipe(gulp.dest(BUILD_DIR));
});





////////////////////////////////////////////////////////////////////////////////
/// COPY
////////////////////////////////////////////////////////////////////////////////

gulp.task('copy-fonts', function() {
    return gulp.src(APP_DIR+ '/fonts/**/*')
        .pipe(gulp.dest(BUILD_DIR+ '/fonts'));
});

// Copy Extra Files
gulp.task('copy-extra-files', ['copy-fonts'], function() {
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
    gulp.watch(APP_DIR+ '/html/**/*.twig', ['html', reload]);
    gulp.watch(APP_DIR+ '/css/**/*.styl', ['css-dev', reload]);
    gulp.watch(APP_DIR+ '/js/**/*.js', ['js-dev', reload]);
});





////////////////////////////////////////////////////////////////////////////////
/// MAIN TASKS
////////////////////////////////////////////////////////////////////////////////
// Development
gulp.task('dev', function(done) {
    runSequence(
        'clean',
        ['html', 'css-dev', 'js-dev'],
        'copy-extra-files',
        'serve'
    ,done);
});
// Production
gulp.task('prod', function(done) {
    runSequence(
        'clean',
        ['html', 'css-prod', 'js-prod'],
        'copy-extra-files'
    ,done);
});

gulp.task('default', ['dev']);
gulp.task('build', ['prod']);

// EXTRA TASK
gulp.task('bc', ['css-critical']) // build critical css path
gulp.task('uc', ['css-uncss']) // Remove unused css selector
gulp.task('cl', ['css-lint']) // Remove unused css selector
gulp.task('bm', ['js-modernizr']); // build modernizr
gulp.task('img', ['images']); // compress images

