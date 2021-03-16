const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");
const util = require("./util.js");

describe("PretendrPromisable", () => {
  let PretendrPromisable;
  const dependencies = {};
  let random;
  let callRecord;
  beforeEach(function () {
    random = util.randomGenerator(chance(this.currentTest.title));
    dependencies.PretendrFunction = function () {
      this.calls = random.array(() => ({}));
      this.instances = random.array(() => ({}));
    };
    dependencies.pretendr = function () {
      return {
        mock : {}
      };
    };
    callRecord = {
      fake : [],
      callback : [],
      pretendr : [],
      PretendrPromise : []
    };
    dependencies.PretendrFunction.prototype.fake = function (...args) {
      const returnValue = {};
      callRecord.fake.push({
        args : args,
        returnValue : {}
      });
      return returnValue;
    };
    dependencies.pretendr.PretendrPromise = function (...args) {
      this.mock = {};
      callRecord.PretendrPromise.push({
        returned : this,
        arguments : args
      });
      return this;
    };
    PretendrPromisable = injectr("../lib/pretendr-promisable.js", {
      "./pretendr-function.js" : dependencies.PretendrFunction,
      "./pretendr.js" : dependencies.pretendr
    }, {
      console : console
    });
    PretendrPromisable.pretendr = function (...args) {
      const returnValue = {
        then : {},
        catch : {},
        finally : {},
        mock : {}
      };
      callRecord.pretendr.push({
        arguments : args,
        returnValue : returnValue
      });
      return returnValue;
    };
  });
  it("extends PretendrFunction", () => {
    expect(PretendrPromisable.prototype).to.be.a(dependencies.PretendrFunction);
  });
  describe("instance", () => {
    let p;
    beforeEach(() => {
      p = new PretendrPromisable();
    });
    it("calls the `.fake()` method", () => {
      expect(callRecord.fake).to.have.length(1);
      expect(callRecord.fake[0].args[0]).to.be.a("function");
    });
    describe("`.create()` static method", () => {
      it("creates a new PretendrPromisable instance", () => {
        expect(PretendrPromisable.create()).to.be.a(PretendrPromisable);
      });
    });
    describe("function passed to `.fake()`", () => {
      let mockPromise;
      let lastCall;
      beforeEach(() => {
        mockPromise = callRecord.fake[0].args[0]();
        const index = p.calls.length - 1;
        lastCall = p.calls[index];
      });
      it("adds a PretendrPromise to the call", () => {
        expect(lastCall.instance).to.be.a(
          dependencies.pretendr.PretendrPromise);
      });
      it("adds the PretendrPromise to the instances array", () => {
        const currentInstance = p.instances[p.instances.length - 1];
        expect(currentInstance).to.equal(lastCall.instance);
      });
      it("returns the mock from the PretendrPromise", () => {
        expect(mockPromise).to.equal(lastCall.instance.mock);
      });
    });
  });
  describe("instance with a supplied callback", () => {
    let p;
    let ran;
    beforeEach(() => {
      ran = false;
      p = new PretendrPromisable({
        callback : (...arguments) => {
          ran = arguments;
        }
      });
    });
    it("does not run the callback straight away", () => {
      expect(ran).to.equal(false);
    });
    it("runs the callback after the fake function is called", () => {
      callRecord.fake[0].args[0]();
      expect(ran).to.be.ok(true);
    });
    it("passes the arguments on the fake function to the callback", () => {
      const args = random.arguments();
      callRecord.fake[0].args[0](...args);
      expect(ran).to.eql(args);
    });
  });
  describe("instance with async set", () => {
    let p;
    let ran;
    beforeEach(() => {
      ran = false;
      p = new PretendrPromisable({
        async : true
      });
    });
    it("passes the async property to PretendrPromise", () => {
      callRecord.fake[0].args[0]();
      expect(callRecord.PretendrPromise[0].arguments[0].async).to.be(true);
    });
  });
});
