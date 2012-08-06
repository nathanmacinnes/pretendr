/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */

"use strict";

var nonPrimitive, // fn - whether to enumerate the properties and recurse
    makeTemplate, // fn - get a template object
    makePretendr, // fn - the main function whose result is returned
    makeMock, // fn - make a mock property of the pretendr function
    pretendr, // fn - called by module.exports
    pretendrFunction, // fn - use for the mock property when it's a function
    templateIns = [], // list of template inputs
    templateOuts = []; // template outputs they match to prevent infinit loops

// Return whether the object passed in is of type 'object' or 'function'
// This is important, because string types cause infinite recursion and other
// types don't make much sense
nonPrimitive = function (o) {
    return typeof o === 'object' || typeof o === 'function';
};

makePretendr = function (descriptor, mock, asTemplate) {
    var ins = [], // list of descriptors which have been passed in
        outs = [], // corresponding list of outputs
        subMakePretendr; // sub function so that ins and outs aren't re-made

    subMakePretendr = function (descriptor, mock, parentMock, propertyName) {
        var attributes = {}, // the returnValue, template, etc.
            baseObj = {}, // the object returned to the user
            i,
            indexNum, // the element number of the ins/outs array
            propertyDefinition, // the object passed to defineProperty
            setFake, // the fake setter
            setReturnValue, // the returnValue setter
            setTemplate; // the template setter

        // check we haven't already created the pretendr object to prevent
        // infinite recursion
        for (i = 0; i < ins.length; i++) {
            if (descriptor === ins[i]) {

                // if we have, return the output which corresponds to this
                // input
                return outs[i];
            }
        }
        // if not, create new inputs and outputs
        indexNum = ins.length;
        ins.push(descriptor);
        outs[indexNum] = baseObj;

        setFake = function (fake) {
            attributes.fake = fake;
        };
        setReturnValue = function (value) {
            attributes.returnValue = value;
        };
        setTemplate = function (o) {
            o = o || {};
            if (o.hasOwnProperty('clone')) {
                attributes.template = o.clone();
            } else {
                attributes.template = makePretendr(o, null, true);
            }
            return attributes.template;
        };

        // make a copy of this pretendr object
        baseObj.clone = function (obj) {
            var copy = makePretendr(descriptor, obj);
            this.applyAttributesTo(copy);
            return copy;
        };

        // the attributes object which contains the return value, et al, can be
        // copied to the supplied other object with this function
        baseObj.applyAttributesTo = function (other) {
            var i;

            // The attribute properties conveniently have the same name as the
            // pretendr methods, so just loop through them.
            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    other[i](attributes[i]);
                }
            }

            // recurse to descendents, as long as the objects actually have the
            // same descendents
            for (i in descriptor) {
                if (descriptor.hasOwnProperty(i) && this.hasOwnProperty(i)) {
                    this[i].applyAttributesTo(other[i]);
                }
            }
        };
        if (typeof descriptor === 'function') {
            baseObj.fake = setFake;
            baseObj.returnValue = setReturnValue;
            baseObj.template = setTemplate;
        }

        if (!asTemplate) {
            // create the mocks, either based on the object passed in (for
            // creating instances) or using the makeMock function
            mock = mock || makeMock(descriptor, baseObj, attributes);

            if (Object.defineProperty) {
                baseObj.gets = 0;
                baseObj.values = [];

                propertyDefinition = {
                    get : function () {
                        baseObj.gets++;
                        return mock;
                    },
                    set : function (val) {
                        baseObj.values.push(val);
                        mock = val;
                    }
                };

                if (parentMock) {
                    // Add monitoring to mock in parent context
                    Object.defineProperty(
                        parentMock,
                        propertyName,
                        propertyDefinition
                    );
                }
                // Add monitoring to mock in the base object context
                Object.defineProperty(baseObj, 'mock', propertyDefinition);
            } else {
                baseObj.mock = mock;
            }
        }
        if (nonPrimitive(descriptor)) {
            for (i in descriptor) {
                if (descriptor.hasOwnProperty(i)) {
                    baseObj[i] = subMakePretendr(
                        descriptor[i],
                        null,
                        baseObj.mock,
                        i
                    );
                    if (!asTemplate) {
                        baseObj.mock[i] = baseObj[i].mock;

                        // reset gets as it'll have been incremented
                        // during processing
                        baseObj[i].gets = 0;
                    }
                }
            }
        }
        return baseObj;
    };
    return subMakePretendr(descriptor, mock);
};

// create the mock property of this object
makeMock = function (desc, base, attr) {
    if (desc instanceof Array) {
        return [];
    }
    if (typeof desc === 'object') {
        return {};
    }
    if (typeof desc === 'function') {
        return pretendrFunction(attr, base);
    }
    return desc;
};

// create mock functions
pretendrFunction = function (attributes, baseObject) {
    var fn;
    baseObject.calls = [];
    baseObject.instances = [];
    fn = function () {
        var call = {},
            instance,
            i;
        baseObject.calls.push(call);
        call.args = arguments;
        call.context = this;

        for (i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === 'function') {
                call.callback = arguments[i];
            }
        }
        if (attributes.hasOwnProperty('returnValue')) {
            call.returned = attributes.returnValue;
        }
        if (attributes.hasOwnProperty('fake')) {
            call.returned = attributes.fake.apply(this, arguments);
        }
        if (this instanceof fn) {
            if (!attributes.hasOwnProperty('template')) {
                baseObject.template();
            }
            instance = attributes.template.clone(this);
            baseObject.instances.push(instance);
        } else if (attributes.hasOwnProperty('template')) {
            call.pretendr = attributes.template.clone();
            call.returned = call.pretendr.mock;
        }
		return call.returned;
    };
    return fn;
};

// hide the extra arg of pretendr from the public
module.exports = function (o) {
    return makePretendr(o);
};
