/*global casper*/
/*jshint strict:false*/
casper.test.begin('Casper.callUtils()', 2, function(test) {
    casper.start("tests/site/index.html", function(){
        this.evaluate(function() {
            /*global __utils__*/
            __utils__.testCallUtils = function() {
                return [].slice.call(arguments);
            };
        });

        test.assertEquals(casper.callUtils("testCallUtils", "a", "b", "c"),
                          ["a", "b", "c"],
                          "Casper.callUtils() invokes a client side utility");

        test.assertThrows(casper.callUtils, ["xxx", "a", "b", "c"],
            "Casper.callUtils() raises an error if used inappropriately");
    });

    casper.run(function() {
        test.done();
    });
});
