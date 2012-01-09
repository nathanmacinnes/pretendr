MOCKERY
=======
_A simple JavaScript mocking function_

MOCKERY will mock your objects for you. It can be used in any JavaScript
testing framework. It's easy:

````javascript
var myObj = {
    aFunction : function () {
        // do some stuff
    }
};
var myMock = MOCKERY(myObj);
````

Now `myMock.aFunction()` doesn't do stuff. If you wanted, you could make
`myObj = myMock` so that your scripts will use it straight away under testing.

Return values
-------------
To set a return value, `myMock.aFunction.setReturnValue('a string');`. Now
calling `myMock.aFunction()` returns `'a string'`. You can also pass multiple
values:

````javascript
myMock.aFunction.setReturnValue('one', 'two', 'three');

myMock.aFunction(); // 'one'
myMock.aFunction(); // 'two'
myMock.aFunction(); // 'three'
myMock.aFunction(); // 'one'
myMock.aFunction(); // 'two'
myMock.aFunction(); // 'three'
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
read about call monitoring below.

Call monitoring
---------------

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

Recursion
---------
MOCKERY recursively mocks your objects. So if your object contains more
objects, they too will be mocked. If it contains an array, a new array will
be created and it's elements will all be mocked. Primitive values are copied
from your object to the mock object, and you can change these at will.

Known issues/To-do
------------------
* Circular references will cause infinite recursion. Make sure there are no
circular references in your objects until this is fixed.
* A class mocking interface would be nice. There're a few issues to work out
before that can happen though.