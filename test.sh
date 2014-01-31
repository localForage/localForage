NODE_ENV=test ./node_modules/.bin/coffee test/server.coffee &
SISYPHUS_PID=$!
vendor/casperjs/bin/casperjs test --engine=phantomjs ./test/init.coffee ./test/test.all.*.coffee ./test/test.phantomjs.*.coffee
vendor/casperjs/bin/casperjs test --engine=slimerjs ./test/init.coffee ./test/test.all.*.coffee ./test/test.slimerjs.*.coffee
kill $SISYPHUS_PID
echo ''
