import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
const $ = loadPlugins()
import webpack from 'webpack-stream'
import browserSync from 'browser-sync'


gulp.task('webpack', () => {
  return gulp.src('')
    .pipe(webpack({
      watch: true,
      entry: {
        main: './src/main.js'
      },
      output: {
        filename: '[name].js'
      },
      module: {
        preLoaders: [
          { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'eslint' }
        ],
        loaders: [
          { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel' },
          { test: /\.png$/, loader: 'url?limit=5000' },
          { test: /\.json$/, loader: 'json' },
          { test: /\.(vert|frag)$/, loader: 'raw' }
        ]
      },
      amd: { jQuery: true },
      eslint: {
        fix: true,
        formatter: require('eslint-friendly-formatter')
      }
    }))
    .pipe(gulp.dest('public'))
    .pipe(browserSync.stream())
})


gulp.task('jade', () => {
  return gulp.src('./src/hoge.jade')
    .pipe($.jade())
    .pipe(gulp.dest('public'))
    .pipe(browserSync.stream())
})


gulp.task('stylus', () => {
  return gulp.src('./src/aaaa.styl')
    .pipe($.stylus())
    .pipe($.autoprefixer())
    .pipe(gulp.dest('public'))
    .pipe(browserSync.stream())
})


gulp.task('watch', () => {
  gulp.watch('src/*.jade', ['jade'])
  gulp.watch('src/*.styl', ['stylus'])
})


gulp.task('browser-sync', () => {
  browserSync.init({
    host: 'localhost',
    port: 3000,
    server: { baseDir: ['./public'] },
    open: false
  })
})


gulp.task('default', ['webpack', 'jade', 'stylus', 'watch', 'browser-sync'])
