casper.test.begin('test abort()', 10, function(test) {
    "use strict";
    for (var i = 0; i < 10; i++) {
        test.assert(true, 'test ' + (i + 1));
        if (i === 4) {
            test.abort('this is my abort message');
        }
    }
    test.done();
});

casper.test.begin('should not being executed', 1, function(test) {
    "use strict";
    test.fail('damn.');
    test.done();
});
