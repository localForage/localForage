echo '/*!
  localForage -- Offline Storage, Improved
  http://mozilla.github.io/localForage
  (c) 2013-2014 Mozilla, Apache License 2.0
*/
' > ./dist/localforage.js
cat ./vendor/promise.js ./src/drivers/*.js ./src/localforage.js >> ./dist/localforage.js
./node_modules/.bin/uglifyjs -v ./dist/localforage.js > ./dist/localforage.min.js

# Build adapters
cp ./src/adapters/backbone.js ./dist/backbone.localforage.js
./node_modules/.bin/uglifyjs ./dist/backbone.localforage.js > ./dist/backbone.localforage.min.js
