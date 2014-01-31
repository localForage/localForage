/*jshint strict:false*/
casper.test.begin('step throws', 1, function(test) {
    casper.start();
    casper.then(function() {
        throw new Error('oops!')
    });
    casper.run(function() {
        test.done();
    })
});
