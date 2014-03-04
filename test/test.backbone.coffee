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

  casper.thenOpen "#{casper.TEST_URL}backbone-example.html", ->
    test.info "Test the Backbone example (examples/backbone-example.html)"

    @waitForSelector '.content', ->
      # Fill the content form and test it saves the content without error.
      casper.fill '.content form', {content: 'testing'}, true

  casper.reload()

  casper.then ->
    @waitForSelector '.content .saved-data', ->
      test.assertEval ->
        $('.saved-data').length is 1
      , "Backbone example saves a piece of data between page loads"

      test.assertEval ->
        $('.saved-data').text() is 'testing'
      , "Data saved in Backbone is retrieved properly"

    @evaluate ->
      localforage.clear()

  casper.wait 200

  casper.reload()

  casper.then ->
    @waitForSelector '.content', ->
      test.assertEval ->
        $('.saved-data').length is 0
      , "After running clear() on localforage, no saved-data divs exist"

  casper.run ->
    test.done()
