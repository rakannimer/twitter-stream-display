var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    jshint    = require('gulp-jshint'),
    concat    = require('gulp-concat'),
    uglify    = require('gulp-uglify'),
    rename    = require('gulp-rename'),
    minifyCSS = require('gulp-minify-css'),
    fs = require('fs'),
    nodemon = require('gulp-nodemon'),
    streamify = require('gulp-streamify'),
    stringify = require('stringify'),
    //exec = require('gulp-exec'),
    exec = require('child_process').exec,
    gulpSCP = require('gulp-scp'),
  	
    argv = require('yargs').argv,
    
    
    remoteHost = '188.226.154.63',
    username = 'root',
    port = 22,
    keyPath = '/Users/Apple/.ssh/id_rsa',
    branch = (argv.branch === undefined)?'master':argv.branch,
    
    ssh_config = "Host github.com \n \
    StrictHostKeyChecking no",
    gulpSSH = require('gulp-ssh')({
      ignoreErrors: false,
      sshConfig: {
        host: remoteHost,
        port: port,
        username: username,
        privateKey: require('fs').readFileSync(keyPath)
      }
    });


gulp.task('copy-creds',function(){
  
  gulp.src('public/app/js/creds.js')
        .pipe(gulpSCP({
            host: remoteHost,
            user: username,
            port: port,
            path: '/var/www/twitter-stream-display/public/app/js/'
        }));
  
  return gulp.src('server/creds.js')
        .pipe(gulpSCP({
            host: remoteHost,
            user: username,
            port: port,
            path: '/var/www/twitter-stream-display/server/'
    }));
});

gulp.task('copy-deployment-file', function(){
    return gulp.src('deploy/build_env.sh')
        .pipe(gulpSCP({
            host: remoteHost,
            user: username,
            port: port,
            path: '/'
    }));
});


gulp.task('build-remote',['copy-deployment-file'], function(){
  	return gulpSSH
      .shell(['bash /build_env.sh']).pipe(gulp.dest('logs'));
});


gulp.task('full-deploy', ['build-remote'], function() {
  gulp.start('deploy');
});

gulp.task('deploy', function() {

   return gulpSSH
    .shell([
      'cd /var/www/twitter-stream-display/',
      'git checkout '+branch,
      'git pull origin '+branch + ' && npm install ',
      'pm2 start -x ./server.js' 
    ])
    .pipe(gulp.dest('logs'));

});


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



gulp.task('nodemon',function() {
  return nodemon({
      script: './server.js',
      watch: [ "server/*"],
    });
});

gulp.task('db', function() {
  return exec('mongod --dbpath=/data/db --port 27017', function(err,stdout,stderr) {
      console.log(stdout);
      console.log(stderr);
    });
});

gulp.task('start', ['scripts', 'css', 'db'], function(){
  gulp.start('nodemon');
});


gulp.task('watch-all',['db'],function() {
  gulp.start('watch-scripts');
  gulp.start('nodemon');
});


gulp.task('watch-scripts', ['scripts','css'], function() {
  gulp.watch(['./public/app/js/*'], [ 'scripts']);
  gulp.watch(['./public/app/css/*'], ['css']);
});

gulp.task('start-prod',['db'],function(){
  exec('pm2 start -x ./server.js');
  gulp.start('build');
});

// Default Task
gulp.task('build', ['lint', 'css', 'scripts']);

