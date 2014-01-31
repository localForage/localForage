/*global casper*/
/*jshint strict:false*/

casper.options.waitTimeout = 500;

casper.test.begin('waitForSelector fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForSelector('p.nonexistent', function() {
        throw new Error('waitForSelector found something it should not have');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitWhileSelector fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForSelector('#encoded');

    casper.waitWhileSelector('#encoded', function() {
        throw new Error('waitWhileSelector thought something got removed when it did not');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForSelectorTextChange fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForSelectorTextChange('#encoded', function() {
        throw new Error('waitForSelectorTextChange thought text changed when it did not');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitUntilVisible fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitUntilVisible('p[style]', function() {
        throw new Error('waitUntilVisible falsely identified a hidden paragraph');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitWhileVisible fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitWhileVisible('img', function() {
        throw new Error('waitWhileVisible thought something disappeared when it did not');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForUrl fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForUrl(/github\.com/, function() {
        throw new Error('waitForUrl thought we actually navigated to GitHub');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForPopup fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForPopup(/foobar/, function() {
        throw new Error('waitForPopup found something it should not have');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForText fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitForText("Lorem ipsum", function() {
        throw new Error('waitForText found something it should not have');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitFor fails with expected message', 1, function(test) {
    casper.start('../site/waitFor.html');

    casper.waitFor(function() {
      return false
    }, function() {
        throw new Error('waitFor fasely succeeded');
    });

    casper.run(function() {
        test.done();
    });
});