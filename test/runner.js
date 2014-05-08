// Run before window.onload to make sure the specs have access to describe()
// and other mocha methods. All feels very hacky though :-/
var mocha = this.mocha;

mocha.setup('bdd');

this.addEventListener('load', function() {
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
});
