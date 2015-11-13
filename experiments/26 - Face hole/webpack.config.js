/*global module*/

var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: './public',
    filename: 'bundle.js'
  },
  module: {
    // preLoaders: [
    //   { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'eslint' }
    // ],
    loaders: [
      { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel-loader' },
      { test: /\.sass$/, loaders: ['style-loader', 'css-loader', 'autoprefixer-loader', 'sass-loader?indentedSyntax'] },
      { test: /\.jade$/, loader: 'jade-loader?self' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.(vert|frag)$/, loader: 'raw-loader' }
    ]
  },
  amd: { jQuery: true },
  plugins: [
    new BrowserSyncPlugin({
      server: { baseDir: ['./public'] },
      open: false
    })
  ],
  eslint: {
    fix: true,
    formatter: require('eslint-friendly-formatter'),
    failOnError: true
  }
};
