# pretendr examples #

The following examples show how to use **pretendr**. They use expect.js to show
what pretendr does.

````javascript
var pretendr = require('pretendr'),
	expect = require('expect.js');
````

## Mocking objects ##

````javascript
var real = {
	'a' : {},
	'b' : function () {},
	'c' : {
		'd' : {
			e : 'some static value'
		}
	}
});
var p = pretendr(real);
````

The **pretendr** object will have a `mock` property, containing the mock copy
of the object to pass into your tests.

````javascript
expect(p.mock).to.have.property('a');
expect(p.a).to.not.equal(p.mock.a);
````

This is a deep copy (of course).

````javascript
expect(p.mock.c.d.e).to.equal('some static value');
````

Functions are substituted for their mock functions (see Mocking Functions
below).

````javascript
expect(p.b).to.be.a('function')
	.and.to.have.property('calls');
````

Every property of the base function has a `mock` property pointing to its
corresponding mock, so you can pass any part of the library in to your script to
be tested.

````javascript
expect(p.c.d.mock).to.equal(p.mock.c.d);
````

You can pass in a whole library.

````javascript
var mockFs = pretendr(require('fs'));
````

But I prefer to make a dummy version containing only the bits I need.

````javascript
var mockFs = pretendr({
	readFile : function () {},
	writeFile : function () {}
});
````

## Mocking functions ##

````javascript
var fn = pretendr(function () {});
````

When mocking functions, pretendr can show you how many times it was called and
what arguments were passed.

````javascript
fn.mock('a', 'b', 'c');
expect(fn.calls).to.have.length(1);
expect(fn.calls[0].args)
	.to.have.property(0, 'a')
	.and.to.have.property(1, 'b')
	.and.to.have.property(2, 'c');
````

It can also give you the context which was used.

````javascript
fn.mock.call(this);
expect(fn.calls[0].context).to.equal(this);
````

Mock functions can have a static return value.

````javascript
fn.returnValue('this will be returned');
expect(fn.mock()).to.equal('this will be returned');
````

Or they can have a fake function which is run in place.

````javascript
var dummy = pretendr(function () {});
fn.fake(dummy.mock);
fn.mock('arg0');
expect(dummy.calls).to.have.length(1);
expect(dummy.calls[0].args[0]).to.equal('arg0');
````

You can give it a template object which will be mocked with each function call,
and can be retrieved with the `pretendr` method of the call.

````javascript
fn.template({
	a : 4
});
var res = fn.mock();
expect(res).to.have.property('a');
expect(fn.calls[0].pretendr.mock).to.equal(res);
````

### Functions as constructors ###

When **pretendr**'d functions are called as constructors, a new mock will be
created which will be added to the `instances` property.

````javascript
var obj = new fn.mock();
expect(fn.instances[0].mock).to.equal(obj);
````

Instances are based on the object passed as a template.

````javascript
fn.template({
	a : 4
});
var obj = new fn.mock();
expect(obj).to.have.property('a', 4);
````