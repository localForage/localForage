/*global casper*/
/*jshint strict:false*/
var currentRequest;

function onResourceRequested(requestData, request) {
    currentRequest = requestData;
}

function testHeader(header) {
    return header.name === 'Accept' && header.value === 'application/json';
}

casper.test.begin('requests tests', 3, {
    setUp: function() {
        casper.on('page.resource.requested', onResourceRequested);
    },

    tearDown: function() {
        currentRequest = undefined;
        casper.removeListener('page.resource.requested', onResourceRequested);
    },

    test: function(test) {
        casper.start('tests/site/index.html', function() {
            test.assertNot(currentRequest.headers.some(testHeader),
                "Casper.open() sets no custom header by default");
        });

        casper.thenOpen('tests/site/index.html', {
            headers: {
                Accept: 'application/json'
            }
        }, function() {
            test.assert(currentRequest.headers.some(testHeader),
                "Casper.open() can set a custom header");
        });

        casper.thenOpen('tests/site/index.html', function() {
            test.assertNot(currentRequest.headers.some(testHeader),
                "Casper.open() custom headers option is not persistent");
        });

        casper.run(function() {
            this.removeAllListeners('page.resource.requested');
            test.done();
        });
    }
});
