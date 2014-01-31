/*global casper*/
/*jshint strict:false, maxstatements:99*/
var cli = require('cli');

casper.test.begin('parsing an empty argument list', 12, function(test) {
    var parsed = cli.parse([]);
    // clean
    test.assertEquals(parsed.args, [], 'parse() returns expected positional args array');
    test.assertEquals(parsed.options, {}, 'parse() returns expected options object');
    test.assertEquals(parsed.get(0), undefined, 'parse() does not return inexistant positional arg');
    test.assertEquals(parsed.get('blah'), undefined, 'parse() does not return inexistant option');
    test.assert(!parsed.has(0), 'has() checks if an arg is set');
    test.assert(!parsed.has('blah'), 'has() checks if an option is set');
    // raw
    test.assertEquals(parsed.raw.args, [], 'parse() returns expected positional args array');
    test.assertEquals(parsed.raw.options, {}, 'parse() returns expected options object');
    test.assertEquals(parsed.raw.get(0), undefined, 'parse() does not return inexistant positional arg');
    test.assertEquals(parsed.raw.get('blah'), undefined, 'parse() does not return inexistant option');
    test.assert(!parsed.raw.has(0), 'has() checks if a raw arg is set');
    test.assert(!parsed.raw.has('blah'), 'has() checks if a raw option is set');
    test.done();
});

casper.test.begin('parsing an basic argument list', 14, function(test) {
    var parsed = cli.parse(['foo', 'bar']);
    // clean
    test.assertEquals(parsed.args, ['foo', 'bar'], 'parse() returns expected positional args array');
    test.assertEquals(parsed.options, {}, 'parse() returns expected options object');
    test.assertEquals(parsed.get(0), 'foo', 'parse() retrieve first positional arg');
    test.assertEquals(parsed.get(1), 'bar', 'parse() retrieve second positional arg');
    test.assert(parsed.has(0), 'has() checks if an arg is set');
    test.assert(parsed.has(1), 'has() checks if an arg is set');
    test.assert(!parsed.has(2), 'has() checks if an arg is not set');
    // raw
    test.assertEquals(parsed.raw.args, ['foo', 'bar'], 'parse() returns expected positional raw args array');
    test.assertEquals(parsed.raw.options, {}, 'parse() returns expected raw options object');
    test.assertEquals(parsed.raw.get(0), 'foo', 'parse() retrieve first positional raw arg');
    test.assertEquals(parsed.raw.get(1), 'bar', 'parse() retrieve second positional raw arg');
    test.assert(parsed.raw.has(0), 'has() checks if a arw arg is set');
    test.assert(parsed.raw.has(1), 'has() checks if a arw arg is set');
    test.assert(!parsed.raw.has(2), 'has() checks if a arw arg is not set');
    test.done();
});

casper.test.begin('parsing some options', 12, function(test) {
    var parsed = cli.parse(['--foo=bar', '--baz']);
    // clean
    test.assertEquals(parsed.args, [], 'parse() returns expected positional args array');
    test.assertEquals(parsed.options, {foo: 'bar', baz: true}, 'parse() returns expected options object');
    test.assertEquals(parsed.get('foo'), 'bar', 'parse() retrieve an option value');
    test.assert(parsed.get('baz'), 'parse() retrieve boolean option flag');
    test.assert(parsed.has("foo"), 'has() checks if an option is set');
    test.assert(parsed.has("baz"), 'has() checks if an option is set');
    // raw
    test.assertEquals(parsed.raw.args, [], 'parse() returns expected positional raw args array');
    test.assertEquals(parsed.raw.options, {foo: 'bar', baz: true}, 'parse() returns expected options raw object');
    test.assertEquals(parsed.raw.get('foo'), 'bar', 'parse() retrieve an option raw value');
    test.assert(parsed.raw.get('baz'), 'parse() retrieve boolean raw option flag');
    test.assert(parsed.raw.has("foo"), 'has() checks if a raw option is set');
    test.assert(parsed.raw.has("baz"), 'has() checks if a raw option is set');
    test.done();
});

casper.test.begin('parsing an empty argument list', 8, function(test) {
    var parsed = cli.parse(['--&é"à=42===42']);
    // clean
    test.assertEquals(parsed.args, [], 'parse() returns expected positional args array');
    test.assertEquals(parsed.options, { '&é"à': "42===42" }, 'parse() returns expected options object');
    test.assertEquals(parsed.get('&é"à'), "42===42", 'parse() handles options with exotic names');
    test.assert(parsed.has('&é"à'), 'has() checks if an option is set');
    // raw
    test.assertEquals(parsed.raw.args, [], 'parse() returns expected positional raw args array');
    test.assertEquals(parsed.raw.options, { '&é"à': "42===42" }, 'parse() returns expected options raw object');
    test.assertEquals(parsed.raw.get('&é"à'), "42===42", 'parse() handles raw options with exotic names');
    test.assert(parsed.raw.has('&é"à'), 'has() checks if a raw option is set');
    test.done();
});

casper.test.begin('parsing commands containing args and options', 34, function(test) {
    var parsed = cli.parse(['foo & bar', 'baz & boz', '--universe=42',
                            '--lap=13.37', '--chucknorris', '--oops=false']);
    // clean
    test.assertEquals(parsed.args, ['foo & bar', 'baz & boz'], 'parse() returns expected positional args array');
    test.assertEquals(parsed.options, {
        universe: 42,
        lap: 13.37,
        chucknorris: true,
        oops: false }, 'parse() returns expected options object');
    test.assertEquals(parsed.get('universe'), 42, 'parse() can cast a numeric option value');
    test.assertEquals(parsed.get('lap'), 13.37, 'parse() can cast a float option value');
    test.assertType(parsed.get('lap'), "number", 'parse() can cast a boolean value');
    test.assert(parsed.get('chucknorris'), 'parse() can get a flag value by its option name');
    test.assertType(parsed.get('oops'), "boolean", 'parse() can cast a boolean value');
    test.assertEquals(parsed.get('oops'), false, 'parse() can cast a boolean value');
    test.assert(parsed.has(0), 'has() checks if an arg is set');
    test.assert(parsed.has(1), 'has() checks if an arg is set');
    test.assert(parsed.has("universe"), 'has() checks if an option is set');
    test.assert(parsed.has("lap"), 'has() checks if an option is set');
    test.assert(parsed.has("chucknorris"), 'has() checks if an option is set');
    test.assert(parsed.has("oops"), 'has() checks if an option is set');

    // drop()
    parsed.drop(0);
    test.assertEquals(parsed.get(0), 'baz & boz', 'drop() dropped arg');
    parsed.drop("universe");
    test.assert(!parsed.has("universe"), 'drop() dropped option');
    test.assert(!parsed.raw.has("universe"), 'drop() dropped raw option');
    test.assertEquals(parsed.args, ["baz & boz"], 'drop() did not affect other args');
    test.assertEquals(parsed.options, {
        lap: 13.37,
        chucknorris: true,
        oops: false
    }, 'drop() did not affect other options');

    // raw
    test.assertEquals(parsed.args.length, parsed.raw.args.length,
        'parse() cast and raw args share same length');
    test.assertEquals(Object.keys(parsed.options).length, Object.keys(parsed.raw.options).length,
        'parse() cast and raw options share same length');
    test.assertEquals(parsed.raw.args, ['baz & boz'],
        'parse() returns expected positional raw args array');
    test.assertEquals(parsed.raw.options, {
        lap: "13.37",
        chucknorris: true,
        oops: "false"
    }, 'parse() returns expected options raw object');
    test.assertEquals(parsed.raw.get('lap'), "13.37", 'parse() does not cast a raw float option value');
    test.assertType(parsed.raw.get('lap'), "string", 'parse() does not cast a numeric value');
    test.assert(parsed.raw.get('chucknorris'), 'parse() can get a flag value by its option name');
    test.assertType(parsed.raw.get('oops'), "string", 'parse() can cast a boolean value');
    test.assertEquals(parsed.raw.get('oops'), "false", 'parse() can cast a boolean value');

    // drop() for raw
    parsed.raw.drop(0);
    test.assertEquals(parsed.raw.get(0), undefined, 'drop() dropped raw arg');
    parsed.raw.drop("universe");
    test.assert(!parsed.raw.has("universe"), 'drop() dropped raw option');
    test.assertEquals(parsed.raw.args, [], 'drop() did not affect other raw args');
    test.assertEquals(parsed.raw.options, {
        lap: "13.37",
        chucknorris: true,
        oops: "false"
    }, 'drop() did not affect other raw options');
    parsed.raw.drop("lap");
    test.assert(!parsed.raw.has("lap"), 'drop() dropped raw option');
    test.assert(!parsed.has("lap"), 'drop() dropped cast option as well');

    test.done();
});

casper.test.begin('default values', 2, function(test) {
    var parsed = cli.parse(['foo', '--bar']);
    test.assertEquals(parsed.get(42, 'boz'), 'boz',
        'get() can return a default arg value');
    test.assertEquals(parsed.get('--zorg', 'boz'), 'boz',
        'get() can return a default option value');
    test.done();
});
