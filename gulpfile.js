const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const del = require('del');
const zip = require('gulp-zip');

const OUTPUT_DIR_WEB_EXTENSION = 'build/'; // chrome & firefox
const OUTPUT_DIR_SAFARI = 'safari/Botcheck for Twitter/build/';

const paths = {
  scripts: {
    src: [
      'src/content/namespace.js',
      'src/vendor/browser-polyfill.js',
      'src/vendor/vue.js',
      'src/vendor/vuex.js',
      'src/vendor/element.js',
      'src/vendor/axios.js',
      'src/vendor/lockr.js',
      'src/content/util.js',
      'src/content/xbrowser.js',
      'src/content/components/botcheck-status.js',
      'src/content/components/dialog-results.js',
      'src/content/components/dialog-thanks.js',
      'src/content/store.js',
      'src/content/scanner.js',
      'src/content/index.js'
    ],
  },
  styles: {
    src: [
      'src/styles/element.css',
      'src/styles/botcheck.less'
    ],
  }
};

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
function clean() {
  // You can use multiple globbing patterns as you would with `gulp.src`,
  // for example if you are using del 2.0 or above, return its promise
  return del([OUTPUT_DIR_WEB_EXTENSION, OUTPUT_DIR_SAFARI]);
}

/*
 * Define our tasks using plain functions
 */

function copy() {
  // Copy these folders and contents as is
  gulp.src([
    'src/background/**',
    'src/content/**',
    'src/popup/**',
    'src/styles/**',
    'src/vendor/**'], {base: 'src'})
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION));

  // Compile less into css
  gulp.src('src/**/*.less', {base: 'src'})
    .pipe(less())
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION));

  // Copy manifest
  gulp.src('src/manifest.json')
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION));

  // Copy icons over
  return gulp.src('src/icons/**')
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION + 'icons'))
    .pipe(gulp.dest(OUTPUT_DIR_SAFARI + 'icons'));
}


function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(less())
    .pipe(concat('injected.css'))
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION))
    .pipe(gulp.dest(OUTPUT_DIR_SAFARI));
}

function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(concat('injected.js'))
    .pipe(gulp.dest(OUTPUT_DIR_WEB_EXTENSION))
    .pipe(gulp.dest(OUTPUT_DIR_SAFARI));
}

function watch() {
  return gulp.watch('src', build);
}

/*
 * Build distributable ZIP file for uploading to chrome/firefox extension stores
 */
function dist() {
  let manifest = require('./src/manifest.json'),
      distFileName = manifest.name + ' v' + manifest.version + '.zip';

  return gulp.src(['build/**'])
    .pipe(zip(distFileName))
    .pipe(gulp.dest('dist'));
}

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
let build = gulp.series(clean, gulp.parallel(copy, scripts, styles));

gulp.task('clean', clean);
gulp.task('styles', styles);
gulp.task('scripts', scripts);
gulp.task('build', build);
gulp.task('watch', gulp.series(build, watch));
gulp.task('dist', gulp.series(build, dist));

/*
 * Define default task that can be called by just running `gulp` from cli
 */
gulp.task('default', build);