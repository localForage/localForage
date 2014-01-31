var casper = require('casper').create();
var mod = require('./mod');
console.log(mod.hello);
casper.exit();
