const pretendr = require("./pretendr.js");

class PretendrPromise extends pretendr.Pretendr {
  constructor (options) {
    options = Object.assign({
      async : false
    }, options);
    const settlementCallbacks = {
      then : [],
      catch : [],
      finally : []
    };
    let status = null;
    let settledWithArgs;
    super({
      then : new pretendr.PretendrPromisable({
        callback : (thenFn, catchFn) => {
          settlementCallbacks.then.push(thenFn);
          if (catchFn) {
            settlementCallbacks.catch.push(catchFn);
          }
          if (status === "resolved") {
            resolve(...settledWithArgs);
          }
          if (status === "rejected") {
            reject(...settledWithArgs);
          }
        },
        async : options.async
      }),
      catch : new pretendr.PretendrPromisable({
        callback : (fn) => {
          settlementCallbacks.catch.push(fn);
          if (status === "rejected") {
            reject(...settledWithArgs);
          }
        },
        async : options.async
      }),
      finally : new pretendr.PretendrPromisable({
        callback : (fn) => {
          if (fn) {
            settlementCallbacks.finally.push(fn);
          }
          if (status === "resolved") {
            resolve(...settledWithArgs);
          }
          if (status === "rejected") {
            reject(...settledWithArgs);
          }
        },
        async : options.async
      })
    });
    this.resolve = resolve;
    this.reject = reject;
    function resolve(...withArgs) {
      settledWithArgs = withArgs;
      status = "resolved";
      runPromiseSettlementCallbacks("then", withArgs);
      runPromiseSettlementCallbacks("finally", []);
    }
    function reject(...withArgs) {
      settledWithArgs = withArgs;
      status = "rejected";
      runPromiseSettlementCallbacks("catch", withArgs);
      runPromiseSettlementCallbacks("finally", []);
    }
    function runPromiseSettlementCallbacks(settlementMethod, withArgs) {
      settlementCallbacks[settlementMethod].filter((cb) => {
        if (options.async) {
          asyncWrapper(cb, withArgs);
        } else {
          syncWrapper(cb, withArgs);
        }
        return false;
      });
    }
  }
}
function syncWrapper(fn, args) {
  fn(...args);
}
function asyncWrapper(fn, args) {
  Promise.resolve().then(() => {
    fn(...args);
  });
}
module.exports = PretendrPromise;
