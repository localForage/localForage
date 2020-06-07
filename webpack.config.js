const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const config = {
  // context: path.resolve(__dirname, 'src'),
  entry: {
    localForage: './src/index.ts',
  },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      // Transform ES6 with Babel
      {
        test: /\.(ts|tsx|js|jsx|mjs)$/,
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
    filename: 'localforage.js',
    path: path.join(__dirname, 'dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      ENV: JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.mjs', '.jsx', '.js', '.json'],
  },
  watch: true,
};

if (process.env.NODE_ENV === 'production' && !process.env.DISABLE_PEER_DEPS_PLUGIN) {
  config.plugins.push(new PeerDepsExternalsPlugin());
}

module.exports = config;
