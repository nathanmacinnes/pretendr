/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */

"use strict";

var enumerate, // fn - whether to enumerate the properties and recurse
    makeTemplate, // fn - get a template object
    pretendr, // fn - called by module.exports
	templateIns = [], // list of template inputs
	templateOuts = []; // template outputs they match to prevent infinit loops

// Return whether the object passed in is of type 'object' or 'function'
// This is important, because string types cause infinite recursion and other
// types don't make much sense
enumerate = function (o) {
    return typeof o === 'object' || typeof o === 'function';
};

// Return a template object based on the given template descriptor, so that
// pretendr objects can be created with returnValue et al already set
makeTemplate = function (t) {
    var fake,
        i,
		index,
		ins,
		outs,
        ownTemplate,
        returnValue,
        setFake,
        setReturnValue,
        setTemplate,
        subTemplate,
        templateObj;
	for (i = 0; i < templateIns.length; i++) {
		if (templateIns[i] === t) {
			return templateOuts[i];
		}
	}
	
	templateIns.push(t);
	index = templateIns.length - 1;
	
    setReturnValue = function (val) {
        returnValue = val;
    };
    setFake = function (fn) {
        fake = fn;
    };
    setTemplate = function (tem) {
        ownTemplate = tem;
    };
    templateObj = {
        generate : function (o) {
            var i,
                p;
            p = this.apply(pretendr(t, o));
            return p;
        },
        apply : function (p) {
            var i;
            if (returnValue !== undefined) {
                p.returnValue(returnValue);
            }
            if (fake !== undefined) {
                p.fake(fake);
            }
            if (ownTemplate !== undefined) {
                p.template(ownTemplate);
            }
            for (i in t) {
                if (t.hasOwnProperty(i) && templateObj[i]) {
                    templateObj[i].apply(p[i]);
                }
            }
            return p;
        }
    };
    if (typeof t === 'function') {
        templateObj.returnValue = setReturnValue;
        templateObj.fake = setFake;
        templateObj.template = setTemplate;
    }
    for (i in t) {
        if (t.hasOwnProperty(i) && enumerate(t[i])) {
            templateObj[i] = makeTemplate(t[i]);
        }
    }
	templateOuts[index] = templateObj;
    return templateObj;
};

// Create a pretendr object. If the optional second argument is provided, that
// object will be used as the mock object. This is to aid with instances of
// mock constructor functions.
pretendr = function (o, f) {
    var ins = [], // objects which have been passed in to the pretendr function
        outs = [], // objects which have been returned by pretendr
        pretendr, // inner fn so that ins and outs aren't recreated by recursion
        pretendrFunction, // fn for creating mock functions
        pretendrPrimitive; // fn for creating mock primitives

	// an inner function is used so that ins and outs are created once per
	// external call, then resued to prevent infinite recursion
    pretendr = function (input, forced) {
        var i,
            indexNumber,
            mock,
            output;

		// loop through all objects which have been passed in before. If this
		// matches, return the corresponding out[], so that we don't get
		// infinite recursion
        for (i = 0; i < ins.length; i++) {
            if (input === ins[i]) {
                return outs[i];
            }
        }
		// otherwise, put in the input and store the number
        ins.push(input);
        indexNumber = ins.length - 1;

		// We want to recurse through objects and functions, so do them
		// separately
        if (enumerate(input)) {
            if (typeof input === 'function') {
                output = pretendrFunction();
            } else {
			
				// if an object has been passed that should be used as a basis
				// for the mock. Used when creating instances of templates.
                if (forced) {
                    mock = forced;

				// if it's an array, we want the mock to be an array too
                } else if (input instanceof Array) {
                    mock = [];
                } else {
                    mock = {};
                }

                output = {
                    mock : mock
                };
            }
			
			// Store the output before we recurse, so that it can be returned
			// if we come across the same input again
            outs[indexNumber] = output;

			// Loop through and recurse if necessary
            for (i in input) {
                if (input.hasOwnProperty(i)) {
                    if (enumerate(input[i])) {
                        output[i] = pretendr(input[i]);
                        output.mock[i] = output[i].mock;
                    } else {

						// primitive objects must be processed separately so
						// that they can have getter and setter functions
                        output[i] = pretendrPrimitive(input[i], output.mock, i);
                    }
                }
            }
            return output;
        }
        return pretendrPrimitive(input);
    };

	// Base objects of mocked functions must have several methods, and the mocks
	// themselves must of course be functions, so do these in their own function
    pretendrFunction = function () {
        var fake,
            pretendrObj,
            returnValue,
            template;
        pretendrObj = {
            calls : [],
            instances : [],
            returnValue : function (r) {
                returnValue = r;
            },
            fake : function (fn) {
                fake = fn;
            },
            template : function (t) {
                template = makeTemplate(t);
                return template;
            },
            mock : function () {
                var call,
                    i;
                call = {
                    args : arguments,
                    context : this
                };
                for (i = 0; i < arguments.length; i++) {
                    if (typeof arguments[i] === 'function') {
                        call.callback = arguments[i];
                    }
                }
                pretendrObj.calls.push(call);
                if (this instanceof pretendrObj.mock) {
                    if (!template) {
                        template = pretendrObj.template();
                    }
                    pretendrObj.instances.push(template.generate(this));
                } else if (fake) {
                    call.returned = fake.apply(this, arguments);
                } else if (template) {
                    call.pretendr = template.generate();
                    call.returned = call.pretendr.mock;
                } else {
                    call.returned = returnValue;
                }
                return call.returned;
            }
        };
        return pretendrObj;
    };

	// Primitives must have getters and setters so that we can record what
	// happens to them, so these are processed in their own functions too.
    pretendrPrimitive = function (val, parent, property) {
        var get,
            pretendrObj,
            set;
        pretendrObj = parent || {};
        get = function () {
            this.gets = this.gets + 1;
            return val;
        };
        set = function (v) {
            val = v;
            this.values.push(v);
        };
        if (Object.defineProperty) {
            pretendrObj.gets = 0;
            pretendrObj.values = [];
            Object.defineProperty(pretendrObj, property || 'mock', {
                get : get,
                set : set
            });
        } else {
            pretendrObj.mock = val;
        }
        return pretendrObj;
    };

    return pretendr(o, f);
};

// hide the extra arg of pretendr from the public
module.exports = function (o) {
    return pretendr(o);
};