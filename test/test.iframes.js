/* global before:true, after:true, describe:true, expect:true, it:true */
describe('Inside iFrames', function() {
    'use strict';

    before(function() {
        var iFrame = window.document.createElement('iframe');
        iFrame.name = 'iframe';
        iFrame.id = 'iframe';
        // TODO: Get this to be cross-origin.
        iFrame.src = 'http://' + window.location.host +
                     '/test/test.iframecontents.html';

        window.document.body.appendChild(iFrame);
    });

    after(function() {
        var iFrame = window.document.getElementById('iframe');
        iFrame.parentNode.removeChild(iFrame);
    });

    it('can run localForage in an iFrame', function(done) {
        var timer = setInterval(function() {
            var element = window.document.getElementById('iframe')
                                         .contentWindow.document
                                         .getElementById('my-text');
            if (element && element.innerHTML) {
                clearInterval(timer);
                expect(element.innerHTML).to.be('I have been set');
                done();
            }
        }, 10);
    });
});
