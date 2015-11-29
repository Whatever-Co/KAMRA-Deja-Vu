/*global module*/

var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: './public',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  amd: { jQuery: true },
  plugins: [
    new BrowserSyncPlugin({
      server: {
        baseDir: ['./public']
      },
      middleware: require('connect-gzip-static')('./public'),
      open: false
    })
  ],
  worker: {
    output: {
      filename: '[id].worker.js'
    }
  }
};
