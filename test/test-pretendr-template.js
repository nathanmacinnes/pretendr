const injectr = require("injectr");
const expect = require("expect.js");

describe("PretendrTemplate", () => {
  let PretendrTemplate;
  const dependencies = {};
  const callRecord = {};
  beforeEach(() => {
    callRecord.pretendr = [];
    dependencies.pretendr = function (...args) {
      const returnValue = {};
      callRecord.pretendr.push({
        arguments : args,
        returned : returnValue
      });
      return returnValue;
    };
    callRecord.Pretendr = [];
    dependencies.pretendr.Pretendr = function (...args) {
      callRecord.Pretendr.push({
        arguments : args
      });
    };
    PretendrTemplate = injectr("../lib/pretendr-template.js", {
      "./pretendr.js" : dependencies.pretendr
    });
  });
  it("extends Pretendr", () => {
    expect(new PretendrTemplate()).to.be.a(PretendrTemplate)
      .and.to.be.a(dependencies.pretendr.Pretendr);
  });
  describe("instance with simple object", () => {
    let t;
    let descriptor;
    beforeEach(() => {
      descriptor = {};
      t = new PretendrTemplate(descriptor);
    });
    it("passes the descriptor to the superconstructor", () => {
      expect(callRecord.Pretendr[0].arguments[0]).to.equal(descriptor);
    });
    describe(".makeInstance", () => {
      it("creates a new instance", () => {
        t.makeInstance();
        expect(callRecord.pretendr).to.have.length(1);
        expect(callRecord.pretendr[0].arguments[0]).to.equal(descriptor);
      });
      it("returns the instance", () => {
        expect(t.makeInstance()).to.equal(callRecord.pretendr[0].returned);
      });
      it("applies the instance to the passed call", () => {
        const call = {};
        const instance = t.makeInstance(call);
        expect(call.instance).to.equal(instance);
      });
    });
  });
});

/*
  it("passes it's descriptor to a new pretendr when .mock() called", () => {

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
    it.skip("should apply a template to the instance", () => {
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
  */
