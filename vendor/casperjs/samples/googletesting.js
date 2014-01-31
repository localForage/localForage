/*jshint strict:false*/
/*global CasperError, casper, console, phantom, require*/
/**
 * Google sample testing.
 *
 * Usage:
 *
 *     $ casperjs test googletesting.js
 */
casper.test.begin('Google search retrieves 10 or more results', 5, function suite(test) {
    casper.start("http://www.google.fr/", function() {
        test.assertTitle("Google", "google homepage title is the one expected");
        test.assertExists('form[action="/search"]', "main form is found");
        this.fill('form[action="/search"]', {
            q: "casperjs"
        }, true);
    });

    casper.then(function() {
        test.assertTitle("casperjs - Recherche Google", "google title is ok");
        test.assertUrlMatch(/q=casperjs/, "search term has been submitted");
        test.assertEval(function() {
            return __utils__.findAll("h3.r").length >= 10;
        }, "google search for \"casperjs\" retrieves 10 or more results");
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Casperjs.org is first ranked', 1, function suite(test) {
    casper.start("http://www.google.fr/", function() {
        this.fill('form[action="/search"]', {
            q: "casperjs"
        }, true);
    });

    casper.then(function() {
        test.assertSelectorContains(".g", "casperjs.org", "casperjs.org is first ranked");
    });

    casper.run(function() {
        test.done();
    });
});
