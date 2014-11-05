module.exports = wrapper;

// pretendr function is wrapped to allow circular reference handling.
// Second arg passes the function on the descriptor into fake to allow templates
// I thought about creating another wrapper to hide the second argument, but
// I've left it in as an undocumented feature.
function wrapper(descriptor, executeFunctions) {

    var descriptors = [],
    pretendrs = [];

    if (descriptor === undefined) {
        return pretendrFunction();
    }

    return pretendr(descriptor);

    function pretendr(d) {
        var index = descriptors.indexOf(d),
            p;

        if (index !== -1) {
            return pretendrs[index];
        }

        if (["string", "number", "boolean"].indexOf(typeof d) !== -1) {
            p = {
                mock : d
            };
        } else if (typeof d === "function") {
            if (executeFunctions) {
                p = pretendrFunction(d);
            } else {
                p = pretendrFunction();
            }
        } else if (Array.isArray(d)) {
            p = {
                mock : []
            };
        } else {
            p = {
                mock : {}
            };
        }

        p.gets = 0;
        p.values = [];

        descriptors.push(d);
        pretendrs.push(p);

        if (typeof d !== "object" && typeof d !== "function") {
            return p;
        }

        Object.keys(d).forEach(function (key) {
            p[key] = pretendr(d[key]);

            // I'm not quite sure why this bit is necessary, but tests fail
            // without it. Answers on a postcard please.
            if (typeof d[key] === "function") {
                p.mock[key] = p[key].mock;
                return;
            }

            Object.defineProperty(p.mock, key, {
                get : function () {
                    p[key].gets++;
                    return p[key].mock;
                },
                set : function (val) {
                    p[key].values.push(val);
                    p[key].mock = val;
                },
                enumerable : true
            });
        });

        return p;
    }
}

function pretendrFunction(fn) {
    var calls = [],
        instances = [],
        fake = function () {},
        p,
        template,
        returnVal;

    p = {
        calls : calls,
        fake : function (fn) {
            if (fn) {
                fake = fn;
            } else {
                return fake;
            }
        },
        instances : instances,
        mock : function () {
            var args = Array.prototype.slice.call(arguments),
                call,
                callback;

            if (this instanceof p.Mock) {
                instances.push({
                    mock : this
                });
            }

            args.some(function (argument) {
                if (typeof argument === "function") {
                    callback = argument;
                    return true;
                }
            });

            call = {
                args : args,
                context : this,
                returned : fake.apply(this, arguments),
                callback : callback,
            };

            if (template) {
                call.pretendr = template.instances[
                    template.instances.length - 1
                ];
            }

            calls.push(call);
            return call.returned;
        },
        returnValue : function (a) {
            if (arguments.length) {
                returnVal = a;
                return this.fake(r);
            }

            return returnVal;

            function r() {
                return returnVal;
            }
        },
        template : function (t) {
            if (t === undefined) {
                return template;
            }
            template = wrapper(t);
            template.instances = [];
            this.fake(function () {
                var instance = wrapper(template.mock, true);
                template.instances.push(instance);
                return instance.mock;
            });
            return template;
        }
    };
    p.Mock = p.mock;
    p.fake(fn);

    return p;
}
