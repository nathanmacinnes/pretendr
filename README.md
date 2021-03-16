# pretendr #

_Powerful JavaScript mocking_

![travis build status](https://travis-ci.org/nathanmacinnes/pretendr.svg)

## Install it ##

`npm install pretendr`.

## Use it ##

````javascript
var pretendr = require('pretendr');
````

Mock your objects. You can pass in real objects (`pretendr(require("fs"))`) but
I prefer to keep mocks to a minimum so I know exactly what my code is doing.

````javascript
var mockFs = pretendr({
    appendFile : function () {},
    createReadStream : function () {},
	readFile : function () {},
	readFileSync : function () {}
});
````

Mock objects, accessed via the `mock` property (or `Mock` for classes), are indistinguishable from the real thing. All your observer properties/methods are
on the base object.

````javascript
var fs = mockFs.mock;
fs.readFile('f.txt', cb);
fs.readFileSync('f.txt');
````

It works well with [**injectr**](https://github.com/nathanmacinnes/injectr),
which allows you to pass in your mocks when testing.

````js
var myLib = injectr("../lib/mylib.js", {
    fs : mockFs.mock
});
````

Or you can use whichever dependency injection method you're used to.

Now let's monitor the calls:

````javascript
assert.ok(fs.readFile.called);
assert.equal(fs.readFile.calls[0].args[1], 'f.txt');
````

Now lets run the callback, then test that it did what we expect:

````javascript
fs.readFile.calls[0].callback();
assert.ok(fs.appendFile.calledOnce);
````

We can set return values:
````javascript
mockFs.readFileSync.returnValue("some text");
// or
mockFs.readFileSync.fake(function (filename) {
    if (filename === "f.txt") {
      return "some text";
    }
    return "other text";
});
````

Templates allow you to create a new pretendr object each time the function is
run:
````js
mockFs.createReadStream.template({
    on : function () {}
});
````

Then retrieve your created pretendr:

````js
var mockRs = mockFs.createReadStream.calls[0].instance;
assert.equal(mockRs.calls[0].args[0], "data");
````

If you have lots of function calls and you only want to test one of them, use
`findCall` to find a call by it's arguments:

````js
mockFs.findCall(['somefile.txt']).callback();
````

`findCall` can also take a number for a number of arguments, or a function which
should return true for each matching argument.

## Share it ##

**pretendr** is under the [MIT License](http://www.opensource.org/licenses/MIT).
[Fork it](https://github.com/nathanmacinnes/pretendr). Modify it. Pass it
around.
