(function () {
    "use strict";

    var pretendr;

    if (require) {
        pretendr = require('../lib/pretendr.js');
    } else {
        pretendr = PRETENDR;
    }

    module = QUnit.module;

    module("Object mocking", {
        setup : function () {
            this.objectToMock = {
                aPrimitive : 'string value',
                anotherPrimitive : 12,
                anObject : {
                    subPrimitive : 2
                }
            };
            this.mockObj = pretendr.mock(this.objectToMock);
        }
    });

    test("will mock an object", function () {
        notEqual(this.mockObj, this.objectToMock);
    });
    test("keeps the original object", function () {
        equal(this.mockObj.original, this.objectToMock);
    });
    test("if any properties are objects, they too will be mocked", function () {
        equal(this.mockObj.anObject.subPrimitive, this.objectToMock.anObject.subPrimitive);
        equal(this.mockObj.anObject.original, this.objectToMock.anObject);
    });
    test("primitive types won't get mocked", function () {
        equal(this.objectToMock.aPrimitive, this.mockObj.aPrimitive);
        equal(this.objectToMock.anotherPrimitive, this.mockObj.anotherPrimitive);
    });

    module("Recursion", {
        setup : function () {
            this.objectToMock = {
                property1 : {
                    primitiveProp : 'string',
                    deeperProperty : {}
                },
                method1 : function () {}
            };
            this.mockObj = pretendr.mock(this.objectToMock);
        }
    });

    test("properties will also be mocked", function () {
        equal(this.mockObj.property1.original, this.objectToMock.property1);
        equal(this.mockObj.property1.deeperProperty.original, this.objectToMock.property1.deeperProperty);
        equal(this.mockObj.method1.original, this.objectToMock.method1);
    });

    module("Mocking functions", {
        setup : function () {
            var fn;
            fn = function () {
                fn.called = true;
            };
            this.objectToMock = fn;
            this.mockObj = pretendr.mock(this.objectToMock);
        }
    });

    test("functions will be mocked on their own", function () {
        var called = false,
            fn,
            mockFn;
        this.mockObj();
        ok(!this.objectToMock.called);
        deepEqual(this.mockObj.calls[0], []);
    });
    test("allows setting a return value to a method", function () {
        this.mockObj.setReturnValue('return value');
        equal(this.mockObj(), 'return value');
        this.mockObj.setReturnValue('another return value');
        equal(this.mockObj(), 'another return value');
    });
    test("allows setting multiple return values by passing multiple arguments", function () {
        this.mockObj.setReturnValue('val1', 2, 'value 3');
        equal(this.mockObj(), 'val1');
        equal(this.mockObj(), 2);
        equal(this.mockObj(), 'value 3');
        
        // Loop back to the start
        equal(this.mockObj(), 'val1');
        equal(this.mockObj(), 2);
    });
    test("allows creating a function to define return values", function () {
        var args;
        this.mockObj.setFunction(function () {
            args = Array.prototype.slice.call(arguments);
            return 4;
        });
        equal(this.mockObj(3, 5, 2), 4);
        deepEqual(args, [3, 5, 2]);
        
    });
    test("keeps track of the calls", function () {
        equal(this.mockObj.calls.length, 0);
        this.mockObj();
        equal(this.mockObj.calls.length, 1);
        deepEqual(this.mockObj.calls[0], []);
        this.mockObj('arg1', 2, true);
        deepEqual(this.mockObj.calls[1], ['arg1', 2, true]);
        equal(this.mockObj.calls.last, this.mockObj.calls[1]);
        this.mockObj();
        equal(this.mockObj.calls.last, this.mockObj.calls[2]);
    });
    test("additional properties of functions will be included in the mock", function () {
        var fn = function () {},
            mock;
        fn.aProperty = 34;
        fn.anotherProperty = {};
        mock = pretendr.mock(fn);
        equal(mock.aProperty, fn.aProperty);
        equal(mock.anotherProperty.original, fn.anotherProperty);
    });
    test("return values of functions are recorded as part of the calls", function () {
        this.mockObj.setReturnValue(34);
        this.mockObj();
        this.mockObj.setFunction(function () {
            return "5";
        });
        this.mockObj();
        equal(this.mockObj.calls[0].returned, 34,
            "first call returned 34");
        equal(this.mockObj.calls[1].returned, "5",
            "second call returned \"5\"");
    });

    module("Mocking arrays", {
        setup : function () {
            this.objectToMock = [0, true, 'two'];
            this.mockObj = pretendr.mock(this.objectToMock);
        }
    });

    test("arrays will remain as arrays", function () {
        ok(this.mockObj instanceof Array);
    });
    test("mocked arrays will not be equal to the original, but will have equal elements", function () {
        notEqual(this.mockObj, this.objectToMock);
        deepEqual(this.mockObj, this.objectToMock);
    });
    test("if arrays have non-primitive types as their elements, they will be mocked", function () {
        var objectToMock = [{}, [], function () {}],
            mockObj = pretendr.mock(objectToMock);
        equal(mockObj[0].original, objectToMock[0]);
        deepEqual(mockObj[1], objectToMock[1]);
        deepEqual(mockObj[2].calls, []);
    });
    test("additional properties of arrays will be included", function () {
        var arr = [12],
            mock;
        arr.aProperty = {};
        mock = pretendr.mock(arr);
        equal(mock.aProperty.original, arr.aProperty);
    });

    module("Prototypes", {
        setup : function () {
            var ConstructorFn;
            ConstructorFn = function () {
            };
            ConstructorFn.prototype.protoFn = function () {
            };
            this.obj = new ConstructorFn();
            this.mock = pretendr.mock(this.obj, true);
        }
    });

    test("can include the prototype-chain properties when mocking", function () {
        equal(typeof this.mock.protoFn, 'function');
        this.mock.protoFn(1, 2);
        deepEqual(this.mock.protoFn.calls[0], [1, 2]);
    });

}());
