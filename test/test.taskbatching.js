/* global beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
describe('Task Batching', function() {
    'use strict';
    var MAX_TIME_TO_ADD_TASK = 150;
    var SIMULATED_TRANSACTION_TIME = 400;

    beforeEach(function(done) {
        if (Modernizr.indexeddb) {
            localforage.setDriver(localforage.INDEXEDDB, function() {
                localforage._batches = []; //This array remembers what batches are being sent
                                           //to the _updateDatabase stub.
                localforage._updateDatabase = function(batch) {
                    localforage._batches.push(batch);
                    return {
                        then: function(resolve) {
                            setTimeout(function() {
                                resolve();
                            }, SIMULATED_TRANSACTION_TIME);
                        }
                    };
                };
                done();
            });
        } else {
            done();
        }
    });

    it('Starts a single task within MAX_TIME_TO_ADD_TASK if not running', function(done) {
        if (Modernizr.indexeddb) {
            expect(localforage._taskQueue.length).to.be(0);
            expect(localforage._running).to.be(false);
            localforage.setItem('foo', 'bar');
            setTimeout(function() {
                expect(localforage._running).to.be(true);
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0] instanceof Array).to.be(true);
                expect(localforage._batches[0].length).to.be(1);
                expect(localforage._batches[0][0]).to.be.an('object');
                expect(localforage._batches[0][0].action).to.be('put');
                expect(localforage._batches[0][0].key).to.be('foo');
                expect(localforage._batches[0][0].value).to.be('bar');
                expect(localforage._batches[0][0].resolve).to.be.a('function');
                expect(localforage._batches[0][0].reject).to.be.a('function');

                expect(localforage._taskQueue.length).to.be(0);
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('does not execute a single task within MAX_TIME_TO_ADD_TASK if running', function(done) {
        if (Modernizr.indexeddb) {
            expect(localforage._taskQueue.length).to.be(0);
            expect(localforage._running).to.be(false);
            localforage._running = true;
            localforage.setItem('foo', 'bar');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(0);

                expect(localforage._taskQueue.length).to.be(1);
                expect(localforage._taskQueue[0].action).to.be('put');
                expect(localforage._taskQueue[0].key).to.be('foo');
                expect(localforage._taskQueue[0].value).to.be('bar');
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('does not start a batch-of-one, even when not running', function(done) {
        if (Modernizr.indexeddb) {
            localforage._running = false;
            localforage.setItem('foo', 'bar');
            localforage.removeItem('foo1');
            localforage.setItem('foo2', 'bar2');
            localforage.removeItem('foo3');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0].length).to.be(4);
                expect(localforage._batches[0][0].action).to.be('put');
                expect(localforage._batches[0][0].key).to.be('foo');
                expect(localforage._batches[0][0].value).to.be('bar');
                expect(localforage._batches[0][1].action).to.be('delete');
                expect(localforage._batches[0][1].key).to.be('foo1');
                expect(localforage._batches[0][2].action).to.be('put');
                expect(localforage._batches[0][2].key).to.be('foo2');
                expect(localforage._batches[0][2].value).to.be('bar2');
                expect(localforage._batches[0][3].action).to.be('delete');
                expect(localforage._batches[0][3].key).to.be('foo3');
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('batches tasks together when possible', function(done) {
        if (Modernizr.indexeddb) {
            localforage._running = true;
            localforage.setItem('foo', 'bar');
            localforage.removeItem('foo1');
            localforage.setItem('foo2', 'bar2');
            localforage._running = false;
            localforage.removeItem('foo3');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0].length).to.be(4);
                expect(localforage._batches[0][0].action).to.be('put');
                expect(localforage._batches[0][0].key).to.be('foo');
                expect(localforage._batches[0][0].value).to.be('bar');
                expect(localforage._batches[0][1].action).to.be('delete');
                expect(localforage._batches[0][1].key).to.be('foo1');
                expect(localforage._batches[0][2].action).to.be('put');
                expect(localforage._batches[0][2].key).to.be('foo2');
                expect(localforage._batches[0][2].value).to.be('bar2');
                expect(localforage._batches[0][3].action).to.be('delete');
                expect(localforage._batches[0][3].key).to.be('foo3');
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('stops before an already affected key', function(done) {
        if (Modernizr.indexeddb) {
            localforage._running = true;
            localforage.setItem('foo', 'bar');
            localforage.removeItem('foo1');
            localforage.setItem('foo1', 'bar1');
            localforage._running = false;
            localforage.removeItem('foo3');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0].length).to.be(2);
                expect(localforage._batches[0][0].action).to.be('put');
                expect(localforage._batches[0][0].key).to.be('foo');
                expect(localforage._batches[0][0].value).to.be('bar');
                expect(localforage._batches[0][1].action).to.be('delete');
                expect(localforage._batches[0][1].key).to.be('foo1');

                expect(localforage._taskQueue.length).to.be(2);
                expect(localforage._taskQueue[0].action).to.be('put');
                expect(localforage._taskQueue[0].key).to.be('foo1');
                expect(localforage._taskQueue[0].value).to.be('bar1');
                expect(localforage._taskQueue[1].action).to.be('delete');
                expect(localforage._taskQueue[1].key).to.be('foo3');
                localforage._taskQueue = [];
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('stops before a clear', function(done) {
        if (Modernizr.indexeddb) {
            localforage._running = true;
            localforage.setItem('foo', 'bar');
            localforage.removeItem('foo1');
            localforage.clear();
            localforage._running = false;
            localforage.removeItem('foo3');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0].length).to.be(2);
                expect(localforage._batches[0][0].action).to.be('put');
                expect(localforage._batches[0][0].key).to.be('foo');
                expect(localforage._batches[0][0].value).to.be('bar');
                expect(localforage._batches[0][1].action).to.be('delete');
                expect(localforage._batches[0][1].key).to.be('foo1');

                expect(localforage._taskQueue.length).to.be(2);
                expect(localforage._taskQueue[0].action).to.be('clear');
                expect(localforage._taskQueue[1].action).to.be('delete');
                expect(localforage._taskQueue[1].key).to.be('foo3');
                localforage._taskQueue = [];
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });

    it('executes a clear separately', function(done) {
        if (Modernizr.indexeddb) {
            localforage._running = true;
            localforage.clear();
            localforage.setItem('foo', 'bar');
            localforage.removeItem('foo1');
            localforage._running = false;
            localforage.removeItem('foo3');
            setTimeout(function() {
                expect(localforage._batches.length).to.be(1);
                expect(localforage._batches[0].length).to.be(1);
                expect(localforage._batches[0][0].action).to.be('clear');

                expect(localforage._taskQueue.length).to.be(3);
                expect(localforage._taskQueue[0].action).to.be('put');
                expect(localforage._taskQueue[0].key).to.be('foo');
                expect(localforage._taskQueue[0].value).to.be('bar');
                expect(localforage._taskQueue[1].action).to.be('delete');
                expect(localforage._taskQueue[1].key).to.be('foo1');
                expect(localforage._taskQueue[2].action).to.be('delete');
                expect(localforage._taskQueue[2].key).to.be('foo3');
                localforage._taskQueue = [];
                setTimeout(function() {
                    done();
                }, SIMULATED_TRANSACTION_TIME);
            }, MAX_TIME_TO_ADD_TASK);
        } else {
            done();
        }
    });
});
