/*global casper, __utils__*/
/*jshint strict:false*/
casper.test.begin('handling frames', 16, function(test) {
    casper.start('tests/site/frames.html');

    casper.withFrame('frame1', function() {
        test.assertTitle('CasperJS frame 1');
        test.assertExists("#f1");
        test.assertDoesntExist("#f2");
        test.assertEval(function() {
            return '__utils__' in window && 'getBinary' in __utils__;
        }, '__utils__ object is available in child frame');
        test.assertMatches(this.page.frameContent, /This is frame 1/);
        test.assertMatches(this.getHTML(), /This is frame 1/);
    });

    casper.withFrame('frame2', function() {
        test.assertTitle('CasperJS frame 2');
        test.assertExists("#f2");
        test.assertDoesntExist("#f1");
        test.assertEval(function() {
            return '__utils__' in window && 'getBinary' in __utils__;
        }, '__utils__ object is available in other child frame');
        this.clickLabel('frame 3');
    });

    casper.withFrame('frame2', function() {
        test.assertTitle('CasperJS frame 3');
    });

    casper.withFrame(0, function() {
        test.assertTitle('CasperJS frame 1');
        test.assertExists("#f1");
        test.assertDoesntExist("#f2");
    });

    casper.withFrame(1, function() {
        test.assertTitle('CasperJS frame 3');
    });

    casper.run(function() {
        test.assertTitle('CasperJS test frames');
        test.done();
    });
});
