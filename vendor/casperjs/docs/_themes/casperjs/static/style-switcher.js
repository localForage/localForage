/**
 * http://www.alistapart.com/articles/alternate/
 *
 *     var cookie = readCookie("style");
 *     var title = cookie ? cookie : getPreferredStyleSheet();
 *     setActiveStyleSheet(title);
 */
(function(exports, $) {
    function setActiveStyleSheet(title) {
        var i, a, main;
        for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
            if (a.getAttribute("rel").indexOf("style") !== -1 && a.getAttribute("title")) {
                a.disabled = true;
                if (a.getAttribute("title") === title) {
                    a.disabled = false;
                }
            }
        }
    }
    exports.setActiveStyleSheet = setActiveStyleSheet;

    function getActiveStyleSheet() {
        var i, a;
        for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
            if (a.getAttribute("rel").indexOf("style") !== -1 && a.getAttribute("title") && !a.disabled) {
                return a.getAttribute("title");
            }
        }
        return null;
    }
    exports.getActiveStyleSheet = getActiveStyleSheet;

    function getPreferredStyleSheet() {
        var i, a;
        for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
            if (a.getAttribute("rel").indexOf("style") !== -1 &&
                a.getAttribute("rel").indexOf("alt") === -1 &&
                a.getAttribute("title")) {
                return a.getAttribute("title");
            }
        }
        return null;
    }
    exports.getPreferredStyleSheet = getPreferredStyleSheet;

    function createCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    function createSwitcher() {
        var $nav = $('.related').find('ul');
        var styles = $('link').filter(function(i, link){
            return $(link).attr('rel').indexOf('style') > -1 && $(link).attr('title');
        }).map(function(i, link) {
            return $(link).attr('title');
        });
        $(styles).each(function(i, style) {
            var $link = $('<a/>').attr('href', '#')
                                 .attr('title', style)
                                 .addClass('style-switch')
                                 .text(style);
            $nav.prepend($('<li/>').addClass('right').append($link));
        });
        $('.style-switch').bind('click', function(event) {
            event.preventDefault();
            setActiveStyleSheet($(this).attr('title'));
        });
    }

    exports.onload = function(e) {
        var cookie = readCookie("style");
        var title = cookie ? cookie : getPreferredStyleSheet();
        setActiveStyleSheet(title);
        createSwitcher();
    }

    exports.onunload = function(e) {
        var title = getActiveStyleSheet();
        createCookie("style", title, 365);
    }

    var cookie = readCookie("style");
    var title = cookie ? cookie : getPreferredStyleSheet();
    setActiveStyleSheet(title);
})(window, window.jQuery);
