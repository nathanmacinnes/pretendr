const pretendr = require("./pretendr.js");
const PretendrFunction = require("./pretendr-function.js");

class PretendrPromisable extends PretendrFunction {
  constructor (options) {
    super();
    const pax = this;
    options = options || {};
    this.fake(function (...args) {
      const mockPromise = new pretendr.PretendrPromise({
        async : options.async
      });
      if (options.callback) {
        options.callback(...args);
      }
      pax.calls.slice(-1).pop().instance = mockPromise;
      pax.instances.push(mockPromise);
      return mockPromise.mock;
    });
  }
  static create(async) {
    return new PretendrPromisable(async);
  }
}
module.exports = PretendrPromisable;
