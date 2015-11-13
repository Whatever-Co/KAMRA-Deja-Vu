/*global module*/

var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var gzipStatic = require('connect-gzip-static');

module.exports = {
  entry: {
    main: './src/main.js',
  },
  output: {
    path: './public',
    filename: '[name].js',
  },
  module: {
    preLoaders: [
      {test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'eslint'}
    ],
    loaders: [
      {test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel'},
      {test: /\.sass$/, loaders: ['style', 'css', 'autoprefixer', 'sass?indentedSyntax']},
      {test: /\.jade$/, loader: 'jade?self'},
      {test: /\.json$/, loader: 'json'},
      {test: /\.(vert|frag)$/, loaders: ['raw', 'glslify']}
    ]
  },
  amd: { jQuery: true },
  plugins: [
    new BrowserSyncPlugin({
      server: { baseDir: ['./public']},
      open: false
    }, {
      callback: (err, bs) => {
        bs.addMiddleware('*', gzipStatic('./public'));
      }
    })
  ],
  eslint: {
    fix: true,
    formatter: require('eslint-friendly-formatter'),
    failOnError: true
  }
};
