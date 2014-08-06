// Run before window.onload to make sure the specs have access to describe()
// and other mocha methods. All feels very hacky though :-/
var mocha = this.mocha;

mocha.setup('bdd');

function runTests() {
    var runner = mocha.run();

    var failedTests = [];

    runner.on('end', function(){
        window.mochaResults = runner.stats;
        window.mochaResults.reports = failedTests;
    });

    function flattenTitles(test) {
        var titles = [];

        while (test.parent.title) {
            titles.push(test.parent.title);
            test = test.parent;
        }

        return titles.reverse();
    }

    function logFailure(test, err) {
        failedTests.push({
            name: test.title,
            result: false,
            message: err.message,
            stack: err.stack,
            titles: flattenTitles(test)
        });
    }

    runner.on('fail', logFailure);
}

var require = this.require;
if (require) {
    requirejs.config({
        paths: {
            localforage: '/dist/localforage'
        }
    });
    require(['localforage'], function(localforage) {
        window.localforage = localforage;

        require([
            '/test/test.api.js',
            '/test/test.config.js',
            '/test/test.datatypes.js',
            '/test/test.drivers.js',
            '/test/test.iframes.js',
            '/test/test.webworkers.js'
        ], runTests);
    });
} else {
    this.addEventListener('load', runTests);
}
