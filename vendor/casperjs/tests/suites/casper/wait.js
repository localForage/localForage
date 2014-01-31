/*global casper*/
/*jshint strict:false*/
casper.test.begin('wait() tests', 1, function(test) {
    var waitStart;

    casper.start('tests/site/index.html', function() {
        waitStart = new Date().getTime();
    });

    casper.wait(250, function() {
        test.assert(new Date().getTime() - waitStart > 250,
            'Casper.wait() can wait for a given amount of time');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitFor() tests', 2, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitFor(function() {
        return this.evaluate(function() {
            return document.querySelectorAll('li').length === 4;
        });
    }, function() {
        test.pass('Casper.waitFor() can wait for something to happen');
    }, function() {
        test.fail('Casper.waitFor() can wait for something to happen');
    });

    casper.reload().waitFor(function(){
        return false;
    }, function() {
        test.fail('waitFor() processes onTimeout callback');
    }, function() {
        test.pass('waitFor() processes onTimeout callback');
    }, 1000);

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForResource() tests', 2, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitForResource('phantom.png', function() {
        test.pass('Casper.waitForResource() waits for a resource');
    }, function() {
        test.fail('Casper.waitForResource() waits for a resource');
    });

    casper.reload().waitForResource(/phantom\.png$/, function() {
        test.pass('Casper.waitForResource() waits for a resource using RegExp');
    }, function() {
        test.fail('Casper.waitForResource() waits for a resource using RegExp');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForSelector() tests', 1, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitForSelector('li:nth-child(4)', function() {
        test.pass('Casper.waitForSelector() waits for a selector to exist');
    }, function() {
        test.fail('Casper.waitForSelector() waits for a selector to exist');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForText() tests', 3, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitForText('<li>four</li>', function() {
        test.pass('Casper.waitForText() can wait for text');
    }, function() {
        test.fail('Casper.waitForText() can wait for text');
    });

    casper.reload().waitForText(/four/i, function() {
        test.pass('Casper.waitForText() can wait for regexp');
    }, function() {
        test.fail('Casper.waitForText() can wait for regexp');
    });

    casper.reload().waitForText('Voilà', function() {
        test.pass('Casper.waitForText() can wait for decoded HTML text');
    }, function() {
        test.fail('Casper.waitForText() can wait for decoded HTML text');
    }, 1000);

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForSelectorTextChange() tests', 1, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitForSelectorTextChange('#textChange', function() {
        test.pass('Casper.waitForSelectorTextChange() can wait for text on a selector to change');
    }, function() {
        test.fail('Casper.waitForSelectorTextChange() can wait for text on a selector to change');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitUntilVisible() tests', 2, function(test) {
    casper.start('tests/site/waitFor.html');

    casper.waitUntilVisible('li:nth-child(4)', function() {
        test.pass('Casper.waitUntilVisible() waits for a selector being visible');
    }, function() {
        test.fail('Casper.waitUntilVisible() waits for a selector being visible');
    });

    casper.waitUntilVisible('p', function() {
        test.pass('Casper.waitUntilVisible() waits for a selector being visible');
    }, function() {
        test.fail('Casper.waitUntilVisible() waits for a selector being visible');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForUrl() regexp tests', 1, function(test) {
    casper.start().thenEvaluate(function() {
        setTimeout(function() {
            document.location = './form.html';
        }, 100);
    });

    casper.waitForUrl(/form\.html$/, function() {
        test.pass('Casper.waitForUrl() waits for a given regexp url');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('waitForUrl() string tests', 1, function(test) {
    casper.start().thenEvaluate(function() {
        setTimeout(function() {
            document.location = './form.html';
        }, 100);
    });

    casper.waitForUrl('form.html', function() {
        test.pass('Casper.waitForUrl() waits for a given string url');
    });

    casper.run(function() {
        test.done();
    });
});
