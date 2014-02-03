echo '/*!
 localForage
 (c) 2013-2014 Mozilla
 License: Apache License
 */
' > ./dist/localForage.js
cat ./vendor/promise.js ./src/drivers/*.js ./src/localForage.js >> ./dist/localForage.js
uglifyjs ./dist/localForage.js > ./dist/localForage.min.js
