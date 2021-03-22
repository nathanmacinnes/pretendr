module.exports = pretendr;

class Pretendr {
  constructor (descriptor, previousDescriptors) {
    let pretendrObject = this;
    previousDescriptors = previousDescriptors || new Map();

    if (previousDescriptors.has(descriptor)) {
      return previousDescriptors.get(descriptor);
    }
    this.reset = function (newPretendr) {
      if (!newPretendr) {
        newPretendr = pretendr(descriptor);
      }
      Object.assign(pretendrObject, newPretendr);
      if (isPrimitive(descriptor)) {
        return;
      }
      Object.keys(descriptor).forEach((key) => {
        pretendrObject[key].reset(newPretendr[key]);
      });
    };
    if (descriptor instanceof Pretendr) {
      return descriptor;
    }
    if (isPrimitive(descriptor)) {
      this.mock = descriptor;
    } else if (typeof descriptor === "function" &&
        !(this instanceof pretendr.PretendrFunction)) {
      pretendrObject = generateFunction(descriptor);
    } else if (Array.isArray(descriptor)) {
      pretendrObject.mock = [];
    } else {
      pretendrObject.mock = {};
    }
    previousDescriptors.set(descriptor, pretendrObject);

    pretendrObject.gets = 0;
    pretendrObject.values = [];

    if (isPrimitive(descriptor)) {
      return pretendrObject;
    }
    Object.keys(descriptor).forEach(function (key) {
      pretendrObject[key] = new Pretendr(descriptor[key], previousDescriptors);

      Object.defineProperty(pretendrObject.mock, key, {
        get : function () {
          pretendrObject[key].gets++;
          return pretendrObject[key].mock;
        },
        set : function (val) {
          pretendrObject[key].values.push(val);
          pretendrObject[key].mock = val;
        },
        enumerable : true
      });
    });
    return pretendrObject;
  }
}
function pretendr(descriptor) {
  if (arguments.length === 0) {
    return pretendr(() => {});
  }
  return new Pretendr(descriptor);
}
function isPrimitive(val) {
  return Object(val) !== val;
}
function generateFunction(options) {
  return new pretendr.PretendrFunction(options);
}
function generatePromisable(options) {
  return new pretendr.PretendrPromisable(options);
}
pretendr.Pretendr = Pretendr;
pretendr.fn = generateFunction;
pretendr.px = generatePromisable;
