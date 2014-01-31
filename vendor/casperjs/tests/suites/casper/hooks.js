/*global casper*/
/*jshint strict:false*/
casper.test.begin('onStepComplete() hook tests', 1, function(test) {
    var stepResults = [];
    casper.options.onStepComplete = function(self, stepResult) {
        stepResults.push(stepResult);
    };
    casper.start('tests/site/index.html', function() {
        return 'ok';
    });
    casper.run(function() {
        test.assert(stepResults.indexOf('ok') > -1,
            'Casper.options.onStepComplete() is called on step complete');
        this.options.onStepComplete = undefined;
        test.done();
    });
});

casper.test.begin('onResourceRequested() & onResourceReceived() hook tests', 6, function(test) {
    var requests = [], responses = [];
    casper.options.onResourceRequested = function(self, request) {
        requests.push(request);
    };
    casper.options.onResourceReceived = function(self, response) {
        responses.push(response);
    };
    casper.start('tests/site/index.html', function() {
        test.assert(requests.some(function(request) {
            return (/index\.html$/).test(request.url);
        }), 'onResourceRequested() receives page requests');
        test.assert(requests.some(function(request) {
            return (/phantom\.png$/).test(request.url);
        }), 'onResourceRequested() receives image requests');
        test.assert(responses.some(function(response) {
            return response.stage === 'start' && (/index\.html$/).test(response.url);
        }), 'onResourceReceived() receives page response on load start');
        test.assert(responses.some(function(response) {
            return response.stage === 'end' && (/index\.html$/).test(response.url);
        }), 'onResourceReceived() receives page response on load end');
        test.assert(responses.some(function(response) {
            return response.stage === 'start' && (/phantom\.png$/).test(response.url);
        }), 'onResourceReceived() receives image response on load start');
        test.assert(responses.some(function(response) {
            return response.stage === 'end' && (/phantom\.png$/).test(response.url);
        }), 'onResourceReceived() receives image response on load end');
    });
    casper.run(function() {
        this.options.onResourceReceived = this.options.onResourceRequested = undefined;
        test.done();
    });
});

casper.test.begin('onAlert() hook tests', 1, function(test) {
    var message;
    casper.options.onAlert = function(self, msg) {
        message = msg;
    };
    casper.start('tests/site/alert.html', function() {
        test.assertEquals(message, 'plop', 'Casper.options.onAlert() can intercept an alert message');
    });
    casper.run(function() {
        this.options.onAlert = null;
        test.done();
    });
});
