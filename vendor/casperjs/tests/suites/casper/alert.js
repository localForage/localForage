/*global casper*/
/*jshint strict:false*/
casper.test.begin('alert events', 1, {
    ok: false,

    tearDown: function(test) {
        casper.removeAllListeners('remote.alert');
    },

    test: function(test) {
        var self = this;

        casper.once('remote.alert', function(message) {
            self.ok = (message === 'plop');
        });

        casper.start('tests/site/alert.html', function() {
            test.assert(self.ok, 'alert event has been intercepted');
        });

        casper.run(function() {
            test.done();
        });
    }
});
