/*global casper*/
/*jshint strict:false*/
casper.test.begin('fetchText() basic tests', 1, function(test) {
    casper.start('tests/site/index.html', function() {
        test.assertEquals(this.fetchText('ul li'), 'onetwothree',
            'Casper.fetchText() can retrieve text contents');
    }).run(function() {
        test.done();
    });
});

casper.test.begin('fetchText() handles HTML entities', 1, function(test) {
    casper.start().then(function() {
        this.setContent('<html><body>Voil&agrave;</body></html>');
        test.assertEquals(this.fetchText('body'), 'Voilà',
            'Casper.fetchText() fetches decoded text');
    });
    casper.run(function() {
        test.done();
    });
});
