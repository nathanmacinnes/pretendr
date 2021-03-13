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

Each function creates a mock function and each object creates a mock object. (As
a shortcut, `pretendr()` creates a standalone mock function which you can use as
a dummy callback.)

`mockFs` contains a `mock` property, which is what you pass in to your code for testing as a substitute for the real thing. This is virtually indistinguishable
to your code from the object you are mocking.

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
assert.equal(fs.readFile.calls[0].args[1], 'f.txt');
assert.equal(fs.appendFile.calls.length, 0);
````

And run the callback, then test that it did what we expect:

````javascript
fs.readFile.calls[0].callback();
assert.equal(fs.appendFile.calls.length, 1);
````

We can set return values:
````javascript
mockFs.readFileSync.returnValue("some text");
// or
mockFs.readFileSync.fake(function () {
    // arguments and context are correctly passed to this function
    return "some text";
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
var mockRs = mockFs.createReadStream.calls[0].pretendr;
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
