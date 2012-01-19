/*jslint maxlen: 80, indent: 4 */
/*Global exports */

var PRETENDR = function (obj, proto) {
    "use strict";
    var i,
        mockAFunction,
        mockObj = {},
        returnValue,
        type = typeof obj;        

    // Give functions the required return value setting and expectations
    mockAFunction = function (original) {
        var callCount,
            mockFn,
            returnValues = [],
            returnFunction;
        mockFn = function () {
            var args,
                ret;
            args = Array.prototype.slice.call(arguments);
            mockFn.calls.push(args);
            mockFn.calls.last = args;
            if (typeof returnFunction === 'function') {
                ret = returnFunction.apply(this, args);
            } else {
                ret = returnValues[callCount % returnValues.length];
                callCount = callCount + 1;
            }
            mockFn.calls.last.returned = ret;
            return ret;
        };
        mockFn.setReturnValue = function () {
            // set to 0 so that it doesn't continue cycling through from where
            // it left off which would confuse the user
            callCount = 0;
            returnValues = arguments;
        };
        mockFn.setFunction = function (fn) {
            returnFunction = fn;
        };
        mockFn.calls = [];
        mockFn.original = original;
        return mockFn;
    };

    if (type === 'function') {

        // make the mock a function before adding properties, so that it can
        // have a return value defined and can have its calls monitored
        mockObj = mockAFunction(obj);

    } else if (obj instanceof Array) {

        // make the mock an array before adding properties, so that it takes on
        // Array.prototype's methods
        mockObj = [];
    }

    if (type === 'object' || type === 'function') {

        // mock all the properties of objects, functions and arrays
        for (i in obj) {
            if (obj.hasOwnProperty(i) || proto) {
                mockObj[i] = PRETENDR(obj[i]);
            }
        }
        // make sure the user can get at the original
        mockObj.original = obj;

        return mockObj;
    } else {
        // it must be a primitive, so just return it
        return obj;
    }
};

// need to put this in a try/catch because in the browser, export is undefined
try {
    module.exports = PRETENDR;
} catch (e) {
}
