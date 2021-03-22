const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");
const util = require("./util.js");

describe("pretendr", () => {
  let random;
  let pretendr;
  let dependencyArguments;
  beforeEach(function () {
    pretendr = injectr("../lib/pretendr.js", {}, {});
    pretendr.PretendrFunction = function (...args) {
      dependencyArguments = args;
    };
    pretendr.PretendrPromisable = function () {};
    random = util.randomGenerator(chance(this.currentTest.title));
  });
  it("is a function", () => {
    expect(pretendr).to.be.a("function");
  });
  it("returns an instance of the Pretendr class", () => {
    expect(pretendr({})).to.be.a(pretendr.Pretendr);
  });
  it("returns an object with a mock property", () => {
    expect(pretendr({})).to.be.an("object")
      .and.to.have.property("mock");
  });
  it("returns a pretendr function when passed a function", () => {
    const result = pretendr(function () {});
    expect(result).to.be.a(pretendr.PretendrFunction);
  });
  it("returns a pretendr function when no arguments are given", () => {
    const result = pretendr();
    expect(result).to.be.a(pretendr.PretendrFunction);
  });
  it("returns an undefined pretendr when undefined is given", () => {
    expect(pretendr(undefined)).to.have.property("mock", undefined);
  });
  it("returns a null pretendr when null is given", () => {
    expect(pretendr(null)).to.have.property("mock", null);
  });
  describe("when passed an object", () => {
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
      expect(p.aMethod).to.be.a(pretendr.PretendrFunction);
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
    it("incorporates existing pretendrs when passed as properties", () => {
      const descriptor2 = {
        existingPretendr : p
      };
      const p2 = pretendr(descriptor2);
      expect(p2).to.have.property("existingPretendr", p);
      expect(p2.mock).to.have.property("existingPretendr", p.mock);
    });
    describe("pretendr({}).mock", () => {
      it("is an object", () => {
        expect(p.mock).to.be.an("object");
        expect(p.mock).to.not.be.an(Array);
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
        p.mock.stringProperty; // jshint ignore:line
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
      descriptor = random.arguments();
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
  describe("with a complex array", () => {
    let descriptor;
    let p;
    beforeEach(() => {
      descriptor = [{
        property : random.string()
      }];
      p = pretendr(descriptor);
    });
    it("pretendrs the object in the array", () => {
      expect(p.mock[0]).to.eql(descriptor[0]).and.not.equal(descriptor[0]);
      expect(p[0].gets).to.equal(1);
      p.mock[0] = "";
      expect(p[0].values).to.eql([""]);
    });
  });
  describe(".reset() method", () => {
    let descriptor;
    let p;
    let resetCalled = false;
    let resetArguments = null;
    beforeEach(() => {
      descriptor = {
        method : () => {},
        stringProperty : random.string(),
        arrayProperty : random.arguments()
      };
      pretendr.PretendrFunction.prototype.reset = (...args) => {
        resetCalled = true;
        resetArguments = args;
      };
      p = pretendr(descriptor);
    });
    it("restores the values of properties to their originals", () => {
      const original = descriptor.stringProperty;
      p.mock.stringProperty = "";
      p.reset();
      expect(p.mock.stringProperty).to.equal(original);
    });
    it("resets the get count of properties", () => {
      p.mock.arrayProperty[0] = p.mock.stringProperty;
      p.reset();
      expect(p.stringProperty.gets).to.equal(0);
      expect(p.arrayProperty.gets).to.equal(0);
    });
    it("resets the .values of properties", () => {
      p.mock.stringProperty = "";
      p.reset();
      expect(p.stringProperty.values).to.eql([]);
    });
    it("calls .reset() on each of the properties/methods", () => {
      p.reset();
      expect(resetCalled).to.equal(true);
    });
    it("passes the new pretendr to the next .reset() call", () => {
      p.reset();
      expect(resetArguments[0]).to.be.a(pretendr.PretendrFunction);
    });
    it("receives a copies a recieved pretendr object", () => {
      const p2 = pretendr({
        a : 0,
        b : 2
      });
      p2.mock.a = p2.mock.b;
      p.reset(p2);
      expect(p.b).to.equal(p2.b);
    });
  });
});
