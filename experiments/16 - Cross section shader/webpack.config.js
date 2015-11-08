var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: './public',
    filename: 'bundle.js'
  },
  module: {
    preLoaders: [
      { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'eslint' }
    ],
    loaders: [
      { test: /\.js$/, exclude: /node_modules|web_modules/, loader: 'babel' },
      { test: /\.sass$/, loaders: ['style', 'css', 'autoprefixer', 'sass?indentedSyntax'] },
      { test: /\.jade$/, loader: 'jade?self' },
      { test: /\.json$/, loader: 'json' },
      { test: /\.(vert|frag)$/, loader: 'raw' }
    ]
  },
  amd: { jQuery: true },
  plugins: [
    new BrowserSyncPlugin({
      server: { baseDir: ['./public'] },
      open: false,
      notify: false
    })
  ],
  eslint: {
    fix: true,
    formatter: require('eslint-friendly-formatter'),
    failOnError: true
  }
};