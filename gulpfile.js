var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var jshint    = require('gulp-jshint');
var concat    = require('gulp-concat');
var uglify    = require('gulp-uglify');
var rename    = require('gulp-rename');
var minifyCSS = require('gulp-minify-css');
var fs = require('fs');
var nodemon = require('gulp-nodemon');
var streamify = require('gulp-streamify');
var stringify = require('stringify');
//var exec = require('gulp-exec');
var exec = require('child_process').exec;


// Lint Task
gulp.task('lint', function() {
  return gulp.src('./public/app/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our CSS
gulp.task('css', function() {

  return gulp.src(['./public/app/css/*.css','./node_modules/mapbox.js/theme/style.css', './node_modules/bootstrap/dist/css/bootstrap.css'])
    .pipe(concat('app.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/app/'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {

    return browserify({entries:'./public/app/js/client.js', debug:true})
                .transform(stringify(['.html']))
                .bundle()
                .pipe(source('app.min.js'))
                .pipe(gulp.dest('./public/app/'));

});

var launchNodemon = function(){
  nodemon({
    script: './server/app.js',
     ignore: [ "public/*"],
  });
};

gulp.task('watch-all',function() {
  gulp.start('watch-scripts');
  exec('mongod');
  launchNodemon();
});

gulp.task('start', function(){
  gulp.start('scripts');
  gulp.start('css');
//  exec('mongod');
  exec('mongod --dbpath=/data/db --port 27017', function(err,stdout,stderr) {
    console.log(stdout);
    console.log(stderr);
  });
  launchNodemon();

});

gulp.task('watch-scripts', function() {
  gulp.start('scripts');
  gulp.start('css');
  gulp.watch(['./public/app/js/*'], [ 'scripts']);
  gulp.watch(['./public/app/css/*'], ['css']);
});


// Default Task
gulp.task('build', ['lint', 'css', 'scripts']);