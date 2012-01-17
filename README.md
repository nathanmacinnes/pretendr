#MOCKERY
_A simple JavaScript mocking function_

MOCKERY will mock your objects for you. It can be used in any JavaScript
testing framework. It's easy.

##Usage

````javascript
var myObj = {
    aFunction : function () {
        // do some stuff
    }
};
````

Then in the browser:

````javascript
var myMock = MOCKERY(myObj);
````

Or in node:

````javascript
var mockery = require('mockery');
mockery.mock(myObj);
````

Now `myMock.aFunction()` doesn't do stuff.

MOCKERY works by creating a _deep copy_ of your object, swapping the
functions for new ones which are embellished with helpful mocking features.

###Return values
To set a return value, use `myMock.aFunction.setReturnValue('a string');`. Now
calling `myMock.aFunction()` returns `'a string'`. You can also pass multiple
values, and the function will loop through them:

````javascript
myMock.aFunction.setReturnValue('one', 'two', 'three');

myMock.aFunction(); // 'one'
myMock.aFunction(); // 'two'
myMock.aFunction(); // 'three'
myMock.aFunction(); // 'one'
````

Or use a function to set the return value:

````javascript
myMock.aFunction.setFunction(function (arg1, arg2) {
    if (arg1 === 'one' && arg2 === 'two') {
        return true;
    }
    return false;
});
````

Of course you could use `setFunction` to do other stuff too, but before you do,
read the next section.

###Call monitoring
All calls to mocked functions are recorded in the `calls` property, which is an
array of function calls. To get the number of times a function has been called
`myMock.aFunction.calls.length`.

You can also get the argument values of each call:

````javascript
myMock.aFunction("here's an argument", true);
myMock.aFunction.calls[0]; // => ["here's an argument", true]
````

As a shorthand, `calls.last` is the last element of the array (ie, the most
recent call).

###Recursion
MOCKERY recursively mocks your objects. So if your object contains more
objects, they too will be mocked. If it contains an array, a new array will
be created and it's elements will all be mocked. Primitive values are copied
from your object to the mock object, and you can change these at will.

##Installation

###browser
Download
[mockery.js](http://github.com/nathanmacinnes/Mockery/blob/master/source/mockery.js)
and include it in your test suite's HTML file.

###node.js
To install via NPM, `npm install mockery`. Then include it in your test files:
`var mockery = require('mockery.js');`.

Or `git clone git://github.com/nathanmacinnes/Mockery.git`. Then
`var mockery = require('path/to/mockery/source/mockery.js');`.

##Known issues/To-do

* Circular references will cause infinite recursion. Make sure there are no
circular references in your objects until this is fixed.
* A class mocking interface would be nice. There're a few issues to work out
before that can happen though.
* I've just implemented including properties in the prototype chain in the
mocks. You can do this by passing `true` as the second argument to `MOCKERY`.
There is huge potential for bugs in this though, because the implementation is
crude, so it needs to be made more robust.
