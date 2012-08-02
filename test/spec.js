/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */
/*global afterEach: false,
    beforeEach: false,
    describe: false,
    it: false,
    should: false */

"use strict";

var expect = require("expect.js");

// Extend expect.js with an assertion to check if an object is a pretendr
expect.Assertion.prototype.pretendr = function (of) {
    var assert,
        self = this,
        check;
    assert = function (condition) {
        var objStr = Object.prototype.toString.call(self.obj),
            ofStr = Object.prototype.toString.call(of),
            strPos,
            strNeg;
        strPos = 'expected ' + objStr + ' to be a pretendr';
        strNeg = 'expected ' + objStr + 'object to not be a pretendr';
        if (of) {
            strPos = strPos + ' of ' + ofStr;
            strNeg = strNeg + ' of ' + ofStr;
        }
        self.assert(
            condition,
            strPos,
            strNeg
        );
    };
    assert(this.obj.hasOwnProperty('mock'));
    check = function (mock, base, corresponding) {
        var i,
            len;
        if (typeof mock === 'object') {
            assert(mock !== base);
            for (i in mock) {
                if (mock.hasOwnProperty(i)) {
                    if (corresponding) {
                        assert(corresponding.hasOwnProperty(i));
                        check(mock[i], base[i], corresponding[i]);
                    } else {
                        check(mock[i], base[i]);
                    }
                }
            }
            if (corresponding) {
                for (i in corresponding) {
                    if (corresponding.hasOwnProperty(i)) {
                        assert(mock.hasOwnProperty(i));
                    }
                }
            }
        }
        if (typeof mock === 'function') {
            assert(base.hasOwnProperty('calls'));
            assert(base.calls instanceof Array);
            len = base.calls.length;
            mock('arg');
            assert(base.calls.length === len + 1);
            if (corresponding) {
                assert(typeof corresponding === 'function');
            }
        }
    };
    check(this.obj.mock, this.obj, of);
};

describe("pretendr", function () {
    beforeEach(function () {
        this.pretendr = require('../lib/pretendr.js');
    });
    describe("object", function () {
        beforeEach(function () {
            this.o = {};
            this.p = this.pretendr(this.o);
        });
        it("should return a new object", function () {
            expect(this.p.mock).to.be.an('object');
            expect(this.p.mock).to.not.equal(this.o);
        });
        describe("with properties", function () {
            beforeEach(function () {
                this.o = {
                    method : function () {}
                };
                this.p = this.pretendr(this.o);
            });
            it("should pretendr the methods", function () {
                this.p.mock.method();
                expect(this.p.method).to.be.pretendr(this.p.method.mock);
            });
        });
        describe("with circular reference", function () {
            beforeEach(function () {
                this.o = {};
                this.o.circular = this.o;
                this.p = this.pretendr(this.o);
            });
            it("should make references equal", function () {
                expect(this.o.circular).to.equal(this.o);
            });
            it("should allow creation of new copies", function () {
                var n = this.pretendr(this.o);
                expect(n).to.not.equal(this.p);
            });
        });
    });
    describe("function", function () {
        beforeEach(function () {
            this.p = this.pretendr(function () {});
        });
        it("should record the calls to the mock", function () {
            expect(this.p.calls).to.have.length(0);
            this.p.mock();
            expect(this.p.calls).to.have.length(1);
            this.p.mock();
            expect(this.p.calls).to.have.length(2);
        });
        it("should record the arguments to each call", function () {
            this.p.mock('foo', 'bar');
            expect(this.p.calls[0]).to.have.property('args');
            expect(this.p.calls[0].args).to.have.property(0, 'foo');
            expect(this.p.calls[0].args).to.have.property(1, 'bar');
            this.p.mock('baz');
            expect(this.p.calls[1].args).to.have.property(0, 'baz');
        });
        it("should return the context of each call", function () {
            var context = {};
            this.p.mock.call(context);
            expect(this.p.calls[0]).to.have.property('context', context);
        });
        it("should have a settable return value", function () {
            this.p.returnValue('baz');
            expect(this.p.mock()).to.equal('baz');
        });
        it("should run and return a fake function", function () {
            var ret,
                fake = this.pretendr(function () {});
            fake.returnValue(0);
            this.p.fake(fake.mock);
            ret = this.p.mock('arg1');
            expect(fake.calls).to.have.length(1);
            expect(fake.calls[0].args[0]).to.equal('arg1');
            expect(ret).to.equal(0);
        });
        it("should record the returned values", function () {
            this.p.returnValue(6);
            this.p.mock();
            expect(this.p.calls[0]).to.have.property('returned', 6);
            this.p.fake(function () {
                return 1;
            });
            this.p.mock();
            expect(this.p.calls[1]).to.have.property('returned', 1);
        });
        it("should be able to find the callback function", function () {
            var cb = this.pretendr(function () {}),
                ret = {};
            this.p.mock(cb.mock);
            this.p.calls[0].callback();
            expect(cb.calls).to.have.length(1);
            this.p.mock(1, '2', cb.mock);
            cb.returnValue(ret);
            expect(this.p.calls[1].callback('argument to callback'))
                .to.equal(ret);
            expect(cb.calls).to.have.length(2);
            expect(cb.calls[1].args[0]).to.equal('argument to callback');
        });
        it("should be able to return a pretendr from template", function () {
            var calls,
                template = {
                    a : function () {}
                };
            this.p.template(template);
            this.p.mock();
            calls = this.p.calls;
            expect(calls[0].pretendr).to.be.pretendr(template);
            this.p.mock();
            expect(calls[1].pretendr).to.not.equal(calls[0].pretendr);
        });
        describe("as constructor", function () {
            it("should record instances", function () {
                var instance,
                    Mock = this.p.mock;
                expect(this.p.instances).to.have.length(0);
                instance = new Mock();
                expect(this.p.instances).to.have.length(1);
                instance = new Mock();
                expect(this.p.instances).to.have.length(2);
            });
            it("should record the instance which is returned", function () {
                var instance,
                    Mock = this.p.mock,
                    template = {
                        a : function () {}
                    };
                this.p.template(template);
                instance = new Mock();
                expect(instance).to.equal(this.p.instances[0].mock);
            });
            it("should not record function calls as instances", function () {
                this.p.mock();
                this.p.mock.call({});
                expect(this.p.instances).to.have.length(0);
            });
            it("returned instances should be pretendr objects", function () {
                var instance,
                    Mock = this.p.mock,
                    template = {
                        method : function () {}
                    };
                this.p.template(template);
                instance = new Mock();
                instance.method();
                expect(this.p.instances[0]).to.be.pretendr(template);
            });
            it("should always return actual instances", function () {
                var instance,
                    Mock = this.p.mock,
                    template = {};
                this.p.template(template);
                instance = new Mock();
                expect(instance).to.be.a(this.p.mock);
            });
        });
        describe("with properties", function () {
            it("should mock the properties", function () {
                var fn = function () {};
                fn.method = function () {};
                this.p = this.pretendr(fn);
                expect(this.p.method).to.be.pretendr(fn.method);
            });
            it("should handle circular references", function () {
                var fn = function () {};
                fn.method = fn;
                this.p = this.pretendr(fn);
                expect(this.p).to.equal(this.p.method);
            });
        });
    });
    describe("primitive", function () {
        beforeEach(function () {
            this.num = this.pretendr(4);
            this.str = this.pretendr('a string');
            this.bool = this.pretendr(true);
            this.definePropertyBackup = Object.defineProperty;
            this.definePropertiesBackup = Object.defineProperties;
        });
        afterEach(function () {
            // do this in afterEach even though it's only for one test so that
            // if there's an error, it'll still be done.
            Object.defineProperty = this.definePropertyBackup;
            Object.defineProperties = this.definePropertiesBackup;
        });
        it("should return the value", function () {
            expect(this.num.mock).to.equal(4);
            expect(this.str.mock).to.equal('a string');
            expect(this.bool.mock).to.equal(true);
        });
        it("should return the number of gets", function () {
            expect(this.num.gets).to.equal(0);
            var assigned = this.num.mock;
            expect(this.num.gets).to.equal(1);
        });
        it("should record the value changes", function () {
            expect(this.num.values).to.have.length(0);
            this.num.mock = 6;
            expect(this.num.values).to.have.property(0, 6);
        });
        it("should not try to return the gets if not supported", function () {
            var prim;
            Object.defineProperty = undefined;
            prim = this.pretendr(4);
            expect(prim.mock).to.equal(4);
            expect(prim).to.not.have.property('gets');
            expect(prim).to.not.have.property('values');
        });
        it("should return gets on primitives in object context", function () {
            var b,
                prim = this.pretendr({
                    primitive : 'a'
                });
            b = prim.mock.primitive;
            expect(prim.primitive.gets).to.equal(1);
            b = prim.mock.primitive;
            expect(prim.primitive.gets).to.equal(2);
        });
    });
    describe("#template", function () {
        it("should be able to define return values", function () {
            var m = this.pretendr(function () {}),
                res,
                t;
            t = m.template(function () {});
            t.returnValue('a');
            res = m.mock();
            expect(res()).to.equal('a');
        });
        it("should be able to define a fake", function () {
            var fake,
                m = this.pretendr(function () {}),
                res,
                t;
            t = m.template(function () {});
            fake = this.pretendr(function () {});
            t.fake(fake.mock);
            res = m.mock();
            res();
            expect(fake.calls).to.have.length(1);
        });
        it("should be able to have a template of its own", function () {
            var m = this.pretendr(function () {}),
                res,
                subT = { a : 'b' },
                t;
            t = m.template(function () {});
            t = t.template(subT);
            res = m.mock();
            res = res();
            expect(res).to.have.property('a', 'b');
        });
        it("should be deep like pretendr objects", function () {
            var m = this.pretendr(function () {}),
                res,
                t;
            t = m.template({
                method : function () {}
            });
            t.method.returnValue(4);
            res = m.mock();
            expect(res.method()).to.equal(4);
        });
    });
    describe("array", function () {
        beforeEach(function () {
            var fn = function () {};
            this.o = [1, 'two', fn];
            this.p = this.pretendr(this.o);
        });
        it("should create another array as the mock", function () {
            expect(this.p.mock).to.be.an('array')
                .and.to.not.equal(this.o)
                .and.to.have.length(this.o.length);
        });
        it("should mock the elements", function () {
            var assigned = this.p.mock[0];
            expect(this.p[0].gets).to.equal(1);
            assigned = this.p.mock[2]();
            expect(this.p[2].calls).to.have.length(1);
        });
    });
});
