/*global casper*/
/*jshint strict:false, maxparams:99*/
casper.test.begin('mapping argument context', 1, function(test) {
    casper.start();
    var context = {
        "_boolean_true":  true,
        "_boolean_false": false,
        "_int_number":    42,
        "_float_number":  1337.42,
        "_string":        "plop! \"Ÿ£$\" 'no'",
        "_array":         [1, 2, 3],
        "_object":        {a: 1, b: 2},
        "_function":      function(){console.log('ok');}
    };
    var result = casper.evaluate(function(_boolean_true, _boolean_false, _int_number,
                                          _float_number, _string, _array, _object, _function) {
        return [].map.call(arguments, function(arg) {
            return typeof(arg);
        });
    }, context);
    test.assertEquals(
        result.toString(),
        ['boolean', 'boolean', 'number', 'number', 'string', 'object', 'object', 'function'].toString(),
        'Casper.evaluate() handles passed argument context correcly'
    );
    test.done();
});

casper.test.begin('handling no argument context', 1, function(test) {
    casper.start();
    test.assertEquals(casper.evaluate(function() {
        return 42;
    }), 42, 'Casper.evaluate() handles evaluation with no context passed');
    test.done();
});

casper.test.begin('handling of object context (BC mode)', 3, function(test) {
    casper.start();
    test.assertEquals(casper.evaluate(function(a) {
        return [a];
    }, {a: "foo"}), ["foo"], 'Casper.evaluate() accepts an object as arguments context');
    test.assertEquals(casper.evaluate(function(a, b) {
        return [a, b];
    }, {a: "foo", b: "bar"}), ["foo", "bar"], 'Casper.evaluate() accepts an object as arguments context');
    test.assertEquals(casper.evaluate(function(a, b, c) {
        return [a, b, c];
    }, {a: "foo", b: "bar", c: "baz"}), ["foo", "bar", "baz"], 'Casper.evaluate() accepts an object as arguments context');
    test.done();
});

casper.test.begin('handling of array context', 3, function(test) {
    casper.start();
    test.assertEquals(casper.evaluate(function(a) {
        return [a];
    }, ["foo"]), ["foo"], 'Casper.evaluate() accepts an array as arguments context');
    test.assertEquals(casper.evaluate(function(a, b) {
        return [a, b];
    }, ["foo", "bar"]), ["foo", "bar"], 'Casper.evaluate() accepts an array as arguments context');
    test.assertEquals(casper.evaluate(function(a, b, c) {
        return [a, b, c];
    }, ["foo", "bar", "baz"]), ["foo", "bar", "baz"], 'Casper.evaluate() accepts an array as arguments context');
    test.done();
});

casper.test.begin('natural arguments context (phantomjs equivalent)', 3, function(test) {
    casper.start();
    test.assertEquals(casper.evaluate(function(a) {
        return [a];
    }, "foo"), ["foo"], 'Casper.evaluate() accepts natural arguments context');
    test.assertEquals(casper.evaluate(function(a, b) {
        return [a, b];
    }, "foo", "bar"), ["foo", "bar"], 'Casper.evaluate() accepts natural arguments context');
    test.assertEquals(casper.evaluate(function(a, b, c) {
        return [a, b, c];
    }, "foo", "bar", "baz"), ["foo", "bar", "baz"], 'Casper.evaluate() accepts natural arguments context');
    test.done();
});

casper.test.begin('thenEvaluate() tests', 2, function(test) {
    casper.start().thenEvaluate(function(a, b) {
        window.a = a
        window.b = b;
    }, "foo", "bar");
    casper.then(function() {
        test.assertEquals(this.getGlobal('a'), "foo", "Casper.thenEvaluate() sets args");
        test.assertEquals(this.getGlobal('b'), "bar",
            "Casper.thenEvaluate() sets args the same way evaluate() does");
    });
    casper.run(function() {
        test.done();
    });
});

// https://github.com/n1k0/casperjs/issues/489
// https://groups.google.com/forum/?fromgroups=#!topic/casperjs/95IgDMFnEKM
casper.test.begin("evaluate() returns a value which can be altered", 1, function(test) {
    var list;

    casper.start().then(function() {
        list = this.evaluate(function() {
            return [{a: 1}, {b: 2}];
        });
        var first = list[0];
        first.a = 42;
        test.assertEquals(list, [{a: 42}, {b: 2}],
            'evaluate() returns a cloned value which can be altered');
    });

    casper.run(function() {
        test.done();
    });
});
