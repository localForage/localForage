const config = {
  comments: true,
  presets: ['@babel/preset-env', ['@babel/typescript', { allExtensions: true, isTSX: false }]],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
  ],
};

module.exports = config;
