/* global beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
describe('Task Queueing', function() {
    'use strict';

    beforeEach(function(done) {
        if (Modernizr.indexeddb) {
            localforage.setDriver(localforage.INDEXEDDB, function() {
                localforage._nextBatch = function() {
                };
                done();
            });
        } else {
            done();
        }
    });

    it('the _taskQueue is initially empty', function(done) {
        if (Modernizr.indexeddb) {
            expect(localforage._taskQueue instanceof Array).to.be(true);
            expect(localforage._taskQueue.length).to.be(0);
        }
        done();
    });

    it('does not queue getItem tasks', function(done) {
        if (Modernizr.indexeddb) {
            localforage.getItem('foo');
            expect(localforage._taskQueue.length).to.be(0);
        }
        done();
    });

    it('queues setItem tasks synchronously', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar');
            expect(localforage._taskQueue.length).to.be(1);
            expect(localforage._taskQueue[0]).to.be.an('object');
            expect(localforage._taskQueue[0].action).to.be('put');
            expect(localforage._taskQueue[0].key).to.be('foo');
            expect(localforage._taskQueue[0].value).to.be('bar');
            expect(localforage._taskQueue[0].resolve).to.be.a('function');
            expect(localforage._taskQueue[0].reject).to.be.a('function');
        }
        done();
    });

    it('queues removeItem tasks synchronously', function(done) {
        if (Modernizr.indexeddb) {
            localforage.removeItem('foo');
            expect(localforage._taskQueue.length).to.be(1);
            expect(localforage._taskQueue[0]).to.be.an('object');
            expect(localforage._taskQueue[0].action).to.be('delete');
            expect(localforage._taskQueue[0].key).to.be('foo');
            expect(localforage._taskQueue[0].resolve).to.be.a('function');
            expect(localforage._taskQueue[0].reject).to.be.a('function');
        }
        done();
    });

    it('queues clear tasks synchronously', function(done) {
        if (Modernizr.indexeddb) {
            localforage.clear();
            expect(localforage._taskQueue.length).to.be(1);
            expect(localforage._taskQueue[0]).to.be.an('object');
            expect(localforage._taskQueue[0].action).to.be('clear');
            expect(localforage._taskQueue[0].resolve).to.be.a('function');
            expect(localforage._taskQueue[0].reject).to.be.a('function');
        }
        done();
    });

    it('resolves tasks when they succeed [CALLBACK]', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar', function(err, result) {
                expect(err).to.be(null);
                expect(result).to.be('yep');
                done();
            });
            localforage._taskQueue[0].resolve('yep');
        } else {
            done();
        }
    });

    it('rejects tasks when they fail [CALLBACK]', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar', function(err) {
                expect(err).to.be('nope');
                done();
            });
            localforage._taskQueue[0].reject('nope');
        } else {
            done();
        }
    });

    it('resolves tasks when they succeed [PROMISE]', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar').then(function(result) {
                expect(result).to.be('yep');
                done();
            }, function() {
                expect('get here').to.be(false);
            });
            localforage._taskQueue[0].resolve('yep');
        } else {
            done();
        }
    });

    it('rejects tasks when they fail [PROMISE]', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar').then(function() {
                expect('get here').to.be(false);
            }, function(err) {
                expect(err).to.be('nope');
                done();
            });
            localforage._taskQueue[0].reject('nope');
        } else {
            done();
        }
    });

    it('can queue multiple requests', function(done) {
        if (Modernizr.indexeddb) {
            localforage.setItem('foo', 'bar').then(function() {
                expect('get here').to.be(false);
            }, function(err) {
                expect(err).to.be('nope1');
            });
            localforage.setItem('foo2', 'bar2').then(function() {
                expect('get here').to.be(false);
            }, function(err) {
                expect(err).to.be('nope2');
            });
            localforage.clear().then(function() {
            }, function() {
                expect('get here').to.be(false);
            });
            localforage.removeItem('foo').then(function() {
                done();
            }, function() {
                expect('get here').to.be(false);
            });
            localforage.clear(function(err) {
                expect(err).to.be('nope3');
                done();
            });
            expect(localforage._taskQueue.length).to.be(5);

            expect(localforage._taskQueue[0].action).to.be('put');
            expect(localforage._taskQueue[0].key).to.be('foo');
            expect(localforage._taskQueue[0].value).to.be('bar');

            expect(localforage._taskQueue[1].action).to.be('put');
            expect(localforage._taskQueue[1].key).to.be('foo2');
            expect(localforage._taskQueue[1].value).to.be('bar2');

            expect(localforage._taskQueue[2].action).to.be('clear');

            expect(localforage._taskQueue[3].action).to.be('delete');
            expect(localforage._taskQueue[3].key).to.be('foo');

            expect(localforage._taskQueue[4].action).to.be('clear');

            localforage._taskQueue[0].reject('nope1');
            localforage._taskQueue[1].reject('nope2');
            localforage._taskQueue[2].resolve('yep1');
            localforage._taskQueue[3].resolve('yep2');
            localforage._taskQueue[4].reject('nope3');
        } else {
            done();
        }
    });

});
