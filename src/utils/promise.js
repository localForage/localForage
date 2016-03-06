// This is CommonJS because lie is an external dependency, so Rollup
// can just ignore it.
export default (typeof Promise === 'function' ? Promise : require('lie'));
