'use strict';
const gulp 							= require('gulp');
const sourcemaps 				= require('gulp-sourcemaps');
const source 						= require('vinyl-source-stream');
const buffer 						= require('vinyl-buffer');
const browserify				= require('browserify');
const watchify					= require('watchify');
const babelify					= require('babelify');
const brfs              = require('brfs');

const paths = {
  src: './frontend',
  entryPoint: 'app.js',
  dest: 'assets/js'
};

const compile = function(watch) {
  let br = browserify('./frontend/app.js', { debug: true });
  let bundler;

  br.transform(babelify);
  br.transform(brfs);
  bundler = watchify(br);

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source(paths.entryPoint))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.dest));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
};

const watch = function() {
  return compile(true);
};

gulp.task('watch:browserify', function() {
	return watch();
});

gulp.task('watch', [
	'watch:browserify'
]);

gulp.task('build', function() {
	return compile();
});

gulp.task('default', ['watch']);
