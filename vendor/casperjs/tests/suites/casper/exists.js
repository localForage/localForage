/*global casper*/
/*jshint strict:false*/
casper.test.begin('exists() tests', 2, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assert(this.exists('a'), 'Casper.exists() can check if an element exists');
        test.assertNot(this.exists('chucknorriz'), 'Casper.exists() can check than an element does not exist')
    }).run(function() {
        test.done();
    });
});
