'use strict'

casper.test.begin "Testing localforage component build", (test) ->

  casper.start "#{casper.TEST_URL}test.component.html", ->
    test.info "Test component version"
    test.assertEval ->
      typeof window.localforage.driver is 'function' and
      typeof window.localforage._initStorage is 'function' and
      typeof window.localforage.getItem is 'function' and
      typeof window.localforage.setItem is 'function' and
      typeof window.localforage.clear is 'function' and
      typeof window.localforage.length is 'function' and
      typeof window.localforage.removeItem is 'function' and
      typeof window.localforage.key is 'function'
    , "component version has localforage API intact"

  casper.run ->
    test.done()