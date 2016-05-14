// This is CommonJS because lie is an external dependency, so Rollup
// can just ignore it.
if (typeof Promise === 'undefined' && typeof require !== 'undefined') {
    require('lie/polyfill');
}
export default Promise;
