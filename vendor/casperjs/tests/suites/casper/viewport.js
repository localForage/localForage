/*global casper*/
/*jshint strict:false*/
var utils = require('utils');

casper.test.begin('viewport() tests', 3, function(test) {
    casper.start();
    casper.viewport(1337, 999);
    test.assertEquals(casper.page.viewportSize.width, 1337,
        'Casper.viewport() can change the width of page viewport');
    test.assertEquals(casper.page.viewportSize.height, 999,
        'Casper.viewport() can change the height of page viewport');
    test.assertRaises(casper.viewport, ['a', 'b'],
        'Casper.viewport() validates viewport size data');
    test.done();
});

casper.test.begin('viewport() asynchronous tests', 2, function(test) {
    var screenshotData;

    casper.start('tests/site/index.html').viewport(800, 600, function() {
        this.setContent(utils.format('<img src="data:image/png;base64,%s">',
                                     this.captureBase64('png')));
    });

    casper.then(function() {
        var imgInfo = this.getElementInfo('img');
        if (phantom.casperEngine === "slimerjs" && imgInfo.width !== 800) {
            // sometimes, setting viewport could take more time in slimerjs/gecko
            // and the image is not still ready: :-/
            test.skip(2);
        }
        else {
            test.assertEquals(imgInfo.width, 800, 'Casper.viewport() changes width asynchronously');
            test.assertEquals(imgInfo.height, 600, 'Casper.viewport() changes height asynchronously');
        }
    });

    casper.run(function() {
        test.done();
    });
});
