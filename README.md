# pretendr #

_Powerful JavaScript mocking_

## Install it ##

`npm install pretendr`.

## Use it ##

First include it in the usual way.

````javascript
var pretendr = require('pretendr');
````

Then mock your objects. You can pass in real objects but I prefer to create a dummy
with only the bits I need.

````javascript
var mockFs = pretendr({
	readFile : function () {},
	readFileSync : function () {}
});
````

`mockFs` now contains a `mock` property, which is what you pass in to your code for
testing as a substitute for the real thing.

````javascript
var fs = mockFs.mock;
fs.readFile('f.txt', cb);
fs.readFileSync('f.txt');
````

It also has a list of properties to help you with your testing. First, record
the calls. These are the most useful, but there are plenty of others.

````javascript
assert.equal(fs.readFile.calls[0].args[1], 'f.txt');
assert.equal(fs.readFile.calls[0].context, fs.mock);

// finish reading and pass in some data
mockFs.readFile.calls[0].callback(null, 'dummy data');
// or set the return value of the sync version before it's called
mockFs.readFileSync.returnValue('dummy data');
// or set a dummy function to run when it is called
mockFs.readFileSync.fake(function (filename) {
    var result;
    ...
    return result;
});
````

There are plenty of other features. To find out about them, have a look at the
spec in the `test` directory.

## Share it ##

**pretendr** is under the [MIT License](http://www.opensource.org/licenses/MIT).
[Fork it](https://github.com/nathanmacinnes/pretendr). Modify it. Pass it around.
