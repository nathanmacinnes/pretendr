/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */

"use strict";

var nonPrimitive, // fn - whether to enumerate the properties and recurse
    makeTemplate, // fn - get a template object
    makeBaseObj,
    makeMock,
    pretendr, // fn - called by module.exports
    pretendrFunction,
    templateIns = [], // list of template inputs
    templateOuts = []; // template outputs they match to prevent infinit loops

// Return whether the object passed in is of type 'object' or 'function'
// This is important, because string types cause infinite recursion and other
// types don't make much sense
nonPrimitive = function (o) {
    return typeof o === 'object' || typeof o === 'function';
};

makeBaseObj = function (descriptor, mock) {
    var ins = [],
        outs = [],
        subMakeBaseObj;

    subMakeBaseObj = function (descriptor, mock) {
        var attributes = {},
            baseObj = {},
            makeCopy,
            i,
            indexNum,
            setFake,
            setReturnValue,
            setTemplate;

        for (i = 0; i < ins.length; i++) {
            if (descriptor === ins[i]) {
                return outs[i];
            }
        }
        indexNum = ins.length;
        ins.push(descriptor);
        outs[indexNum] = baseObj;

        setFake = function (fake) {
            attributes.fake = fake;
        };
        setReturnValue = function (value) {
            attributes.returnValue = value;
        };
        setTemplate = function (desc) {
            attributes.template = makeBaseObj(desc);
            return attributes.template;
        };
        makeCopy = function (obj) {
            var copy = makeBaseObj(descriptor, obj);
            if (attributes.hasOwnProperty('fake')) {
                copy.fake(attributes.fake);
            }
            if (attributes.hasOwnProperty('returnValue')) {
                copy.returnValue(attributes.returnValue);
            }
            if (attributes.hasOwnProperty('template')) {
                copy.template(attributes.template.mock);
            }
            return copy;
        };
        if (typeof descriptor === 'function') {
            baseObj.fake = setFake;
            baseObj.returnValue = setReturnValue;
            baseObj.template = setTemplate;
        }
        baseObj.clone = makeCopy;
        baseObj.mock = mock || makeMock(descriptor, baseObj, attributes);
        if (nonPrimitive(descriptor)) {
            for (i in descriptor) {
                if (descriptor.hasOwnProperty(i)) {
                    baseObj[i] = subMakeBaseObj(descriptor[i]);
                    baseObj.mock[i] = baseObj[i].mock;
                }
            }
        }
        return baseObj;
    };
    return subMakeBaseObj(descriptor, mock);
};

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
    return makeBaseObj(o);
};