NODE_ENV=test ./node_modules/.bin/coffee test/server.coffee &
SISYPHUS_PID=$!
vendor/casperjs/bin/casperjs test --web-security=no test/init.coffee test/test.*.coffee
kill $SISYPHUS_PID
echo ''
