/*jshint strict:false*/
casper.test.begin('skipped test', 2, function(test) {
    test.skip(1);
    test.assert(true);
    test.done();
});
