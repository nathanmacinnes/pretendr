const pretendr = require("./pretendr.js");
const PretendrFunction = require("./pretendr-function.js");
const PretendrPromisable = require("./pretendr-promisable.js");
const PretendrPromise = require("./pretendr-promise.js");
const PretendrTemplate = require("./pretendr-template.js");

pretendr.PretendrFunction = PretendrFunction;
pretendr.PretendrPromisable = PretendrPromisable;
pretendr.PretendrPromise = PretendrPromise;
pretendr.PretendrTempate = PretendrTemplate;

module.exports = pretendr;
