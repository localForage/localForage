/*jshint strict:false, eqeqeq:false*/
/*global CasperError, casper, console, phantom, require*/
var steps = [];

casper.test.begin('Tester.begin() configuration', 10, {
    fixtures: [1, 2, 3],

    _this: function() {
        return this;
    },

    setUp: function(test) {
        steps.push('setUp');
        test.pass('config.setUp() has been called');
        test.assert(this == this._this(), 'config.setUp() is using the expected context');
        test.assertEquals(this.fixtures, [1, 2, 3], 'config.setUp() accesses fixtures');
    },

    tearDown: function(test) {
        steps.push('tearDown');
        test.pass('config.tearDown() has been called');
        test.assert(this == this._this(), 'config.test() is using the expected context');
        test.assertEquals(this.fixtures, [1, 2, 3], 'config.tearDown() accesses fixtures');
        test.assertEquals(steps, ['setUp', 'test', 'tearDown'],
            'Tester.begin() has processed the configuration in the expected order');
    },

    test: function(test) {
        steps.push('test');
        test.pass('config.test() has been called');
        test.assert(this == this._this(), 'config.tearDown() is using the expected context');
        test.assertEquals(this.fixtures, [1, 2, 3], 'config.test() accesses fixtures');
        test.done();
    }
});
