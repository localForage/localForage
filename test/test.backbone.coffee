'use strict'

casper.test.begin "Testing Backbone data adapter", (test) ->
  casper.start "#{casper.TEST_URL}test.backbone.html", ->
    test.info "Testing using global scope (no require.js)"

    test.assertEval ->
      typeof Backbone.localforage is 'object'
    , "localforage storage adapter is attached to Backbone.localforage"

    test.assertEval ->
      typeof Backbone.localforage.sync is 'function'
    , "localforage sync function is attached to Backbone.localforage"

  casper.then ->
    @evaluate ->
      michael = new Model
        name: 'Michael Bolton'
        job: 'Singer'

      Models.add michael
      michael.save()

  casper.reload()

  casper.then ->
    @waitForSelector '#ready', ->
      test.assertEval ->
        results = Models.where({name: 'Michael Bolton'})
        results[0].get('job') is "Singer"
      , "Backbone adapter should persist data after a reload"

  casper.then ->
    @waitForSelector '#ready', ->
      @evaluate ->
        results = Models.where({name: 'Michael Bolton'})

        results[0].destroy()
        Models.reset()

  casper.wait 300

  casper.then ->
    test.assertEval ->
      results = Models.where({name: 'Michael Bolton'})
      results.length is 0
    , "Backbone adapter should delete data after model is removed"

  casper.run ->
    test.done()
