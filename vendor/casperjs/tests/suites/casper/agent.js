/*global casper*/
/*jshint strict:false*/
function testUA(ua, match) {
    casper.test.assertMatch(
        ua, match, 'Default user agent matches ' + match
    );
}

function fetchUA(requestData, request) {
    var headers = requestData.headers.filter(function(header) {
        return header.name === "User-Agent";
    });
    casper.test.assert(headers.length > 0);
    testUA(headers.pop().value, /plop/);
}

casper.test.begin('userAgent() tests', 3, {
    originalUA: casper.options.pageSettings.userAgent,

    tearDown: function(test) {
        casper.userAgent(this.originalUA);
    },

    test: function(test) {
        testUA(casper.options.pageSettings.userAgent, /CasperJS/);
        casper.start().userAgent('plop').once('resource.requested', fetchUA);
        casper.thenOpen('tests/site/index.html').run(function() {
            test.done();
        });
    }
});

