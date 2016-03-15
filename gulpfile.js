'use strict';
const gulp 							= require('gulp');
const sourcemaps 				= require('gulp-sourcemaps');
const source 						= require('vinyl-source-stream');
const buffer 						= require('vinyl-buffer');
const browserify				= require('browserify');
const watchify					= require('watchify');
const babelify					= require('babelify');

const paths = {
  src: './src',
  entryPoint: 'app.js',
  dest: 'build/js'
};

const compile = function(watch) {
  const bundler = watchify(browserify(paths.src + '/' + paths.entryPoint, { debug: true }).transform(babelify));

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
