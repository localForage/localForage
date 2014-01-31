/*global casper*/
/*jshint strict:false*/
casper.test.begin("Basic resources tests", 5, function(test) {
  casper.start("tests/site/resources.html", function() {
    test.assertEquals(this.resources.length, 1, "only one resource found");
  });

  casper.waitForResource("dummy.js", function() {
    test.assertEquals(this.resources.length, 2, "two resources found");
    test.assertResourceExists(/dummy\.js/i, "phantom image found via test RegExp");
    test.assertResourceExists(function(res) {
      return res.url.match("dummy.js");
    }, "phantom image found via test Function");
    test.assertResourceExists("dummy.js", "phantom image found via test String");
  }, function onTimeout() {
    test.fail("waitForResource timeout occured");
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin('"resource.error" event', 3, function(test) {
    casper.on("resource.error", function(error) {
        test.assertType(error, "object", '"resource.error" triggered error information');
        test.assert(error.errorCode === 203, '"resource.error" error code is correct');
        test.assertMatch(error.url, /non-existant\.html$/, '"resource.error" url is correct');
    });

    casper.start('tests/site/non-existant.html').run(function() {
        casper.removeAllListeners("resource.error");
        test.done();
    });
});
