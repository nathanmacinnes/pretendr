module.exports = pretendr;

class Pretendr {
  constructor (descriptor, previousDescriptors) {

    // Other classes (e.g., PretendrFunction) extend this one, and below, we
    // upgrade this object to extending classes. Missing out the constructor in
    // these cases avoids infintie recursion.
    if (!previousDescriptors) {
      return;
    }

    let pretendrObject = this;

    if (previousDescriptors.has(descriptor)) {
      return previousDescriptors.get(descriptor);
    }
    if (descriptor instanceof Pretendr) {
      return descriptor;
    }
    if (isPrimitive(descriptor)) {
      this.mock = descriptor;
    } else if (typeof descriptor === "function") {
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
  const previousDescriptors = new Map();

  return new Pretendr(descriptor, previousDescriptors);
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
