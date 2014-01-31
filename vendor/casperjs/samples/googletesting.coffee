# Google sample testing.
#
# Usage:
#     $ casperjs test googletesting.coffee
casper.test.begin 'Google search retrieves 10 or more results', 5, (test) ->
    casper.start "http://www.google.fr/", ->
        test.assertTitle "Google", "google homepage title is the one expected"
        test.assertExists 'form[action="/search"]', "main form is found"
        @fill 'form[action="/search"]', q: "foo", true

    casper.then ->
        test.assertTitle "foo - Recherche Google", "google title is ok"
        test.assertUrlMatch /q=foo/, "search term has been submitted"
        test.assertEval (->
            __utils__.findAll("h3.r").length >= 10
        ), "google search for \"foo\" retrieves 10 or more results"

    casper.run -> test.done()

casper.test.begin "Casperjs.org is first ranked", 1, (test) ->
    casper.start "http://www.google.fr/", ->
        @fill "form[action=\"/search\"]", q: "casperjs", true

    casper.then ->
        test.assertSelectorContains ".g", "casperjs.org", "casperjs.org is first ranked"

    casper.run -> test.done()

