var webpack = require('webpack');
var baseConfig = require('./webpack.config.base.js');

var config = Object.create(baseConfig);
config.devtool = 'source-map';
config.plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  new webpack.optimize.UglifyJsPlugin({
    compressor: { warnings: false },
  }),
];

module.exports = config;
