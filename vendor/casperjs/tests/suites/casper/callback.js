/*global casper*/
/*jshint strict:false*/
casper.test.begin('callback events', 1, {
    ok: false,

    tearDown: function(test) {
        casper.removeAllListeners('remote.callback');
    },

    test: function(test) {
        var self = this;

        casper.once('remote.callback', function(data) {
            self.ok = (data.hello === 'world');
        });

        casper.start('tests/site/callback.html', function() {
            test.assert(self.ok, 'callback event has been intercepted');
        });

        casper.run(function() {
            test.done();
        });
    }
});
