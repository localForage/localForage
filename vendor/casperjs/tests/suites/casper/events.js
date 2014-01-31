/*global casper*/
/*jshint strict:false*/
casper.test.begin('events', 2, function(test) {
    casper.plopped = false;
    casper.once("plop", function() {
        this.plopped = true;
    });
    test.assert(Object.keys(casper._events).some(function(i) {
        return i === "plop";
    }), "on() has set an event handler");
    casper.emit("plop");
    test.assert(casper.plopped, "emit() emits an event");
    test.done();
});

casper.test.begin('filters', 3, function(test) {
    casper.foo = 0;
    casper.setFilter("test", function(a) {
        this.foo = 42;
        return a + 1;
    });
    test.assert(Object.keys(casper._filters).some(function(i) {
        return i === "test";
    }), "setFilter() has set a filter");
    test.assertEquals(casper.filter("test", 1), 2, "filter() filters a value");
    test.assertEquals(casper.foo, 42, "filter() applies the correct context");
    delete casper.foo;
    test.done();
});
