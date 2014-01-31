/*jshint strict:false*/
/*global CasperError, console, phantom, require*/

/**
 * Capture multiple pages of google search results
 *
 * Usage: $ casperjs googlepagination.coffee my search terms
 *
 * (all arguments will be used as the query)
 */

var casper = require("casper").create({
    waitTimeout: 1000,
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    }
});
var currentPage = 1;

if (casper.cli.args.length === 0) {
    casper
        .echo("Usage: $ casperjs googlepagination.js my search terms")
        .exit(1)
    ;
}

var terminate = function() {
    this.echo("that's all, folks.").exit();
};

var processPage = function() {
    var url;
    this.echo("capturing page " + currentPage);
    this.capture("google-results-p" + currentPage + ".png");

    // don't go too far down the rabbit hole
    if (currentPage >= 5 || !this.exists("#pnnext")) {
        return terminate.call(casper);
    }

    currentPage++;
    this.echo("requesting next page: " + currentPage);
    url = this.getCurrentUrl();
    this.thenClick("#pnnext").then(function() {
        this.waitFor(function() {
            return url !== this.getCurrentUrl();
        }, processPage, terminate);
    });
};

casper.start("http://google.fr/", function() {
    this.fill('form[action="/search"]', {
        q: casper.cli.args.join(" ")
    }, true);
});

casper.waitForSelector('#pnnext', processPage, terminate);

casper.run();
