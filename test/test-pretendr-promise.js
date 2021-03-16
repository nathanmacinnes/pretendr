const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");
const util = require("./util.js");

describe("PretendrPromise", () => {
  let dependencyCalls = {};
  let random;
  let PretendrPromise;
  let pretendrStub;
  let descriptor;
  beforeEach(function () {
    random = util.randomGenerator(
      chance(this.currentTest.title)
    );
    pretendrStub = function () {
      return {
        mock : {}
      };
    };
    dependencyCalls.Pretendr = [];
    pretendrStub.Pretendr = function (...args) {
      dependencyCalls.Pretendr.push({
        arguments : args
      });
    };
    // Instead of looking these up by call number, we'll do so by instance
    dependencyCalls.PretendrPromisable = new Map();
    pretendrStub.PretendrPromisable = function (...args) {
      dependencyCalls.PretendrPromisable.set(this, {
        arguments : args
      });
    };
    PretendrPromise = injectr("../lib/pretendr-promise.js", {
      "./pretendr.js" : pretendrStub
    });
  });
  describe("instance", () => {
    let p;
    beforeEach(() => {
      p = new PretendrPromise();
      descriptor = dependencyCalls.Pretendr[0].arguments[0];
    });
    it("extends Pretendr", () => {
      expect(p).to.be.a(pretendrStub.Pretendr)
        .and.to.be.a(PretendrPromise);
    });
    it("passes promisables to the superconstructor", () => {
      expect(descriptor.then).to.be.a(pretendrStub.PretendrPromisable);
      expect(descriptor.catch).to.be.a(pretendrStub.PretendrPromisable)
        .and.to.not.equal(descriptor.then);
      expect(descriptor.finally).to.be.a(pretendrStub.PretendrPromisable)
        .and.to.not.equal(descriptor.then)
        .and.to.not.equal(descriptor.catch);
    });
    it("passes the async setting to PretendrPromisables", () => {
      dependencyCalls.PretendrPromisable.forEach((call) => {
        expect(call.arguments[0]).to.have.property("async", false);
      });
    });
    it("passes settlement functions to the Promisable calls", () => {
      expect(getSettlementFn("then")).to.be.a("function");
      expect(getSettlementFn("catch")).to.be.a("function");
      expect(getSettlementFn("finally")).to.be.a("function");
    });
    describe(".resolve()", () => {
      let thenSettlementFn;
      let finallySettlementFn;
      beforeEach(() => {
        thenSettlementFn = getSettlementFn("then");
        finallySettlementFn = getSettlementFn("finally");
      });
      it("runs resolutions with/without arguments", () => {
        const wasRan = [];
        const args = random.arguments();
        random.array(() => {
          const index = wasRan.push({}) - 1;
          thenSettlementFn(function (...callbackArgs) {
            wasRan[index].then = callbackArgs;
          });
          finallySettlementFn(function (...callbackArgs) {
            wasRan[index].finally = callbackArgs;
          });
        });
        p.resolve(...args);
        wasRan.forEach((callbackCall) => {
          expect(callbackCall.then).to.eql(args);
          expect(callbackCall.finally).to.have.length(0);
        });
      });
      it("causes .then()/.finally() to run their callbacks immediately", () => {
        const args = random.arguments();
        p.resolve(...args);
        let calledWith = null;
        thenSettlementFn((...args) => {
          calledWith = args;
        });
        expect(calledWith).to.eql(args);
        calledWith = null;
        finallySettlementFn((...args) => {
          calledWith = args;
        });
        expect(calledWith).to.eql([]);
      });
    });
    describe(".reject()", () => {
      let thenSettlementFn;
      let catchSettlementFn;
      let finallySettlementFn;
      beforeEach(() => {
        thenSettlementFn = getSettlementFn("then");
        catchSettlementFn = getSettlementFn("catch");
        finallySettlementFn = getSettlementFn("finally");
      });
      it("runs rejection callbacks", () => {
        const wasRan = [];
        const args = random.arguments();
        random.array(() => {
          const index = wasRan.push({}) - 1;
          catchSettlementFn(function (...callbackArgs) {
            wasRan[index].catch = callbackArgs;
          });
          finallySettlementFn(function (...callbackArgs) {
            wasRan[index].finally = callbackArgs;
          });
        });
        p.reject(...args);
        wasRan.forEach((callbackCall) => {
          expect(callbackCall.catch).to.eql(args);
          expect(callbackCall.finally).to.have.length(0);
        });
      });
      it("causes rejection methods to run their callbacks immediately", () => {
        const args = random.arguments();
        p.reject(...args);
        let calledWith = null;
        catchSettlementFn((...args) => {
          calledWith = args;
        });
        expect(calledWith).to.eql(args);
        calledWith = null;
        finallySettlementFn((...args) => {
          calledWith = args;
        });
        expect(calledWith).to.eql([]);
      });
      it("does not run a .then() callback, before or after", () => {
        let ran = false;
        function callback() {
          ran = true;
        }
        thenSettlementFn(callback);
        p.reject();
        thenSettlementFn(callback);
        expect(ran).to.be(false);
      });
      it("runs .then()'s second argument, if supplied", () => {
        let ran = [null, null];
        function callback1() {
          ran[0] = true;
        }
        function callback2(...cbArgs) {
          ran[1] = cbArgs;
        }
        const args = random.arguments();
        thenSettlementFn(callback1, callback2);
        p.reject(...args);
        expect(ran).to.eql([null, args]);
        ran = [null, null];
        thenSettlementFn(callback1, callback2);
        expect(ran).to.eql([null, args]);
      });
    });
  });
  describe("instance, set to async", () => {
    let p;
    beforeEach(() => {
      p = new PretendrPromise({
        async : true
      });
      descriptor = dependencyCalls.Pretendr[0].arguments[0];
    });
    it("passes the async setting to PretendrPromisables", () => {
      dependencyCalls.PretendrPromisable.forEach((call) => {
        expect(call.arguments[0]).to.have.property("async", true);
      });
    });
    it("runs the methods asynchronously", (done) => {
      let asyncCheck = false;
      getSettlementFn("then")(() => {
        expect(asyncCheck).to.equal(true);
        done();
      });
      p.resolve();
      asyncCheck = true;
    });
  });
  function getSettlementFn(methodName) {
    const call = dependencyCalls.PretendrPromisable.get(
      descriptor[methodName]);
    return call.arguments[0].callback;
  }
});
