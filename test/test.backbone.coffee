'use strict'

casper.test.begin "Testing Backbone data adapter", (test) ->
  casper.start "#{casper.TEST_URL}test.backbone.html", ->
    test.info "Testing using global scope (no require.js)"

    test.assertEval ->
      typeof Backbone.localforage is 'function'
    , "localforage storage adapter is attached to Backbone.localforage"

  casper.then ->
    @evaluate ->
      michael = new Model
        name: 'Michael Bolton'
        job: 'Singer'

      Models.add michael
      michael.save()

    test.assertRaises ->
      OnlineModel = Backbone.Model.extend()

      OnlineModelCollection = Backbone.Collection.extend
        model: OnlineModel

      bob = new OnlineModel()
    , [], 'Backbone.Sync throws an error when no offlineStore or URL is specified'

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
