const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");
const util = require("./util.js");

describe("PretendrFunction", () => {
  let PretendrFunction;
  let pretendrStub;
  let p;
  let generateArgs;
  beforeEach(function () {
    generateArgs = util.randomGenerator(
      chance(this.currentTest.title)
    ).arguments;
    pretendrStub = function () {
      return {
        mock : {}
      };
    };
    pretendrStub.PretendrTemplate = function () {};
    pretendrStub.Pretendr = function () {};
    PretendrFunction = injectr("../lib/pretendr-function.js", {
      "./pretendr.js" : pretendrStub
    });
    p = new PretendrFunction();
  });
  it("has an empty calls array", () => {
    expect(p.calls).to.eql([]);
  });
  describe(".mock", () => {
    it("is a function", () => {
      expect(p.mock).to.be.a("function");
    });
    it("records its calls", () => {
      p.mock();
      expect(p.calls).to.have.length(1);
    });
    it("records the arguments to each call", () => {
      const args = generateArgs();
      p.mock.apply(null, args);
      expect(p.calls[0].args).to.eql(args);
    });
    it("records the context of each call", () => {
      const context = {};
      p.mock.call(context);
      expect(p.calls[0]).to.have.property("context", context);
    });
    it("records the return value of fakes", () => {
      const ret = {};
      p.fake(function () {
        return ret;
      });
      // callback.returnValue(ret);
      p.mock();
      expect(p.calls[0]).to.have.property("returned", ret);
    });
    it("finds the callback", () => {
      const callback = new PretendrFunction();
      const args = generateArgs().concat(callback.mock)
        .concat(generateArgs());
      p.mock.apply(null, args);
      expect(p.calls[0]).to.have.property("callback", callback.mock);
    });
  });
  describe(".returnValue()", () => {
    it("sets the return value", () => {
      const v = {};
      p.returnValue(v);
      expect(p.mock()).to.equal(v);
    });
    it("can retrieve the return value", () => {
      p.returnValue({});
      expect(p.returnValue()).to.equal(p.mock());
    });
    it("sets a return value of undefined when told to", () => {
      p.returnValue({});
      p.returnValue(undefined);
      expect(p.returnValue()).to.equal(undefined);
    });
  });
  describe(".fake()", () => {
    let callback;
    let callbackCall;
    beforeEach(() => {
      const callbackReturnValue = {};
      callback = function (...args) {
        callbackCall = {
          arguments : args,
          context : this
        };
        return callbackReturnValue;
      };
      callbackCall = null;
    });
    it("sets a callback function to run", () => {
      p.fake(callback);
      p.mock();
      expect(callbackCall).to.be.ok();
    });
    it("passes arguments to the callback", () => {
      const args = generateArgs();
      p.fake(callback);
      p.mock.apply(null, args);
      expect(callbackCall.arguments).to.eql(args);
    });
    it("passes the context to the callback", () => {
      const context = {};
      p.fake(callback);
      p.mock.call(context);
      expect(callbackCall.context).to.equal(context);
    });
    it("makes the mock return the fake's return value", () => {
      p.fake(callback);
      expect(p.mock()).to.equal(callback());
    });
  });
  describe(".template()", () => {
    let pf;
    beforeEach(() => {
      pf = new PretendrFunction();
    });
    it("returns a new `PretendrTempate` when passed a new descriptor", () => {
      expect(pf.template({})).to.be.a(pretendrStub.PretendrTemplate);
    });
    it("returns the previous `PretendrTemplate` when passed nothing", () => {
      const template = pf.template({});
      expect(pf.template()).to.equal(template);
    });
  });
  describe("with a template set", () => {
    let pf;
    let makeInstanceCalls;
    beforeEach(() => {
      pretendrStub.PretendrTemplate.prototype.makeInstance =
          function (...args) {
        const obj = {
          mock : {}
        };
        makeInstanceCalls.push({
          arguments : args,
          returnValue : obj
        });
        return obj;
      };
      makeInstanceCalls = [];
      pf = new PretendrFunction();
      pf.template({});
    });
    it("creates an instance and returns it", () => {
      expect(makeInstanceCalls).to.have.length(0);
      const instance = pf.mock();
      expect(makeInstanceCalls).to.have.length(1);
      expect(instance).to.equal(makeInstanceCalls[0].returnValue.mock);
    });
    it("passes its call to the template's `makeInstance()` method", () => {
      pf.mock();
      expect(makeInstanceCalls[0].arguments[0]).to.equal(pf.calls[0]);
    });
    it("adds the result `makeInstance()` to the instances array", () => {
      pf.mock();
      expect(pf.instances[0]).to.equal(makeInstanceCalls[0].returnValue);
    });
    it("adds the instance to the call", () => {
      const mock = pf.mock;
      mock();
      expect(pf.calls[0].instance).to.equal(pf.instances[0]);
    });
  });
  describe(".findCall()", () => {
    it("finds the call with the matching number of arguments", () => {
      createCalls(
        [1, "a", true],
        [1, "a"],
        [],
        [1]);
      expect(p.findCall(2)).to.equal(p.calls[1]);
      expect(p.findCall(0)).to.equal(p.calls[2]);
    });
    it("finds the call with matching arguments", () => {
      createCalls(
        [1, "a", true],
        [2, "b", false],
        [2, "b", true]);
      expect(p.findCall([2, "b", false])).to.equal(p.calls[1]);
    });
    it("treats null as any value", () => {
      createCalls([3, 4, 5]);
      expect(p.findCall([3, null, 5])).to.equal(p.calls[0]);
    });
    describe("with function", () => {
      let args = ["one", "two", "three", "four", "five", "six"];
      let fn;
      beforeEach(() => {
        const copy = Array.from(args);
        fn = new PretendrFunction();
        while (copy.length) {
          createCalls(copy.splice(0, 2));
        }
      });
      it("can call the function once for each arg", () => {
        fn.fake(function (e, index, arr) {
          return index !== arr.length - 1;
        });
        p.findCall(fn.mock);
        expect(fn.calls).to.have.length(args.length);
        expect(fn.calls.map(function (call) {
          return call.args[0];
        })).to.eql(args);
      });
      it("returns the call for which all arg calls return true", () => {
        fn.fake(function (val) {
          return val !== "two" && val !== "four";
        });
        expect(p.findCall(fn.mock)).to.equal(p.calls[2]);
      });
    });
    function createCalls() {
      Array.from(arguments).forEach(function (a) {
        p.calls.push({
          args : a
        });
      });
    }
  });
  describe(".called", () => {
    it("is only set to true after a call", () => {
      expect(p.called).to.equal(false);
      p.mock();
      expect(p.called).to.equal(true);
      p.mock();
      expect(p.called).to.equal(true);
    });
    it("is set to false again if the calls array is overwritten", () => {
      p.mock();
      p.calls = [];
      expect(p.called).to.equal(false);
    });
  });
  describe(".calledOnce", () => {
    it("is set correctly for exactly one call", () => {
      expect(p.calledOnce).to.equal(false);
      p.mock();
      expect(p.calledOnce).to.equal(true);
      p.mock();
      expect(p.calledOnce).to.equal(false);
    });
    it("is set to false again if the calls array is overwritten", () => {
      p.mock();
      p.calls = [];
      expect(p.calledOnce).to.equal(false);
    });
  });
});
