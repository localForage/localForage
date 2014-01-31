test: build
	sh ./test.sh

build:
	sh ./build.sh

intern:
	node node_modules/intern/client.js config=test/intern
