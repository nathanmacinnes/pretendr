module.exports = pretendr;

class PretendrCall {
  constructor(options) {
    Object.assign(this, options);
  }
}

class PretendrFunction {
  constructor(descriptorFunction) {

    this.calls = [];
    this.instances = [];
    this._fakeFunction = descriptorFunction;
    const pretendrFn = this;
    this.mock = function (...args) {
      const call = new PretendrCall({
        args : args,
        context : this
      });
      pretendrFn.calls.push(call);
      call.args = args;
      call.callback = args.find(function (argument) {
        if (typeof argument === "function") {
          return true;
        }
      });
      if (this instanceof pretendrFn.Mock) {
        pretendrFn.instances.push(call);
        call.mock = this;
        call.asConstructor = true;
      }
      if (pretendrFn._fakeFunction && pretendrFn._fake) {
        call.returned = pretendrFn._fakeFunction.apply(this, args);
      }
      if (pretendrFn._template) {
        call.instance = pretendrFn._template.instances[
          pretendrFn._template.instances.length - 1
        ];
        if (pretendrFn.template() && pretendrFn.template().fake) {
          call.instance.fake(pretendrFn.template().fake());
        }
      }
      return call.returned;
    };
    this.Mock = this.mock;
  }
  fake (fn) {
    this._fake = true;
    if (fn) {
      this._fakeFunction = fn;
    }
  }
  returnValue (...args) {
    if (args.length) {
      return this.fake(r);
    }
    return this._fakeFunction();

    function r() {
      return args[0];
    }
  }
  template (t, instanceSetup) {
    if (t === undefined) {
      return this._template;
    }
    this._template = pretendr(t);
    this._template.instances = [];
    const currentPretendrFunction = this;
    this.fake(function () {
      const instance = pretendr(currentPretendrFunction._template.mock);
      if (instanceSetup) {
        instanceSetup(instance);
      }
      currentPretendrFunction._template.instances.push(instance);
      return instance.mock;
    });
    return this._template;
  }
  findCall (param) {
    return this.calls.find(function (call) {
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
}
class PromisablePretendr extends PretendrFunction {
  constructor (flag) {
    super();
    const promisablePretendr = this;
    this.fake(function (...args) {
      const instance = pretendr({
        then : pretendr.promisable(),
        catch : pretendr.promisable(),
        finally : pretendr.promisable()
      });
      promisablePretendr.calls.slice(-1)[0].promise = instance;
      const settleCallbacks = {
        then : [],
        catch : [],
        finally : []
      };
      let state;
      let settlementArgs;
      instance.resolve = function (...resolveWith) {
        settlementArgs = resolveWith;
        state = "resolved";
        call("then", resolveWith);
      };
      instance.reject = function (...rejectWith) {
        settlementArgs = rejectWith;
        state = "rejected";
        call("catch", rejectWith);
      };
      instance.then._settlement = (thenFn, catchFn) => {
        settleCallbacks.then.push(thenFn);
        if (catchFn) {
          settleCallbacks.catch.push(catchFn);
        }
        if (state === "resolved") {
          call("then", settlementArgs);
        }
      };
      instance.catch._settlement = (fn) => {
        settleCallbacks.catch.push(fn);
        if (state === "rejected") {
          call("catch", settlementArgs);
        }
      };
      instance.finally._settlement = (fn) => {
        settleCallbacks.finally.push(fn);
        if (state) {
          call("finally", []);
        }
      };
      if (promisablePretendr._settlement) {
        promisablePretendr._settlement(...args);
      }
      return instance.mock;
      function call(settlement, args) {
        settleCallbacks[settlement].forEach((callback) => {
          flag.wrapper(() => callback(...args));
        });
        if (settlement !== "finally") {
          call("finally", []);
        }
      }
    });
  }
}

function pretendr(descriptor) {

  const noop = function () {},
    descriptors = [],
    pretendrs = [];

  if (arguments.length === 0) {
    return pretendr(noop);
  }

  return pretendrTypes(descriptor);

  function pretendrTypes(d) {
    const index = descriptors.indexOf(d);
    let p;

    if (index !== -1) {
      return pretendrs[index];
    }

    if (isPrimitive(d)) {
      p = {
        mock : d
      };
    } else if (isPromisable(d)) {
      p = new PromisablePretendr(d);
    } else if (typeof d === "function") {
      p = new PretendrFunction(d);
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
      p[key] = pretendrTypes(d[key]);
      if (isPromisable(d) && key === "wrapper") {
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

function isPrimitive(val) {
  if (val === null) {
    return true;
  }
  return ["string", "number", "boolean", "undefined"].includes(typeof val);
}

function isPromisable(val) {
  return val instanceof Promisable;
}

pretendr.promisable = function (async) {
  return new Promisable(async || false);
};

function Promisable(async) {
  if (async) {
    this.wrapper = asyncWrapper;
  } else {
    this.wrapper = syncWrapper;
  }
  function asyncWrapper(f) {
    Promise.resolve().then(f);
  }
  function syncWrapper(f) {
    f();
  }
}
