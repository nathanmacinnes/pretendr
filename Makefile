test:
	./node_modules/.bin/mocha

lint:
	./node_modules/.bin/jslint ./lib/pretendr.js ./test/spec.js

.PHONY: test
