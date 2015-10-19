const gulp  = require('gulp');
const $     = require('gulp-load-plugins')();

let release = false;
process.env.NODE_ENV = 'development';

//====================
gulp.task('webpack', ()=>{
  const webpack = require('webpack');
  const config = {
    entry:'./src/main.js',
    output: {
      filename:'./dist/bundle.js'
    },
    resolve:{
      extensions: ['', '.js', '.json']
    },
    module:{
      loaders: [
        {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
        {test: /\.json$/, loader: "json-loader"},
        {test: /\.glsl$/, loader: "raw-loader"}
      ]
    },
    plugins:[
      new webpack.DefinePlugin({
        "process.env":{
          NODE_ENV: JSON.stringify(process.env.NODE_ENV)
        }
      })
    ]
  };

  if (release) {
    config.plugins.push(
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.NoErrorsPlugin()
    );
  } else {
    config.devtool = 'inline-source-map';
  }

  gulp.src('')
    .pipe($.webpack(config))
    .pipe(gulp.dest(''));
});

//====================
gulp.task('jade', ()=> {
  gulp.src('src/index.jade')
    .pipe($.data((file)=> {
      return require('./src/index_data.json');
    }))
    .pipe($.jade({pretty:!release}))
    .pipe(gulp.dest('./dist'));
});

//====================
gulp.task('stylus', ()=>{
  gulp.src('src/main.styl')
    .pipe($.stylus({
      compress: release
    }))
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist/'));
});

//====================
gulp.task('serve', ()=>{
  gulp.src('dist')
    .pipe($.webserver({
      livereload: true,
      open: true
    }));
});

//====================
gulp.task('lint', ()=>{
  gulp.src('src/**/*.js')
    .pipe($.eslint({useEslintrc: true}))
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

//====================
gulp.task('release', ()=>{
  release = true;
  process.env.NODE_ENV = 'production';
});

//====================
gulp.task('watch', ()=>{
  gulp.watch(['src/**/*.js', 'src/**/*.json', 'src/**/*.glsl'], ['webpack']);
  gulp.watch(['src/**/*.jade', 'src/index_data.json', 'src/**/*.svg'], ['jade']);
  gulp.watch('src/**/*.styl', ['stylus']);
});

//====================
gulp.task('default', ['jade','stylus','webpack', 'serve', 'watch']);
gulp.task('build', ['release', 'jade', 'stylus', 'webpack']);
