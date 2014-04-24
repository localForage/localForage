'use strict'

casper.test.begin "Testing iFrame handling", (test) ->
  casper.start "#{casper.TEST_URL}test.iframe.html", ->
    test.info "Ensure localForage works inside iframes"

  casper.wait 350

  casper.withFrame 'iframe', ->
    test.assertSelectorHasText "#myText", "I have been set",
                               "localForage can run in iFrames"

  casper.run ->
    test.done()
