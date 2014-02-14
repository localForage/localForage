NODE_ENV=test ./node_modules/.bin/coffee test/server.coffee &
SISYPHUS_PID=$!
# Run localStorage tests with WebKit, along with the rest of the tests, using
# WebKit (localStorage will be the default option selected by test.api.coffee
# in this case)
vendor/casperjs/bin/casperjs test --engine=phantomjs ./test/init.coffee ./test/test.*.coffee
r1=$?
# # Run WebSQL tests using WebKit
vendor/casperjs/bin/casperjs test --engine=phantomjs --driver=webSQLStorage --driver-name=WebSQL --url=websql ./test/init.coffee ./test/test.api.coffee
r2=$?
# Run localStorage tests using Gecko
vendor/casperjs/bin/casperjs test --engine=slimerjs --driver=localStorageWrapper --driver-name=localStorage --url=localstorage ./test/init.coffee ./test/test.api.coffee
r3=$?
# Run IndexedDB tests using Gecko
vendor/casperjs/bin/casperjs test --engine=slimerjs --driver=asyncStorage --driver-name=IndexedDB --url=indexeddb ./test/init.coffee ./test/test.api.coffee
r4=$?
kill $SISYPHUS_PID
echo ''

if [ $r1 -eq 0 -a $r2 -eq 0 -a $r3 -eq 0 -a $r4 -eq 0 ]
then
	echo 'All tests passed! Yay! ^_^'
	echo ''
	exit 0
else
	echo 'Some tests failed. :-('
	echo ''
	exit 1
fi
