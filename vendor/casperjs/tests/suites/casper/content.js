/*global casper*/
/*jshint strict:false*/
var fs = require("fs");

casper.test.begin("Casper.getPageContent() text/html content", 1, function(test) {
  casper.start("tests/site/test.html", function() {
    test.assertMatch(this.getPageContent(), /<title>CasperJS test target/,
                      "Casper.getPageContent() retrieves text/html content");
  }).run(function() {
    test.done();
  });
});

casper.test.begin("Casper.getPageContent() non text/html content", 1, function(test) {
  casper.start("tests/site/dummy.js", function() {
    test.assertEquals(this.getPageContent(), "document.write('foo');",
                      "Casper.getPageContent() retrieves non text/html content");
  }).run(function() {
    test.done();
  });
});
