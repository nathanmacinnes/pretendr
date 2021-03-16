const pretendr = require("./pretendr.js");

const methodsToCopy = ["fake", "returnValue", "template"];

class PretendrTemplate extends pretendr.Pretendr {
  constructor (descriptor) {
    super(descriptor);
    this.makeInstance = function (call) {
      call = call || {};
      const done = [];
      call.instance = pretendr(descriptor);
      copy(descriptor, this, call.instance, done);
      return call.instance;
    };
  }
}
function copy(descriptor, original, clone, done) {
  if (done.includes(descriptor)) {
    return;
  }
  done.push(descriptor);
  methodsToCopy.forEach((method) => {
    if (typeof original[method] === "function") {
      const val = original[method]();
      clone[method](val);
    }
  });
  Object.keys(descriptor).forEach((property) => {
    copy(descriptor[property], original[property], clone[property], done);
  });
}
module.exports = PretendrTemplate;
