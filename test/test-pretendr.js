const chance = require("chance-multiseed");
const expect = require("expect.js");
const injectr = require("injectr");

describe("pretendr", () => {
  let random;
  let generateArguments;
  let pretendr;
  let dependencyArguments;
  beforeEach(function () {
    pretendr = injectr("../lib/pretendr.js", {});
    pretendr.PretendrFunction = function (...args) {
      dependencyArguments = args;
    };
    pretendr.PretendrPromisable = function () {};
    random = chance(this.currentTest.title);
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
});
