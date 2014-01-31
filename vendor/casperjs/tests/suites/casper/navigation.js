/*global casper*/
/*jshint strict:false*/
var server = require('webserver').create();
var service = server.listen(8090, function(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-type', 'text/html');
    response.write('<a href="/link">a link</a>');
    response.write('<form action="/form" method="POST"><input type="submit" /></form>');
    response.close();
});

casper.test.begin('Link Navigation updates response', function(test) {
    casper.start('http://localhost:8090', function(response) {
        casper.click('a');
        casper.then(function(response) {
            test.assertUrlMatch(
                /\/link$/,
                'URL matches anchor href'
            );
            test.assertEquals(
                response.url,
                casper.page.url,
                'response is consistent with the internal page'
            );

        });
    }).run(function() {
        test.done();
    });
});

casper.test.begin('Form Submittal updates the response', function(test) {
    casper.start('http://localhost:8090', function(response) {
        casper.fill('form', {}, true);
        casper.then(function(response) {
            test.assertUrlMatch(
                /\/form$/,
                'URL matches form action'
            );
            test.assertEquals(
                response.url,
                casper.page.url,
                'response is consistent with the internal page'
            );
        });
    }).run(function() {
        test.done();
        server.close();
    });
});
