const util = module.exports;

util.randomGenerator = function (random) {
  return ({
    array : generateArray,
    arguments : generateArguments
  });
  function generateArguments() {
    return generateArray(random.string);
  }
  function generateArray(fn) {
    return random.n(fn, random.natural({
      min : 2,
      max : 10
    }));
  }
};
