/*jshint strict:false*/
/*global casper, __utils__*/
casper.test.begin('logging tests', 4, function(test) {
    casper.start('tests/site/index.html');

    var oldLevel = casper.options.logLevel;

    casper.options.logLevel = 'info';
    casper.options.verbose = false;

    casper.log('foo', 'info');
    casper.test.assert(casper.result.log.some(function(e) {
        return e.message === 'foo' && e.level === 'info';
    }), 'Casper.log() adds a log entry');

    casper.options.logLevel = oldLevel;
    casper.options.verbose = true;

    casper.then(function() {
        var oldLevel = casper.options.logLevel;
        casper.options.logLevel = 'debug';
        casper.options.verbose = false;
        casper.evaluate(function() {
            __utils__.log('debug message');
            __utils__.log('info message', 'info');
        });
        test.assert(casper.result.log.some(function(e) {
            return e.message === 'debug message' && e.level === 'debug' && e.space === 'remote';
        }), 'ClientUtils.log() adds a log entry');
        test.assert(casper.result.log.some(function(e) {
            return e.message === 'info message' && e.level === 'info' && e.space === 'remote';
        }), 'ClientUtils.log() adds a log entry at a given level');
        casper.options.logLevel = oldLevel;
        casper.options.verbose = true;
    });

    casper.run(function() {
        test.assertEquals(this.result.log.length, 3, 'Casper.log() logged messages');
        test.done();
    });
});
