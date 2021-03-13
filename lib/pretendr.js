module.exports = pretendr;

const PretendrFunction = require("./pretendr-function.js");
const PromisablePretendr = require("./promisable-pretendr.js");

PretendrFunction.pretendr = pretendr;
PromisablePretendr.pretendr = pretendr;

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
  return PromisablePretendr.isPromisableDescriptor(val);
}
pretendr.promisable = PromisablePretendr.createDescriptor;
