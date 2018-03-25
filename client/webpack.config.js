/*
    ./webpack.config.js
*/
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin');


const HTMLIndex = new HtmlWebpackPlugin({
  template: './example/index.html',
  chunks: ['example'],

  filename: 'index.html',
  inject: 'body',
});


module.exports = {
  devtool: 'source-map',

  entry: {
    'mongo-realtime': './src/browser.js',
    'mongo-realtimeui': './src/ui/browser.js',
    example: './example/index.js',
  },
  output: {
    path: path.resolve('dist'),
    publicPath: '/',
    // filename: 'dist/bundle.js'
    filename: '[name].js?',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },

    ],
  },
  plugins: [
    HTMLIndex,
    // new UglifyJsPlugin({ sourceMap: true }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },

};
