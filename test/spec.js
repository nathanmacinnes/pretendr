"use strict";

const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");

describe("pretendr", () => {
  let random;
  let generateArguments;
  let pretendr;
  beforeEach(function () {
    random = chance(this.currentTest.title);
    pretendr = injectr("../lib/pretendr.js", {
      util : require("util") // too complicated to mock this
    }, {
      console : console
    });
    generateArguments = () => {
      return random.n(random.string, random.natural({
        min : 1,
        max : 20
      }));
    };
  });
  it("is a function", () => {
    expect(pretendr).to.be.a("function");
  });
  it("returns an object with a mock property", () => {
    expect(pretendr()).to.be.an("object")
      .and.to.have.property("mock");
  });
  it("returns a pretendr function when no arguments are given", () => {
    const withFn = pretendr(function () {});
    const withNoArgs = pretendr();

    // eql won't work because it expects functions to be ===
    Object.keys(withFn).forEach(function (key) {
      expect(withFn[key].toString()).to.equal(withNoArgs[key].toString());
    });
  });
  it("returns an undefined pretendr when undefined is given", () => {
    expect(pretendr(undefined)).to.have.property("mock", undefined);
  });
  it("returns a null pretendr when null is given", () => {
    expect(pretendr(null)).to.have.property("mock", null);
  });
  describe("with function", () => {
    let callback;
    let p;
    beforeEach(() => {

      // dogfood
      callback = pretendr();
      p = pretendr();
    });
    it("has an empty calls array", () => {
      expect(p.calls).to.be.eql([]);
    });
    it("mocks its properties", () => {
      const fn = () => {};
      const property = random.string();
      fn[property] = () => {};
      p = pretendr(fn);
      p.mock[property]();
      expect(p[property].calls).to.have.length(1);
    });
    describe("has a mock property which", () => {
      it("is a function", () => {
        expect(p.mock).to.be.a("function");
      });
      it("records its calls", () => {
        p.mock();
        expect(p.calls).to.have.length(1);
      });
      it("records the arguments to each call", () => {
        const args = random.n(random.integer, random.natural({
          min : 1,
          max : 20
        }));
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
        const args = generateArguments().concat(callback.mock)
          .concat(generateArguments());
        p.mock.apply(null, args);
        expect(p.calls[0]).to.have.property("callback", callback.mock);
      });
    });
    describe("has a returnValue method which", () => {
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
    describe("has a fake method which", () => {
      it("sets a callback function to run", () => {
        p.fake(callback.mock);
        p.mock();
        expect(callback.calls).to.have.length(1);
      });
      it("passes arguments to the callback", () => {
        const args = random.n(random.integer, random.natural({
          min : 1,
          max : 20
        }));
        p.fake(callback.mock);
        p.mock.apply(null, args);
        expect(callback.calls[0].args).to.eql(args);
      });
      it("passes the context to the callback", () => {
        const context = {};
        p.fake(callback.mock);
        p.mock.call(context);
        expect(callback.calls[0].context).to.equal(context);
      });
      it("makes the mock return the fake's return value", () => {
        const ret = {};
        p.fake(callback.mock);
        callback.returnValue(ret);
        expect(p.mock()).to.equal(ret);
      });
    });
    describe("with template", () => {
      it("returns a new mock based on the template", () => {
        p.template({
          a : () => {}
        });
        expect(p.mock().a).to.be.a("function");
      });
      it("doesn't return the same object twice", () => {
        p.template({});
        expect(p.mock()).to.not.equal(p.mock());
      });
      it("applies fakes to the template", () => {
        const templateObj = p.template(() => {});
        templateObj.fake(callback.mock);
        const res = p.mock();
        res();
        res();
        expect(callback.calls).to.have.length(2);
      });
      it("saves the template instance", () => {
        const template = p.template(() => {});
        const res = p.mock();
        expect(template.instances[0]).to.have.property("mock", res);
      });
      it("also saves the template instance to the call", () => {
        const template = p.template(() => {});
        p.mock();
        expect(p.calls[0].instance).to.equal(template.instances[0]);
      });
      it("should be able to return the template", () => {
        const template = p.template({});
        expect(p.template()).to.equal(template);
      });
    });
    describe("as constructor", () => {
      it("should also have a Mock method", () => {
        expect(p.Mock).to.equal(p.mock);
      });
      it("should be a genuine instance", () => {
        expect(new p.Mock()).to.be.a(p.Mock);
      });
      it("should save a pretendr object to instance", () => {
        const obj = new p.Mock();
        expect(p.instances[0]).to.have.property("mock", obj);
      });
      it("should apply a template to the instance", () => {
        const templateDescriptor = {
          a : random.string()
        };
        p.template(templateDescriptor);
        const obj = new p.Mock();
        expect(obj).to.have.property("a", templateDescriptor.a);
      });
      it("makes the instance equal to the call", () => {
        new p.Mock();
        expect(p.instances[0]).to.equal(p.calls[0]);
      });
      it("sets the asConstructor property to true", () => {
        new p.Mock();
        expect(p.calls[0]).to.have.property("asConstructor", true);
      });
    });
    describe("findCall method", () => {
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
          fn = pretendr();
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
          // I'd like to see you come up with a better description!
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
  });
  describe("with an object", () => {
    let descriptor;
    let p;
    beforeEach(() => {
      descriptor = {
        stringProperty : random.string(),
        numberProperty : random.floating(),
        booleanProperty : random.bool(),
        aMethod : () => {}
      };
      p = pretendr(descriptor);
    });
    it("mocks its methods", () => {
      expect(p.aMethod.mock).to.be.a("function");
    });
    it("mocks strings", () => {
      expect(p.mock.stringProperty).to.eql(descriptor.stringProperty);
    });
    it("mocks numbers", () => {
      expect(p.mock.numberProperty).to.eql(descriptor.numberProperty);
    });
    it("mocks booleans", () => {
      expect(p.mock.booleanProperty).to.eql(descriptor.booleanProperty);
    });
    describe("has a mock property which", () => {
      it("is an object", () => {
        expect(p.mock).to.be.an("object");
      });
      it("doesn't equal the original", () => {
        expect(p.mock).to.not.equal(descriptor);
      });
      it("has corresponding properties for sub-pretendrs", () => {
        expect(p.mock).to.have.property("aMethod", p.aMethod.mock);
      });
    });
    describe("for each of its properties", () => {
      it("has a gets property which is set to 0", () => {
        expect(p.stringProperty.gets).to.equal(0);
      });
      it("increments the gets property with each retrieve", () => {
        const dummy = p.mock.stringProperty; // jshint ignore:line
        expect(p.stringProperty.gets).to.equal(1);
      });
      it("has an empty values array", () => {
        expect(p.stringProperty.values).to.eql([]);
      });
      it("pushes each set to the values array", () => {
        p.mock.stringProperty = random.string();
        expect(p.stringProperty.values[0]).to
          .equal(p.stringProperty.mock);
      });
    });
    describe("with circular references", () => {
      let descriptor;
      beforeEach(() => {
        descriptor = {};
        descriptor.circ = descriptor;
      });
      it("mimics the object with its own circular refs", () => {
        p = pretendr(descriptor);
        expect(p.circ).to.equal(p.circ.circ);
      });
      it("can still create multiple instances", () => {
        expect(pretendr(descriptor)).to.not.equal(pretendr(descriptor));
      });
    });
  });
  describe("with an array", () => {
    let descriptor;
    let p;
    beforeEach(() => {
      descriptor = generateArguments();
      p = pretendr(descriptor);
    });
    it("has an array as the mock", () => {
      expect(p.mock).to.be.an("array");
    });
    it("resembles the descriptor", () => {
      // need to use join because eql doesn't like the getters/setters
      expect(p.mock.join(",")).to.equal(descriptor.join(","));
    });
  });
  describe("with a promisable", () => {
    let p;
    let args;
    beforeEach(() => {
      p = pretendr(pretendr.promisable(false));
      args = generateArguments();
    });
    it("returns a function as the mock", () => {
      expect(p.mock).to.be.a("function");
    });
    it("creates separate instances on each call", () => {
      expect(p.mock()).to.not.equal(p.mock());
    });
    it("resolves with all .then()s when asked", () => {
      promiseSettlement("resolve", "then");
    });
    it("calls .then()s applied after resolving", () => {
      const callback = pretendr();
      const mockPromise = p.mock();
      p.calls[0].promise.resolve(...args);
      mockPromise.then(callback.mock);
      expect(callback.calls).to.have.length(1);
      expect(callback.calls[0].args).to.eql(args);
    });
    it("rejects with all .catch()s when asked", () => {
      promiseSettlement("reject", "catch");
    });
    it("calls .catch()s applied after rejecting", () => {
      const callback = pretendr();
      const mockPromise = p.mock();
      p.calls[0].promise.reject(...args);
      mockPromise.catch(callback.mock);
      expect(callback.calls).to.have.length(1);
      expect(callback.calls[0].args).to.eql(args);
    });
    it("runs finally on .resolve()", () => {
      const callback = pretendr();
      p.mock().finally(callback.mock);
      p.calls[0].promise.resolve();
      expect(callback.calls).to.have.length(1);
    });
    it("runs finally without any arguments", () => {
      const callback = pretendr();
      p.mock().finally(callback.mock);
      p.calls[0].promise.resolve(...args);
      expect(callback.calls[0].args).to.have.length(0);
    });
    it("applies the second argument of .then() if .reject() is called",
        () => {
      const callback1 = pretendr();
      const callback2 = pretendr();
      p.mock().then(callback1.mock, callback2.mock);
      p.calls[0].promise.reject(...args);
      expect(callback1.calls).to.have.length(0);
      expect(callback2.calls).to.have.length(1);
      expect(callback2.calls[0].args).to.eql(args);
    });
    it("allows settlement calls to be monitored as mocks", () => {
      const callback = pretendr();
      p.mock().then(callback.mock);
      const instance = p.calls[0].promise;
      expect(instance.then).to.have.property("calls");
      expect(instance.then.calls[0].args[0]).to.equal(callback.mock);
      expect(instance.catch).to.have.property("calls");
      expect(instance.finally).to.have.property("calls");
    });
    it("supports chaining", () => {
      let recursion = 0;
      testChains(p.mock().then(() => {}));
      recursion = 0;
      testChains(p.mock().catch(() => {}));
      recursion = 0;
      testChains(p.mock().finally(() => {}));
      function testChains(promise) {
        expect(promise).to.have.property("then")
          .and.to.have.property("catch")
          .and.to.have.property("finally");
        if (recursion++ < 2) {
          testChains(promise);
        }
      }
    });
    describe("set to async", function () {
      let p;
      let args;
      let callback;
      beforeEach(() => {
        p = pretendr(pretendr.promisable(true));
        args = generateArguments();
        callback = pretendr();
      });
      it("resolves asynchronously", (done) => {
        const mockPromise = p.mock();
        p.calls[0].promise.resolve();
        let asyncChecker = false;
        mockPromise.then(() => {
          expect(asyncChecker).to.equal(true);
          done();
        });
        asyncChecker = true;
      });
      it.skip("works with async/await", async () => {
        const mockPromise = p.mock();
        p.calls[0].promise.resolve();
        console.log(mockPromise.then(() => {}));
        await mockPromise.then(callback.mock);
        expect(callback.calls).to.have.length(1);
      });
    });
    function promiseSettlement(pretendrMethod, mockPromiseMethod) {
      const callbacks = pretendr(
        random.n(() => {
          return () => {};
        }, random.natural({
          min : 2,
          max : 10
        }))
      );
      const args = generateArguments();
      const mockPromise = p.mock(...args);
      const callbacksArray = Array.from(callbacks);
      callbacksArray.forEach((callback) => {
        mockPromise[mockPromiseMethod](callback.mock);
      });
      p.calls[0].promise[pretendrMethod]();
      callbacksArray.forEach((callback) => {
        expect(callback.calls).to.have.length(1);
        expect(callback.calls[0].args).to.eql(args);
      });
    }
  });
});
