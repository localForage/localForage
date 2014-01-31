/*global casper*/
/*jshint strict:false, maxstatements:99*/
casper.test.begin('mouseEvent() tests', 16, function(test) {
    casper.start('tests/site/mouse-events.html', function() {
        test.assert(this.mouseEvent('mousedown', '#test1'), 'Casper.mouseEvent() can dispatch a mousedown event');
        test.assert(this.mouseEvent('mousedown', '#test2'), 'Casper.mouseEvent() can dispatch a mousedown event handled by unobstrusive js');
        test.assert(this.mouseEvent('mouseup', '#test3'), 'Casper.mouseEvent() can dispatch a mouseup event');
        test.assert(this.mouseEvent('mouseup', '#test4'), 'Casper.mouseEvent() can dispatch a mouseup event handled by unobstrusive js');
        test.assert(this.mouseEvent('mouseover', '#test5'), 'Casper.mouseEvent() can dispatch a mouseover event');
        test.assert(this.mouseEvent('mouseover', '#test6'), 'Casper.mouseEvent() can dispatch a mouseover event handled by unobstrusive js');
        test.assert(this.mouseEvent('mouseout', '#test7'), 'Casper.mouseEvent() can dispatch a mouseout event');
        test.assert(this.mouseEvent('mouseout', '#test8'), 'Casper.mouseEvent() can dispatch a mouseout event handled by unobstrusive js');
    });

    casper.then(function() {
        var results = this.getGlobal('results');
        test.assert(results.test1, 'Casper.mouseEvent() triggered mousedown');
        test.assert(results.test2, 'Casper.mouseEvent() triggered mousedown via unobstrusive js');
        test.assert(results.test3, 'Casper.mouseEvent() triggered mouseup');
        test.assert(results.test4, 'Casper.mouseEvent() triggered mouseup via unobstrusive js');
        test.assert(results.test5, 'Casper.mouseEvent() triggered mouseover');
        test.assert(results.test6, 'Casper.mouseEvent() triggered mouseover via unobstrusive js');
        test.assert(results.test7, 'Casper.mouseEvent() triggered mouseout');
        test.assert(results.test8, 'Casper.mouseEvent() triggered mouseout via unobstrusive js');
    });

    casper.run(function() {
        test.done();
    });
});
