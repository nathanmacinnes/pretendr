/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */

"use strict";

var enumerate,
    makeTemplate,
    pretendr;

enumerate = function (o) {
    return typeof o === 'object' || typeof o === 'function';
};

makeTemplate = function (t) {
    var fake,
        i,
        ownTemplate,
        returnValue,
        setFake,
        setReturnValue,
        setTemplate,
        subTemplate,
        templateObj;
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
    return templateObj;
};

pretendr = function (o, f) {
    var ins = [],
        outs = [],
        pretendr,
        pretendrFunction,
        pretendrPrimitive;

    pretendr = function (input, forced) {
        var i,
            indexNumber,
            mock,
            output,
            type;
        for (i = 0; i < ins.length; i++) {
            if (input === ins[i]) {
                return outs[i];
            }
        }
        ins.push(input);
        indexNumber = ins.length - 1;
        if (typeof input === 'function' || typeof input === 'object') {
            if (typeof input === 'function') {
                output = pretendrFunction();
            } else {
                if (forced) {
                    mock = forced;
                } else if (input instanceof Array) {
                    mock = [];
                } else {
                    mock = {};
                }
                output = {
                    mock : mock
                };
            }
            outs[indexNumber] = output;
            for (i in input) {
                if (input.hasOwnProperty(i)) {
                    type = typeof input[i];
                    if (type === 'object' || type === 'function') {
                        output[i] = pretendr(input[i]);
                        output.mock[i] = output[i].mock;
                    } else {
                        output[i] = pretendrPrimitive(input[i], output.mock, i);
                    }
                }
            }
            return output;
        }
        return pretendrPrimitive(input);
    };

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

// hide the extra arg from the public
module.exports = function (o) {
    return pretendr(o);
};