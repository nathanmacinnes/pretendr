const pretendr = require("./pretendr.js");

class PretendrCall {
  constructor(options) {
    Object.assign(this, options);
  }
}
class PretendrFunction extends pretendr.Pretendr {
  constructor(descriptorFunction) {
    super(descriptorFunction);
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
        const instance = pretendrFn._template.makeInstance(call);
        call.instance = instance;
        pretendrFn.instances.push(instance);
        call.returned = instance.mock;
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
  template (t) {
    if (t === undefined) {
      return this._template;
    }
    this._template = new pretendr.PretendrTemplate(t);
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
  get called () {
    return this.calls.length !== 0;
  }
  get calledOnce () {
    return this.calls.length === 1;
  }
}
module.exports = PretendrFunction;
