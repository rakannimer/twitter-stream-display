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

  return gulp.src([ './node_modules/bootstrap/dist/css/bootstrap.css','./node_modules/mapbox.js/theme/style.css','./node_modules/toastr/toastr.css','./public/app/css/*.css'])
    .pipe(concat('app.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/app/'));
});



// Concatenate & Minify JS
gulp.task('scripts', function() {

  browserify({entries:['./node_modules/toastr/toastr.js'], debug:true})
                .transform('debowerify')
                .bundle()
                .pipe(source('toastr.min.js'))
                .pipe(gulp.dest('./node_modules/toastr/'));
  

    return browserify({entries:['./public/app/js/client.js','./node_modules/toastr/toastr.min.js'], debug:true})
                .transform(stringify(['.html']))
                .bundle()
                .pipe(source('app.min.js'))
                .pipe(gulp.dest('./public/app/'));

});


gulp.task('watch-all',function() {
  gulp.start('watch-scripts');
  //exec('mongod');
  gulp.start('nodemon');
});

gulp.task('nodemon',function() {
  var called = false;
  return nodemon({
      script: './server.js',
      watch: [ "server/*"],
    })
});

gulp.task('db', function() {
  return exec('mongod --dbpath=/data/db --port 27017', function(err,stdout,stderr) {
      console.log(stdout);
      console.log(stderr);
    });
});

gulp.task('start', ['scripts', 'css', 'db'], function(){

  gulp.start('nodemon');
  //gulp.src('app')
 //   .pipe();
});




gulp.task('watch-scripts', ['scripts','css'], function() {
  gulp.watch(['./public/app/js/*'], [ 'scripts']);
  gulp.watch(['./public/app/css/*'], ['css']);
});


// Default Task
gulp.task('build', ['lint', 'css', 'scripts']);