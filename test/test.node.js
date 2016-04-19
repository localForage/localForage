/*exported Promise */
var Promise = require('es6-promise').Promise;
var localforage = require('../dist/localforage.nopromises.node');

// Note: All tests assume clear works
describe('nodejs.nopromises', function()
{
    beforeEach(function(done) {
        // Clear local storage between tests
        localforage.clear(function(err)
        {
            done(err);
        });
    });

    describe('Testing: Data API', function()
    {
        describe('Testing: setItem', function()
        {
            it('should save data (error check)', function(done) {
                localforage.setItem('key', 'value', function(err)
                {
                    return done(err);
                });
            });

            it('should save data (value check)', function(done) {
                localforage.setItem('key', 'value', function(err, value)
                {
                    if (value === 'value')
                    {
                        done();
                    }
                    else
                    {
                        done('Expected "value" got: ' + value);
                    }
                });
            });

            it('should override data (error check)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function(err)
                    {
                        return done(err);
                    });
                });
            });

            it('should override data (value check)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function(err, value)
                    {
                        if (value === 'value2')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "value2" got: ' + value);
                        }
                    });
                });
            });
        });

        describe('Testing: getItem', function()
        {
            it('should get null for invalid keys', function(done) {
                localforage.getItem('key', function(err, value)
                {
                    if (value === null)
                    {
                        done();
                    }
                    else
                    {
                        done('Expected "null" got: ' + value);
                    }
                });
            });

            it('should recall data (error check)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.getItem('key', function(err)
                    {
                        done(err);
                    });
                });
            });

            it('should recall data (value check)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.getItem('key', function(err, value)
                    {
                        if (value === 'value')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "value" got: ' + value);
                        }
                    });
                });
            });

            it('should recall overriden data (error check)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function() {
                        localforage.getItem('key', function(err)
                        {
                            done(err);
                        });
                    });
                });
            });

            it('should recall overriden data (value check)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function() {
                        localforage.getItem('key', function(err, value)
                        {
                            if (value === 'value2')
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "value2" got: ' + value);
                            }
                        });
                    });
                });
            });
        });

        describe('Testing: storage types', function()
        {
            it('should store arrays', function(done) {
                localforage.setItem('key', ['Saab', 'Volvo', 'BMW'], function() {
                    localforage.getItem('key', function(err, value)
                    {
                        if (value[1] === 'Volvo')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "Volvo" got: ' + value[1]);
                        }
                    });
                });
            });

            it('should store numbers', function(done) {
                localforage.setItem('key', 3.14, function() {
                    localforage.getItem('key', function(err, value)
                    {
                        if (value === 3.14)
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "3.14" got: ' + value);
                        }
                    });
                });
            });

            it('should store objects', function(done) {
                localforage.setItem('key', {C: '3PO'}, function() {
                    localforage.getItem('key', function(err, value)
                    {
                        if (value.C === '3PO')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected value.C === "3PO" got: ' + value.C);
                        }
                    });
                });
            });
        });

        describe('Testing: removeItem', function()
        {
            // NOTE: This behavior is a bit unexpected to me.
            it('should allow removing non-existing keys (without error)', function(done) {
                localforage.removeItem('key', function(err)
                {
                    done(err);
                });
            });

            it('should remove items (error check)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.removeItem('key', function(err)
                    {
                        done(err);
                    });
                });
            });

            it('should remove items (value check)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.removeItem('key', function() {
                        localforage.getItem('key', function(err, value) {
                            if (value === null)
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "null" got: ' + value);
                            }
                        });
                    });
                });
            });
        });

        describe('Testing: length', function()
        {
            it('should start out empty (error check)', function(done) {
                localforage.length(function(err)
                {
                    done(err);
                });
            });

            it('should start out empty (value check)', function(done) {
                localforage.length(function(err, numberOfKeys)
                {
                    if (numberOfKeys === 0)
                    {
                        done();
                    }
                    else
                    {
                        done('Expected "0" got: ' + numberOfKeys);
                    }
                });
            });

            it('should track length (1)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.length(function(err, numberOfKeys)
                    {
                        if (numberOfKeys === 1)
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "1" got: ' + numberOfKeys);
                        }
                    });
                });
            });

            it('should track length (2)', function(done) {
                localforage.setItem('key1', 'value', function() {
                    localforage.setItem('key2', 'value', function() {
                        localforage.length(function(err, numberOfKeys)
                        {
                            if (numberOfKeys === 2)
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "2" got: ' + numberOfKeys);
                            }
                        });
                    });
                });
            });

            it('should track length (overriden)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function() {
                        localforage.length(function(err, numberOfKeys)
                        {
                            if (numberOfKeys === 1)
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "1" got: ' + numberOfKeys);
                            }
                        });
                    });
                });
            });
        });

        describe('Testing: key', function()
        {
            // NOTE: Testing this corresponds to testing the inner workings, of
            //       the underlying DOMStorage, and violates isolated testing.
            it("isn't tested", function()
            {
            });
        });

        describe('Testing: keys', function()
        {
            it('should start out empty (error check)', function(done) {
                localforage.keys(function(err)
                {
                    done(err);
                });
            });

            it('should start out empty (value check)', function(done) {
                localforage.keys(function(err, keys)
                {
                    if (keys.length === 0)
                    {
                        done();
                    }
                    else
                    {
                        done('Expected "keys.length === 0" got: keys.length === ' + keys.length);
                    }
                });
            });

            it('should contain a key (length)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.keys(function(err, keys)
                    {
                        if (keys.length === 1)
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "keys.length === 1" got: keys.length === ' + keys.length);
                        }
                    });
                });
            });

            it('should contain a key (value)', function(done) {
                localforage.setItem('key', 'value', function() {
                    localforage.keys(function(err, keys)
                    {
                        if (keys[0] === 'key')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "key" got: ' + keys[0]);
                        }
                    });
                });
            });

            it('should contain two keys (length)', function(done) {
                localforage.setItem('key1', 'value', function() {
                    localforage.setItem('key2', 'value', function() {
                        localforage.keys(function(err, keys)
                        {
                            if (keys.length === 2)
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "keys.length === 2" got: keys.length === ' + keys.length);
                            }
                        });
                    });
                });
            });

            it('should contain two keys (value)', function(done) {
                localforage.setItem('key1', 'value', function() {
                    localforage.setItem('key2', 'value', function() {
                        localforage.keys(function(err, keys)
                        {
                            if (keys[0] === 'key1' && keys[1] === 'key2')
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "keyX" got: [' + keys[0] + ', ' + keys[1] + ']');
                            }
                        });
                    });
                });
            });

            it('should contain a key (overriden, length)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function() {
                        localforage.keys(function(err, keys)
                        {
                            if (keys.length === 1)
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "keys.length === 1" got: keys.length === ' + keys.length);
                            }
                        });
                    });
                });
            });

            it('should contain a key (overriden, value)', function(done) {
                localforage.setItem('key', 'value1', function() {
                    localforage.setItem('key', 'value2', function() {
                        localforage.keys(function(err, keys)
                        {
                            if (keys[0] === 'key')
                            {
                                done();
                            }
                            else
                            {
                                done('Expected "key" got: ' + keys[0]);
                            }
                        });
                    });
                });
            });
        });

        describe('Testing: iterate', function()
        {
            // TODO: Add tests for iterate
            it("isn't tested yet");
        });
    });

    describe('Testing: Settings API', function()
    {
        // NOTE: setDriver not tested; emulation only provides localStorage.
        // NOTE: The rest of config could not be tested in node.
        describe('Testing: createInstance', function()
        {
            it('should support multiple instances', function(done)
            {
                var store = localforage.createInstance({
                    name: 'nameHere'
                });
                var otherStore = localforage.createInstance({
                    name: 'otherName'
                });
                store.setItem('key', 'value1', function(err, value1) {
                    otherStore.setItem('key', 'value2', function(err, value2)
                    {
                        if (value1 === 'value1' && value2 === 'value2')
                        {
                            done();
                        }
                        else
                        {
                            done('Expected "value1:value" got: ' + value1 + ':' + value2);
                        }
                    });
                });
            });
        });

        it("isn't tested", function()
        {
        });
    });

    describe('Testing: Custom Driver API', function()
    {
        // NOTE: defineDriver not tested; emulation only provides localStorage.
        it("isn't tested", function()
        {
        });
    });
});
