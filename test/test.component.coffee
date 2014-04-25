'use strict'

casper.test.begin "Testing localforage component build", (test) ->
  casper.start "#{casper.TEST_URL}test.component.html", ->
    test.info "Test component version"

    test.assertEval ->
      localforage = require "localforage"

      typeof localforage.driver is 'function' and
      typeof localforage._initStorage is 'function' and
      typeof localforage.getItem is 'function' and
      typeof localforage.setItem is 'function' and
      typeof localforage.clear is 'function' and
      typeof localforage.length is 'function' and
      typeof localforage.removeItem is 'function' and
      typeof localforage.key is 'function'
    , "component version has localforage API intact"

    test.assertEval ->
      localforage = require "localforage"

      typeof localforage.length() is 'object' and 
      localforage.length().then isnt undefined
    , "localforage methods return a Promise"

  casper.run ->
    test.done()
