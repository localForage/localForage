const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const projectPath = path.resolve(fs.realpathSync(process.cwd()), '.');
const srcPath = path.resolve(fs.realpathSync(process.cwd()), 'src');

const config = {
  entry: ['./src/localforage.js'],
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      // Transform ES6 with Babel
      {
        test: /\.(js)$/,
        include: [srcPath],
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: true,
              cacheDirectory: true,
              presets: [],
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  output: {
    auxiliaryComment: `
/*!
  localForage -- Offline Storage, Improved
  Version 1.7.3
  https://localforage.org
  (c) 2019 Matthew Riley MacPherson and Thodoris Greasidis, Apache License 2.0
  Previous versions (c) 2013 Mozilla, Apache License 2.0
*/
`,
    filename: 'localforage.js',
    libraryTarget: 'umd',
    library: 'localforage',
    path: path.join(__dirname, 'dist'),
  },
  plugins: [
    // new webpack.DefinePlugin({
    //   ENV: JSON.stringify(process.env.NODE_ENV),
    //   USE_ANALYTICS: JSON.stringify(process.env.NODE_ENV === 'production'),
    // }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
  resolve: {
    // Add src/ folder for easier includes within the project.
    modules: [srcPath, projectPath, 'node_modules'],
    extensions: ['.js', '.json'],
  },
};

if (process.env.NODE_ENV === 'production') {
  config.devtool = 'source-map';
  config.optimization.minimize = true;
} else {
  config.devtool = 'eval-source-map';
}

module.exports = config;
