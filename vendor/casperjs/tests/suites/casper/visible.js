/*global casper*/
/*jshint strict:false*/
casper.test.begin('visibility tests', 5, function(test) {
    casper.start('tests/site/visible.html', function() {
        test.assert(!this.visible('#img1'), 'Casper.visible() can detect if an element is invisible');
        test.assert(this.visible('#img2'), 'Casper.visible() can detect if an element is visible');
        test.assert(!this.visible('#img3'), 'Casper.visible() can detect if an element is invisible');
        test.assert(this.visible('img'), 'Casper.visible() can detect if an element is visible');
        this.waitWhileVisible('#img1', function() {
            test.pass('Casper.waitWhileVisible() can wait while an element is visible');
        }, function() {
            test.fail('Casper.waitWhileVisible() can wait while an element is visible');
        }, 2000);
    });

    casper.run(function() {
        test.done();
    });
});
