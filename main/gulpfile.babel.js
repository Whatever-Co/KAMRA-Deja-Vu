/* global process */
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
const $ = loadPlugins()
import webpackStream from 'webpack-stream'
import webpack from 'webpack'
import browserSync from 'browser-sync'
import mergeStream from 'merge-stream'

let developmentMode = process.env.NODE_ENV == 'development'

gulp.task('webpack', () => {
  let config = {
    watch: developmentMode,
    entry: {
      bootstrap: './src/pc/bootstrap.js',
      app: './src/pc/page-manager.js',
      'sp/main': './src/sp/main.js'
    },
    output: {
      filename: '[name].js'
    },
    module: {
      // eslint-loader, import 文でエラー吐く...なんで..
      // preLoaders: [
      //   {test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'eslint-loader'}
      // ],
      loaders: [
        {test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel-loader'},
        {test: /\.json$/, loader: 'json-loader'},
        {test: /\.(vert|frag|glsl)$/, loaders:['raw-loader','glslify-loader']},
      ]
    },
    amd: {jQuery: true},
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV)
        }
      })
    ],
    // eslint: {
    //   fix: true,
    //   formatter: require('eslint-friendly-formatter')
    // }
    worker: {
      output: {
        filename: '[id].worker.js'
      }
    }
  }
  if (developmentMode) {
    config.devtool = 'inline-source-map'
  } else {
    config.plugins.push(
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.NoErrorsPlugin()
    )
  }
  return gulp.src('')
    .pipe(webpackStream(config, null, (err, stats) => {
      if (!err) {
        $.util.log(stats.toString({
          colors: $.util.colors.supportsColor,
          chunks: !developmentMode,
          chunkModules: !developmentMode
        }))
        browserSync.reload()
      }
    }))
    .pipe(gulp.dest('./public'))
})


const paths = {pc: '', sp: 'sp'}

gulp.task('jade', () => {
  let merged = new mergeStream()
  for (let key in paths) {
    let s = gulp.src(`./src/${key}/page/*.jade`)
      .pipe($.data(() => {
        return require(`./src/${key}/page/data.json`)
      }))
      .pipe($.jade({pretty: developmentMode}))
      .pipe(gulp.dest(`./public/${paths[key]}`))
      .pipe(browserSync.stream())
    merged.add(s)
  }
  return merged
})


gulp.task('stylus', () => {
  let merged = new mergeStream()
  for (let key in paths) {
    let s = gulp.src(`./src/${key}/page/*.styl`)
      .pipe($.stylus({compress: !developmentMode}))
      .pipe($.autoprefixer())
      .pipe(gulp.dest(`./public/${paths[key]}`))
      .pipe(browserSync.stream())
    merged.add(s)
  }
  return merged
})


gulp.task('watch', () => {
  gulp.watch('./src/**/*.jade', ['jade'])
  gulp.watch('./src/**/*.styl', ['stylus'])
  gulp.watch('./public/**/*.js', browserSync.reload)
})


gulp.task('server', () => {
  let server = require('gulp-live-server').new('dev-server.js')
  server.start()
  gulp.watch('dev-server.js', () => {
    server.start()
  })
})


gulp.task('browser-sync', () => {
  let gzipStatic = require('connect-gzip-static')
  browserSync.init({
    proxy: 'localhost:4000',
    middleware: gzipStatic('./public'),
    reloadDebounce: 200, 
    ghostMode: false,
    open: false,
  })
})

gulp.task('browser-sync-sp', () => {
  browserSync.init({
    server: {
      baseDir: ['./public']
    },
    open: false
  })
})


gulp.task('release', () => {
  developmentMode = false
  process.env.NODE_ENV = 'production'
})


gulp.task('default', ['webpack', 'jade', 'stylus', 'watch', 'server', 'browser-sync'])
gulp.task('sp', ['webpack', 'jade', 'stylus', 'watch', 'browser-sync-sp'])
gulp.task('build', ['release', 'webpack', 'jade', 'stylus'])
