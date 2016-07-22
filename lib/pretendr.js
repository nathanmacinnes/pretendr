module.exports = wrapper;

function isPrimitive(val) {
  if (val === null) {
    return true;
  }
  return ["string", "number", "boolean", "undefined"]
    .indexOf(typeof val) !== -1;
}

// pretendr function is wrapped to allow circular reference handling.
// Second arg passes the function on the descriptor into fake to allow
// templates. I thought about creating another wrapper to hide the second
// argument, but I've left it in as an undocumented feature.
function wrapper(descriptor, executeFunctions) {

  var noop = function () {},
    descriptors = [],
    pretendrs = [];

  if (arguments.length === 0) {
    return wrapper(noop);
  }

  return pretendr(descriptor);

  function pretendr(d) {
    var index = descriptors.indexOf(d),
      p;

    if (index !== -1) {
      return pretendrs[index];
    }

    if (isPrimitive(d)) {
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

    if (isPrimitive(d)) {
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

      if (this instanceof p.Mock) {
        instances.push(call);
        call.mock = this;
        call.asConstructor = true;
      }

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
    },
    findCall : function (param) {
      return p.calls.find(function (call) {
        if (typeof param === "number") {
          return call.args.length === param;
        }
        if (typeof param === "function") {
          return Array.from(call.args).every(param);
        }
        return param.every(function (expectedArg, index) {
          return expectedArg === null || expectedArg === call.args[index];
        });
      });
    }
  };
  p.Mock = p.mock;
  p.fake(fn);

  return p;
}
