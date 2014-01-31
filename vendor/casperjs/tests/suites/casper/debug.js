/*global casper*/
/*jshint strict:false*/
casper.test.begin('getHTML() tests', 2, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assertEquals(this.getHTML('ul li'), 'one',
            'Casper.getHTML() retrieves inner HTML by default');
        test.assertEquals(this.getHTML('ul li', true), '<li>one</li>',
            'Casper.getHTML() can retrieve outer HTML');
    }).run(function() {
        test.done();
    });
});
