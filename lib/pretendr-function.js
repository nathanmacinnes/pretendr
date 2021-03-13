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
    const pretendr = module.exports.pretendr;
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
module.exports = PretendrFunction;
