/*global casper*/
/*jshint strict:false*/
casper.test.begin('Casper.bypass() can bypass a step', 1, function(test) {
    casper.start();
    casper.then(function(){
        test.fail("This test should not be executed.");
    });
    casper.bypass(1).run(function() {
        test.pass("Step has been bypassed");
        test.done();
    });
});

casper.test.begin('Casper.bypass() can bypass multiple steps', 1, function(test) {
    casper.start();
    casper.then(function() {
        test.pass("This test should be executed.");
    });
    casper.then(function() {
        this.bypass(2);
    });
    casper.then(function() {
        test.fail("This test should not be executed.");
    });
    casper.then(function() {
        test.fail("Nor this one.");
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Casper.thenBypass()', 1, function(test) {
    casper.
        thenBypass(1).
        then(function() {
            test.fail("This test should be bypassed.");
        }).
        then(function() {
            test.pass("This test should be executed.");
        });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Casper.thenBypassIf()', 3, function(test) {
    casper.
        thenBypassIf(true, 1, "Bypass if with function").
        then(function() {
            test.fail("This test should be bypassed.");
        }).
        then(function() {
            test.pass("This test should be executed.");
        }).
        thenBypassIf(function() {
            return true;
            }, 1, "Bypass if with function").
        then(function() {
            test.fail("This test should be bypassed.");
        }).
        then(function() {
            test.pass("This test should be executed.");
        }).
        thenBypassIf(function() {
            return false;
            }, 1, "Do not bypass if with function").
        then(function() {
            test.pass("This test should be executed.");
        });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Casper.thenBypassUnless()', 3, function(test) {
    casper.
        thenBypassUnless(false, 1, "Bypass unless with function").
        then(function() {
            test.fail("This test should be bypassed.");
        }).
        then(function() {
            test.pass("This test should be executed.");
        }).
        thenBypassUnless(function() {
            return false;
            }, 1, "Bypass unless with function").
        then(function() {
            test.fail("This test should be bypassed.");
        }).
        then(function() {
            test.pass("This test should be executed.");
        }).
        thenBypassUnless(function() {
            return true;
            }, 1, "Do not bypass unless with function").
        then(function() {
            test.pass("This test should be executed.");
        });

    casper.run(function() {
        test.done();
    });
});

