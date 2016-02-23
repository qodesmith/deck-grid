var gulp   = require('gulp');
var less   = require('gulp-less');
var prefix = require('gulp-autoprefixer');

gulp.task('less', function() {
  return gulp.src('styles.less')
    .pipe(less())
    .pipe(prefix({browsers: ['last 2 versions', 'Explorer > 9']})) // browserslist: https://github.com/ai/browserslist
    .pipe(gulp.dest(''))
});

gulp.task('default', ['less'], function() {
  gulp.watch('styles.less', ['less']);
});