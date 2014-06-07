// include gulp
var gulp = require('gulp'); 
 
// include plug-ins
var jshint = require('gulp-jshint');
var notify = require("gulp-notify");
var mocha = require('gulp-mocha');

//TODO: notifications on error https://gist.github.com/rudijs/9148283


// default gulp task
gulp.task('default', ['jshint-client','jshint-server','test-server','watch'], function() {
});

 
// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('./app/public/js/*.js', ['jshint-client']);
    gulp.watch(['./app/*.js','test/test-server.js'], ['jshint-server','test-server']);
});
 
gulp.task('test-server', function() {
    gulp.src(['test/test-*.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        })).on('error', function(){});
});


gulp.task('jshint-client', function() {
  gulp.src('./app/public/js/*.js')
    .pipe(jshint())
   // .pipe(notify("Success"))
    .pipe(jshint.reporter('default'));

}); 

// JS hint task
gulp.task('jshint-server', function() {
  gulp.src('./app/*.js')
    .pipe(jshint())
  //  .pipe(notify("Success"))
    .pipe(jshint.reporter('default'));
});