/*global casper*/
/*jshint strict:false*/
var usedSettings;

function onOpen(url, settings) {
    usedSettings = settings;
}

function setUp(test) {
    casper.start().on('open', onOpen);
}

function tearDown(test) {
    usedSettings = undefined;
    casper.removeListener('open', onOpen);
}

casper.test.begin('open() GET tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.open('tests/site/index.html').then(function() {
            test.pass("Casper.open() can open and load a location using GET");
            test.assertEquals(usedSettings, {
                method: "get"
            }, "Casper.open() used the expected GET settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() GET casing tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.open('tests/site/index.html', {
          method: 'GET'
        }).then(function() {
            test.pass("Casper.open() can open and load a location using GET");
            test.assertEquals(usedSettings, {
                method: "GET"
            }, "Casper.open() used the expected GET settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() POST tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.open('tests/site/index.html', {
            method: 'post',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }).then(function() {
            test.pass("Casper.open() can open and load a location using POST");
            test.assertEquals(usedSettings, {
                method: "post",
                data:   "plop=42&chuck=norris"
            }, "Casper.open() used the expected POST settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() POST casing tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.open('tests/site/index.html', {
            method: 'POST',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }).then(function() {
            test.pass("Casper.open() can open and load a location using POST");
            test.assertEquals(usedSettings, {
                method: "POST",
                data:   "plop=42&chuck=norris"
            }, "Casper.open() used the expected POST settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.thenOpen('tests/site/index.html', {
            method: 'put',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }).then(function() {
            test.pass("Casper.open() can open and load a location using PUT");
            test.assertEquals(usedSettings, {
                method: "put",
                data:   "plop=42&chuck=norris"
            }, "Casper.open() used the expected PUT settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT casing tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        casper.thenOpen('tests/site/index.html', {
            method: 'PUT',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }).then(function() {
            test.pass("Casper.open() can open and load a location using PUT");
            test.assertEquals(usedSettings, {
                method: "PUT",
                data:   "plop=42&chuck=norris"
            }, "Casper.open() used the expected PUT settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        // HTTP Auth
        casper.thenOpen('tests/site/index.html', {
            method: 'get',
            username: 'bob',
            password: 'sinclar'
        }).then(function() {
            test.pass("Casper.open() can open and load a location using HTTP auth");
            test.assertEquals(usedSettings, {
                method: "get",
                username: 'bob',
                password: 'sinclar'
            }, "Casper.open() used the expected HTTP auth settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        // GET with thenOpen
        casper.thenOpen('tests/site/index.html').then(function() {
            test.pass("Casper.thenOpen() can open and load a location using GET");
            test.assertEquals(usedSettings, {
                method: "get"
            }, "Casper.thenOpen() used the expected GET settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        // POST with thenOpen
        casper.thenOpen('tests/site/index.html', {
            method: 'post',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }, function() {
            test.pass("Casper.thenOpen() can open and load a location using POST");
            test.assertEquals(usedSettings, {
                method: "post",
                data:   "plop=42&chuck=norris"
            }, "Casper.thenOpen() used the expected POST settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        // PUT with thenOpen
        casper.thenOpen('tests/site/index.html', {
            method: 'put',
            data:   {
                plop: 42,
                chuck: 'norris'
            }
        }, function() {
            test.pass("Casper.thenOpen() can open and load a location using PUT");
            test.assertEquals(usedSettings, {
                method: "put",
                data:   "plop=42&chuck=norris"
            }, "Casper.thenOpen() used the expected PUT settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});

casper.test.begin('open() PUT tests', 2, {
    setUp: setUp,
    tearDown: tearDown,
    test: function(test) {
        // HTTP Auth with thenOpen
        casper.thenOpen('tests/site/index.html', {
            method: 'get',
            username: 'bob',
            password: 'sinclar'
        }, function() {
            test.pass("Casper.thenOpen() can open and load a location using HTTP auth");
            test.assertEquals(usedSettings, {
                method: "get",
                username: 'bob',
                password: 'sinclar'
            }, "Casper.thenOpen() used the expected HTTP auth settings");
        });

        casper.run(function() {
            test.done();
        });
    }
});
