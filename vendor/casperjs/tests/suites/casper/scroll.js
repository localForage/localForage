/*global casper*/
/*jshint strict:false*/
casper.test.begin('Casper.scrollTo()', 2, function(test) {
    casper.start().then(function() {
        this.setContent('<div style="width:2000px;height:2000px">large div is large</div>');
        this.scrollTo(1000, 1000);
        test.assertEquals(this.getGlobal("scrollX"), 1000, "scrollTo() scrolls to X position");
        test.assertEquals(this.getGlobal("scrollY"), 1000, "scrollTo() scrolls to Y position");
    });

    casper.run(function() {
        test.done();
    });
});


casper.test.begin('Casper.scrollToBottom()', 1, function(test) {
    casper.start().then(function() {
        this.setContent('<div style="height:2000px">long div is long</div>');
        this.scrollToBottom();
        test.assertEval(function() {
            /*global __utils__*/
            return __utils__.getDocumentHeight() - window.innerHeight === window.scrollY;
        }, "scrollToBottom() scrolls to max Y by default");
    });

    casper.run(function() {
        test.done();
    });
});
