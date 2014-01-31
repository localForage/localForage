###
Capture multiple pages of google search results

Usage: $ casperjs googlepagination.coffee my search terms

(all arguments will be used as the query)
###

casper = require("casper").create(
    waitTimeout: 1000
    pageSettings:
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
)
currentPage = 1

if casper.cli.args.length is 0
    casper
        .echo("Usage: $ casperjs googlepagination.coffee my search terms")
        .exit(1)

terminate = ->
    @echo("that's all, folks.").exit();

processPage = ->
    @echo "capturing page #{currentPage}"
    @capture "google-results-p#{currentPage}.png"

    # don't go too far down the rabbit hole
    if currentPage >= 5 || !@exists "#pnnext"
        return terminate.call casper

    currentPage++
    @echo "requesting next page: #{currentPage}"
    url = @getCurrentUrl()
    @thenClick("#pnnext").then ->
        @waitFor (->
            url isnt @getCurrentUrl()
        ), processPage, terminate

casper.start "http://google.fr/", ->
    @fill 'form[action="/search"]',  q: casper.cli.args.join(" "), true

casper.waitForSelector "#pnnext", processPage, terminate

casper.run()
