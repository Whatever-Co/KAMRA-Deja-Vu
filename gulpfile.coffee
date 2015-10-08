
gulp    = require 'gulp'
$       = require('gulp-load-plugins')()

release = false
process.env.NODE_ENV = 'development'

#====================
gulp.task 'webpack', ->
  webpack = require 'webpack'
  config =
    entry:'./src/main.js'
    output:
      filename:'./dist/bundle.js'
    resolve:
#      extensions: ['', '.js', '.json', '.coffee']
      extensions: ['', '.js', '.json']
    module:
      loaders: [
        {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
#        {test: /\.coffee$/, exclude: /node_modules/, loader: "coffee-loader"}
        {test: /\.json$/, loader: "json-loader"}
      ]
    plugins:[
      new webpack.DefinePlugin
        "process.env":
          NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    ]

  if release
    config.plugins.push(
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.NoErrorsPlugin()
    )
  else
    config.devtool = 'inline-source-map'

  gulp.src ''
    .pipe $.webpack config
    .pipe gulp.dest ''


#====================
gulp.task 'jade', ->
  gulp.src 'src/index.jade'
    .pipe $.data (file)->
      return require('./src/index_data.json')
    .pipe($.jade(pretty: not release))
    .pipe gulp.dest './dist'

#====================
gulp.task 'stylus', ->
  gulp.src 'src/main.styl'
    .pipe $.stylus {
      compress: release
    }
    .pipe($.autoprefixer())
    .pipe gulp.dest 'dist/'

#====================
gulp.task 'serve', ->
  gulp.src 'dist'
    .pipe $.webserver {
      livereload: true
      open: true
    }

#====================
gulp.task 'lint', ->
  gulp.src 'src/**/*.coffee'
    .pipe($.coffeelint())
    .pipe($.coffeelint.reporter())

#====================
gulp.task 'release', ->
  release = true
  process.env.NODE_ENV = 'production'

#====================
gulp.task 'zip', ['build'], ->
  today = new Date()
  month = "0#{today.getMonth()+1}".slice(-2)
  date = "0#{today.getDate()}".slice(-2)
  gulp.src(['dist/**'])
  .pipe($.zip("./build/kch-#{month}#{date}.zip"))
  .pipe(gulp.dest('.'))

#====================
gulp.task 'watch', ->
  gulp.watch ['src/**/*.js', 'src/**/*.json'], ['webpack']
  gulp.watch ['src/**/*.jade', 'src/index_data.json', 'src/**/*.svg'], ['jade']
  gulp.watch 'src/**/*.styl', ['stylus', 'webpack'] # update javascript for skrollr.

#====================
gulp.task 'default', ['jade', 'stylus', 'webpack', 'serve', 'watch']
gulp.task 'build', ['release', 'jade', 'stylus', 'webpack']