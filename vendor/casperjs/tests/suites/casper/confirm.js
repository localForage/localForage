/*global casper*/
/*jshint strict:false*/
casper.test.begin('can confirm dialog', 2, {
    received: undefined,

    setUp: function(test) {
        var self = this;
        casper.removeAllFilters('page.confirm');
        casper.setFilter('page.confirm', function(message) {
            self.received = message;
            return true;
        });
    },

    tearDown: function(test) {
        casper.removeAllFilters('page.confirm');
    },

    test: function(test) {
        var self = this;
        casper.start('tests/site/confirm.html', function() {
            test.assert(this.getGlobal('confirmed'), 'confirmation dialog accepted');
        }).run(function() {
            test.assertEquals(self.received, 'are you sure?', 'confirmation message is ok');
            test.done();
        });
    }
});

casper.test.begin('can cancel dialog', {
    received: undefined,

    setUp: function(test) {
        var self = this;
        casper.removeAllFilters('page.confirm');
        casper.setFilter('page.confirm', function(message) {
            return false;
        });
    },

    tearDown: function(test) {
        casper.removeAllFilters('page.confirm');
    },

    test: function(test) {
        var self = this;
        casper.start('tests/site/confirm.html', function() {
            test.assertNot(this.getGlobal('confirmed'), 'confirmation dialog canceled');
        }).run(function() {
            test.done();
        });
    }
});
