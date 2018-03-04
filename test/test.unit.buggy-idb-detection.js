/* global describe:true, it:true */
import * as assert from 'assert';
import { isBuggySafariVersion } from '../src/utils/isIndexedDBValid';
import { validIDB, invalidIDB } from './fixtures/user-agent-strings';

describe('Buggy safari IndexedDB detection tests', () => {
    Object.keys(validIDB).forEach(browserName => {
        const browserStrings = validIDB[browserName];
        Object.keys(browserStrings).forEach(versionNumber => {
            const browserInfo = browserStrings[versionNumber];

            it(`should detect ${browserName} ${versionNumber} as supporting IDB`, () => {
                browserInfo.userAgentStrings.forEach(userAgentString =>
                    assert.equal(!isBuggySafariVersion(userAgentString), true)
                );
            });
        });
    });

    Object.keys(invalidIDB).forEach(browserName => {
        const browserStrings = invalidIDB[browserName];
        Object.keys(browserStrings).forEach(versionNumber => {
            const browserInfo = browserStrings[versionNumber];

            it(`should detect ${browserName} ${versionNumber} as not supporting IDB`, () => {
                browserInfo.userAgentStrings.forEach(userAgentString =>
                    assert.equal(!isBuggySafariVersion(userAgentString), false)
                );
            });
        });
    });
});
