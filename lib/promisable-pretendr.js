const PretendrFunction = require("./pretendr-function.js");

class PromisablePretendr extends PretendrFunction {
  constructor (flag) {
    const pretendr = module.exports.pretendr;
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
  static isPromisableDescriptor(d) {
    return d instanceof Promisable;
  }
  static createDescriptor(async) {
    return new Promisable(async);
  }
}
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
module.exports = PromisablePretendr;
