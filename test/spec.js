"use strict";

var chance = require("chance"),
    expect = require("expect.js"),
    injectr = require("injectr");

describe("pretendr", function () {
    var random,
        generateArguments,
        pretendr;
    beforeEach(function () {
        random = new chance.Chance(
            // until pull request 94 gets merged on chance.js
            this.currentTest.title.charCodeAt(5)
        );
        pretendr = injectr("../lib/pretendr.js");

        generateArguments = function () {
            return random.n(random.string, random.natural({
                min : 1,
                max : 20
            }));
        };
    });
    it("is a function", function () {
        expect(pretendr).to.be.a("function");
    });
    it("returns an object with a mock property", function () {
        expect(pretendr()).to.be.an("object")
            .and.to.have.property("mock");
    });
    it("returns a pretendr function when no arguments are given", function () {
        var withFn = pretendr(function () {}),
            withNoArgs = pretendr();

        // eql won't work because it expects functions to be ===
        Object.keys(withFn).forEach(function (key) {
            expect(withFn[key].toString()).to.equal(withNoArgs[key].toString());
        });
    });
    it("returns an undefined pretendr when undefined is given", function () {
        expect(pretendr(undefined)).to.have.property("mock", undefined);
    });
    it("returns a null pretendr when null is given", function () {
        expect(pretendr(null)).to.have.property("mock", null);
    });
    describe("with function", function () {
        var callback,
            p;
        beforeEach(function () {

            // dogfood
            callback = pretendr();

            p = pretendr();
        });
        it("has an empty calls array", function () {
            expect(p.calls).to.be.eql([]);
        });
        it("mocks its properties", function () {
            var fn = function () {},
                property = random.string();
            fn[property] = function () {};
            p = pretendr(fn);
            p.mock[property]();
            expect(p[property].calls).to.have.length(1);
        });
        describe("has a mock property which", function () {
            it("is a function", function () {
                expect(p.mock).to.be.a("function");
            });
            it("records its calls", function () {
                p.mock();
                expect(p.calls).to.have.length(1);
            });
            it("records the arguments to each call", function () {
                var args = random.n(random.integer, random.natural({
                    min : 1,
                    max : 20
                }));
                p.mock.apply(null, args);
                expect(p.calls[0].args).to.eql(args);
            });
            it("records the context of each call", function () {
                var context = {};
                p.mock.call(context);
                expect(p.calls[0]).to.have.property("context", context);
            });
            it("records the return value of fakes", function () {
                var ret = {};
                p.fake(callback.mock);
                callback.returnValue(ret);
                p.mock();
                expect(p.calls[0]).to.have.property("returned", ret);
            });
            it("finds the callback", function () {
                var args = generateArguments().concat(callback.mock)
                    .concat(generateArguments());
                p.mock.apply(null, args);
                expect(p.calls[0]).to.have.property("callback", callback.mock);
            });
        });
        describe("has a returnValue method which", function () {
            it("sets the return value", function () {
                var v = {};
                p.returnValue(v);
                expect(p.mock()).to.equal(v);
            });
            it("can retrieve the return value", function () {
                p.returnValue({});
                expect(p.returnValue()).to.equal(p.mock());
            });
            it("sets a return value of undefined when told to", function () {
                p.returnValue({});
                p.returnValue(undefined);
                expect(p.returnValue()).to.equal(undefined);
            });
        });
        describe("has a fake method which", function () {
            it("sets a callback function to run", function () {
                p.fake(callback.mock);
                p.mock();
                expect(callback.calls).to.have.length(1);
            });
            it("passes arguments to the callback", function () {
                var args = random.n(random.integer, random.natural({
                    min : 1,
                    max : 20
                }));
                p.fake(callback.mock);
                p.mock.apply(null, args);
                expect(callback.calls[0].args).to.eql(args);
            });
            it("passes the context to the callback", function () {
                var context = {};
                p.fake(callback.mock);
                p.mock.call(context);
                expect(callback.calls[0].context).to.equal(context);
            });
            it("makes the mock return the fake's return value", function () {
                var ret = {};
                p.fake(callback.mock);
                callback.returnValue(ret);
                expect(p.mock()).to.equal(ret);
            });
        });
        describe("with template", function () {
            it("returns a new mock based on the template", function () {
                p.template({
                    a : function () {}
                });
                expect(p.mock().a).to.be.a("function");
            });
            it("doesn't return the same object twice", function () {
                p.template({});
                expect(p.mock()).to.not.equal(p.mock());
            });
            it("applies fakes appropriately", function () {
                var res,
                    templateObj = p.template({
                        a : function () {}
                    });
                templateObj.a.fake(callback.mock);
                res = p.mock();
                res.a();
                res.a();
                expect(callback.calls).to.have.length(2);
            });
            it("saves the template instance", function () {
                var res,
                    template = p.template(function () {});
                res = p.mock();
                expect(template.instances[0]).to.have.property("mock", res);
            });
            it("also saves the template instance to the call", function () {
                var template = p.template(function () {});
                p.mock();
                expect(template.instances[0]).to.equal(p.calls[0].pretendr);
            });
            it("should be able to return the template", function () {
                var template = p.template({});
                expect(p.template()).to.equal(template);
            });
        });
        describe("as constructor", function () {
            it("should also have a Mock method", function () {
                expect(p.Mock).to.equal(p.mock);
            });
            it("should be a genuine instance", function () {
                expect(new p.Mock()).to.be.a(p.Mock);
            });
            it("should save a pretendr object to instance", function () {
                var obj = new p.Mock();
                expect(p.instances[0]).to.have.property("mock", obj);
            });
            it("should apply a template to the instance", function () {
                var obj,
                    templateDescriptor = {
                        a : random.string()
                    };
                p.template(templateDescriptor);
                obj = new p.Mock();
                expect(obj).to.have.property("a", templateDescriptor.a);
            });
        });
    });
    describe("with an object", function () {
        var descriptor,
            p;
        beforeEach(function () {
            descriptor = {
                stringProperty : random.string(),
                numberProperty : random.floating(),
                booleanProperty : random.bool(),
                aMethod : function () {}
            };
            p = pretendr(descriptor);
        });
        it("mocks its methods", function () {
            expect(p.aMethod.mock).to.be.a("function");
        });
        it("mocks strings", function () {
            expect(p.mock.stringProperty).to.eql(descriptor.stringProperty);
        });
        it("mocks numbers", function () {
            expect(p.mock.numberProperty).to.eql(descriptor.numberProperty);
        });
        it("mocks booleans", function () {
            expect(p.mock.booleanProperty).to.eql(descriptor.booleanProperty);
        });
        describe("has a mock property which", function () {
            it("is an object", function () {
                expect(p.mock).to.be.an("object");
            });
            it("doesn't equal the original", function () {
                expect(p.mock).to.not.equal(descriptor);
            });
            it("has corresponding properties for sub-pretendrs", function () {
                expect(p.mock).to.have.property("aMethod", p.aMethod.mock);
            });
        });
        describe("for each of its properties", function () {
            it("has a gets property which is set to 0", function () {
                expect(p.stringProperty.gets).to.equal(0);
            });
            it("increments the gets property with each retrieve", function () {
                var dummy = p.mock.stringProperty; // jshint ignore:line
                expect(p.stringProperty.gets).to.equal(1);
            });
            it("has an empty values array", function () {
                expect(p.stringProperty.values).to.eql([]);
            });
            it("pushes each set to the values array", function () {
                p.mock.stringProperty = random.string();
                expect(p.stringProperty.values[0]).to
                    .equal(p.stringProperty.mock);
            });
        });
        describe("with circular references", function () {
            var descriptor;
            beforeEach(function () {
                descriptor = {};
                descriptor.circ = descriptor;
            });
            it("mimics the object with its own circular refs", function () {
                p = pretendr(descriptor);
                expect(p.circ).to.equal(p.circ.circ);
            });
            it("can still create multiple instances", function () {
                expect(pretendr(descriptor)).to.not.equal(pretendr(descriptor));
            });
        });
    });
    describe("with an array", function () {
        var descriptor,
            p;
        beforeEach(function () {
            descriptor = random.n(random.string, random.natural({
                min : 1,
                max : 20
            }));
            p = pretendr(descriptor);
        });
        it("has an array as the mock", function () {
            expect(p.mock).to.be.an("array");
        });
        it("resembles the descriptor", function () {
            // need to use join because eql doesn't like the getters/setters
            expect(p.mock.join(",")).to.equal(descriptor.join(","));
        });
    });
});
