NODE_ENV=test ./node_modules/.bin/coffee test/server.coffee &
SISYPHUS_PID=$!
# Run localStorage tests with WebKit
vendor/casperjs/bin/casperjs test --engine=phantomjs --driver=localStorageWrapper --driver-name=localStorage --url=localstorage ./test/init.coffee ./test/test.*.coffee
# Run WebSQL tests using WebKit
vendor/casperjs/bin/casperjs test --engine=phantomjs --driver=webSQLStorage --driver-name=WebSQL --url=websql ./test/init.coffee ./test/test.*.coffee
# Run localStorage tests using Gecko
vendor/casperjs/bin/casperjs test --engine=slimerjs --driver=localStorageWrapper --driver-name=localStorage --url=localstorage ./test/init.coffee ./test/test.*.coffee
# Run IndexedDB tests using Gecko
vendor/casperjs/bin/casperjs test --engine=slimerjs --driver=asyncStorage --driver-name=IndexedDB --url=indexeddb ./test/init.coffee ./test/test.*.coffee
kill $SISYPHUS_PID
echo ''
