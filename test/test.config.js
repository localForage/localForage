/* global beforeEach:true, describe:true, expect:true, it:true */
describe('Config API', function() {
    'use strict';

    beforeEach(function() {
        
    });

    it('returns the default values', function() {
        expect(localforage.config('description')).to.be('');
        expect(localforage.config('name')).to.be('localforage');
        expect(localforage.config('size')).to.be(4980736);
        expect(localforage.config('storeName')).to.be('keyvaluepairs');
        expect(localforage.config('version')).to.be(1.0);
    });
});
