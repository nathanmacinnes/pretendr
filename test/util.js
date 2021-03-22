const util = module.exports;

util.randomGenerator = function (random) {
  return ({
    array : generateArray,
    arguments : generateArguments,
    string : generateString,
    floating : () => random.floating(),
    integer : () => random.integer(),
    bool : () => random.bool()
  });
  function generateArguments() {
    return generateArray(generateString);
  }
  function generateArray(fn) {
    return random.n(fn, random.natural({
      min : 2,
      max : 10
    }));
  }
  function generateString() {
    return random.string();
  }
};
