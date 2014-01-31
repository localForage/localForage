/*global patchRequire*/
var require = patchRequire(require);
var utils = require('utils');
exports.hello = utils.format('hello, %s', require('./sub/mod').name);
