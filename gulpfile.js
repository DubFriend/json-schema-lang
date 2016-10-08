'use strict';

const path = require('path');
const gulp = require('gulp');
const watch = require('gulp-watch');
const mocha = require('gulp-mocha');

gulp.task('default', () => {
    gulp.src('test/**/*.js', { read: false })
    .pipe(mocha({ reporter: 'nyan', timeout: 1000 }));
});

gulp.task('test', () => {
    gulp.src('test/**/*.js', { read: false })
    .pipe(mocha({ reporter: 'nyan', timeout: 1000 }));
});

gulp.task('watch', () => watch(
    ['src/**/*.js', 'test/**/*.js'],
    () => gulp.src('test/**/*.js', { read: false })
    .pipe(mocha({ reporter: 'nyan', timeout: 500 }))
));
