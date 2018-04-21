import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'test/**/test.unit.*.js',
  plugins: [
    babel({
      babelrc: false
    }),
    multiEntry()
  ],
  output: {
    file: 'build/test/test-bundle.js',
    format: 'cjs'
  }
};
