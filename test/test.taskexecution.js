/* global beforeEach:true, describe:true, expect:true, it:true, Modernizr:true */
describe('Task Execution', function() {
    'use strict';

    beforeEach(function(done) {
        if (Modernizr.indexeddb) {
            localforage.setDriver(localforage.INDEXEDDB, function() {
                done();
            });
        } else {
            done();
        }
    });

    it('can execute a setItem (put) task', function(done) {
        if (Modernizr.indexeddb) {
            localforage._updateDatabase([
                {
                    action: 'clear'
                }
            ]).then(function() {
                return localforage._updateDatabase([
                    {
                        action: 'put',
                        key: 'foo',
                        value: 'bar'
                    }
                ]);
            }).then(function() {
                 localforage.getItem('foo', function(err, value) {
                     expect(value).to.be('bar');
                     // continued in next test!
                     done();
                 });
             });
        } else {
            done();
        }
    });

    it('can execute a removeItem (delete) task', function(done) {
        // continued from previous test!
        if (Modernizr.indexeddb) {
            localforage._updateDatabase([
                 {
                     action: 'delete',
                     key: 'foo'
                 }
             ]).then(function() {
                 localforage.getItem('foo', function(err, value) {
                     expect(value).to.be(null);
                     done();
                 });
             });
        } else {
            done();
        }
    });

    it('can execute a clear task', function(done) {
        if (Modernizr.indexeddb) {
            localforage._updateDatabase([
                 {
                     action: 'put',
                     key: 'foo',
                     value: 'bar'
                 }
             ]).then(function() {
                 localforage.length(function(err, value) {
                     expect(value).to.be(1);
                     localforage._updateDatabase([
                         {
                             action: 'clear'
                         }
                     ]).then(function() {
                         localforage.length(function(err, value) {
                             expect(value).to.be(0);
                             done();
                         });
                     });
                 });
             });
        } else {
            done();
        }
    });

});
