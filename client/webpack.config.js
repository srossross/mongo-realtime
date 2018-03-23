/*
    ./webpack.config.js
*/
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// const isDebug = process.env.NODE_ENV !== 'production';


module.exports = {
  devtool: 'source-map',

  entry: {
    'mongo-realtime': './src/browser.js',
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
    ],
  },
  plugins: [
    new UglifyJsPlugin({ sourceMap: true }),
  ],
  resolve: {
    extensions: ['.js'],
  },

};
