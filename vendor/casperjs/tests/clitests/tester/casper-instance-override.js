// this should never happen
// http://docs.casperjs.org/en/latest/testing.html#test-command-args-and-options
var casper = require("casper").create();

casper.test.begin("foo", function(test) {
  "use strict";
  test.assert(true);
  test.done();
});
