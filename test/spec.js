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
            this.objToMock = {};
            this.pretendrResult = this.pretendr(this.objToMock);
        });
        it("should return a new object", function () {
            expect(this.pretendrResult.mock).to.be.an('object');
            expect(this.pretendrResult.mock).to.not.equal(this.o);
        });
        describe("with properties", function () {
            beforeEach(function () {
                this.objToMock = {
                    method : function () {}
                };
                this.pretendrResult = this.pretendr(this.objToMock);
            });
            it("should pretendr the methods", function () {
                this.pretendrResult.mock.method();
                expect(this.pretendrResult.method)
                    .to.be.pretendr(this.pretendrResult.method.mock);
            });
        });
        describe("with circular reference", function () {
            beforeEach(function () {
                this.objToMock = {};
                this.objToMock.circular = this.objToMock;
                this.pretendrResult = this.pretendr(this.objToMock);
            });
            it("should make references equal", function () {
                expect(this.objToMock.circular).to.equal(this.objToMock);
            });
            it("should allow creation of new copies", function () {
                var n = this.pretendr(this.objToMock);
                expect(n).to.not.equal(this.pretendrResult);
            });
        });
    });
    describe("function", function () {
        beforeEach(function () {
            this.pretendrResult = this.pretendr(function () {});
        });
        it("should record the calls to the mock", function () {
            expect(this.pretendrResult.calls).to.have.length(0);
            this.pretendrResult.mock();
            expect(this.pretendrResult.calls).to.have.length(1);
            this.pretendrResult.mock();
            expect(this.pretendrResult.calls).to.have.length(2);
        });
        it("should record the arguments to each call", function () {
            var calls;
            this.pretendrResult.mock('foo', 'bar');
            calls = this.pretendrResult.calls;
            expect(calls[0]).to.have.property('args');
            expect(calls[0].args).to.have.property(0, 'foo');
            expect(calls[0].args).to.have.property(1, 'bar');
            this.pretendrResult.mock('baz');
            expect(calls[1].args).to.have.property(0, 'baz');
        });
        it("should return the context of each call", function () {
            var context = {};
            this.pretendrResult.mock.call(context);
            expect(this.pretendrResult.calls[0])
                .to.have.property('context', context);
        });
        it("should have a settable return value", function () {
            this.pretendrResult.returnValue('baz');
            expect(this.pretendrResult.mock()).to.equal('baz');
        });
        it("should run and return a fake function", function () {
            var ret,
                fake = this.pretendr(function () {});
            fake.returnValue(0);
            this.pretendrResult.fake(fake.mock);
            ret = this.pretendrResult.mock('arg1');
            expect(fake.calls).to.have.length(1);
            expect(fake.calls[0].args[0]).to.equal('arg1');
            expect(ret).to.equal(0);
        });
        it("should record the returned values", function () {
            this.pretendrResult.returnValue(6);
            this.pretendrResult.mock();
            expect(this.pretendrResult.calls[0])
                .to.have.property('returned', 6);
            this.pretendrResult.fake(function () {
                return 1;
            });
            this.pretendrResult.mock();
            expect(this.pretendrResult.calls[1])
                .to.have.property('returned', 1);
        });
        it("should be able to find the callback function", function () {
            var cb = this.pretendr(function () {}),
                ret = {};
            this.pretendrResult.mock(cb.mock);
            this.pretendrResult.calls[0].callback();
            expect(cb.calls).to.have.length(1);
            this.pretendrResult.mock(1, '2', cb.mock);
            cb.returnValue(ret);
            expect(this.pretendrResult.calls[1]
                .callback('argument to callback'))
                .to.equal(ret);
            expect(cb.calls).to.have.length(2);
            expect(cb.calls[1].args[0]).to.equal('argument to callback');
        });
        it("should be able to return a pretendr from template", function () {
            var calls,
                template = {
                    a : function () {}
                };
            this.pretendrResult.template(template);
            this.pretendrResult.mock();
            calls = this.pretendrResult.calls;
            expect(calls[0].pretendr).to.be.pretendr(template);
            this.pretendrResult.mock();
            expect(calls[1].pretendr).to.not.equal(calls[0].pretendr);
        });
        it("should be able to return the template", function () {
            var template = this.pretendrResult.template({});
            expect(this.pretendrResult.template()).to.equal(template);
        });
        it("should make all the return options overwrite others", function () {
            this.pretendrResult.template({
                a : {}
            });
            this.pretendrResult.returnValue(5);
            expect(this.pretendrResult.mock()).to.equal(5);
            this.pretendrResult.fake(function () {
                return 7;
            });
            expect(this.pretendrResult.mock()).to.equal(7);
            this.pretendrResult.template(8);
            expect(this.pretendrResult.mock()).to.equal(8);
        });
        describe("as constructor", function () {
            it("should record instances", function () {
                var instance,
                    Mock = this.pretendrResult.mock;
                expect(this.pretendrResult.instances).to.have.length(0);
                instance = new Mock();
                expect(this.pretendrResult.instances).to.have.length(1);
                instance = new Mock();
                expect(this.pretendrResult.instances).to.have.length(2);
            });
            it("should record the instance which is returned", function () {
                var instance,
                    Mock = this.pretendrResult.mock,
                    template = {
                        a : function () {}
                    };
                this.pretendrResult.template(template);
                instance = new Mock();
                expect(instance)
                    .to.equal(this.pretendrResult.instances[0].mock);
            });
            it("should not record function calls as instances", function () {
                this.pretendrResult.mock();
                this.pretendrResult.mock.call({});
                expect(this.pretendrResult.instances).to.have.length(0);
            });
            it("returned instances should be pretendr objects", function () {
                var instance,
                    Mock = this.pretendrResult.mock,
                    template = {
                        method : function () {}
                    };
                this.pretendrResult.template(template);
                instance = new Mock();
                instance.method();
                expect(this.pretendrResult.instances[0])
                    .to.be.pretendr(template);
            });
            it("should always return actual instances", function () {
                var instance,
                    Mock = this.pretendrResult.mock,
                    template = {};
                this.pretendrResult.template(template);
                instance = new Mock();
                expect(instance).to.be.a(this.pretendrResult.mock);
            });
        });
        describe("with properties", function () {
            it("should mock the properties", function () {
                var fn = function () {};
                fn.method = function () {};
                this.pretendrResult = this.pretendr(fn);
                expect(this.pretendrResult.method).to.be.pretendr(fn.method);
            });
            it("should handle circular references", function () {
                var fn = function () {};
                fn.method = fn;
                this.pretendrResult = this.pretendr(fn);
                expect(this.pretendrResult)
                    .to.equal(this.pretendrResult.method);
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
            expect(prim.primitive.gets).to.equal(0);
            b = prim.mock.primitive;
            expect(prim.primitive.gets).to.equal(1);
            b = prim.mock.primitive;
            expect(prim.primitive.gets).to.equal(2);
        });
    });
    describe("#template", function () {
        it("should be able to define return values", function () {
            var m = this.pretendr(function () {}),
                result,
                templateObj;
            templateObj = m.template(function () {});
            templateObj.returnValue('a');
            result = m.mock();
            expect(result()).to.equal('a');
        });
        it("should be able to define a fake", function () {
            var fake,
                mockObj = this.pretendr(function () {}),
                result,
                templateObj;
            templateObj = mockObj.template(function () {});
            fake = this.pretendr(function () {});
            templateObj.fake(fake.mock);
            result = mockObj.mock();
            result();
            expect(fake.calls).to.have.length(1);
        });
        it("should be able to have a template of its own", function () {
            var mockObj = this.pretendr(function () {}),
                result,
                result2,
                subTemplate = { a : 'b' },
                template;
            template = mockObj.template(function () {});
            template = template.template(subTemplate);
            result = mockObj.mock();
            result2 = result();
            expect(result2).to.have.property('a', 'b');
        });
        it("should be deep like pretendr objects", function () {
            var mockObj = this.pretendr(function () {}),
                result,
                template;
            template = mockObj.template({
                method : function () {},
                property : {
                    subMethod : function () {}
                }
            });
            template.method.returnValue(4);
            template.property.subMethod.returnValue(5);
            result = mockObj.mock();
            expect(result.method()).to.equal(4);
            expect(result.property.subMethod()).to.equal(5);
        });
        it("shouldn't have meaningless methods for objects", function () {
            var mockObj = this.pretendr(function () {}),
                template;
            template = mockObj.template({});
            expect(template).to.not.have.property('returnValue')
                .and.not.have.property('fake')
                .and.not.have.property('template');
        });
		it("should handle infinite loops", function () {
			var mockObj = this.pretendr(function () {}),
				templateDescriptor,
				template;
			templateDescriptor = {};
			templateDescriptor.a = templateDescriptor;
			expect(function () {
				mockObj.template(templateDescriptor);
			}).to.not.throwError();
		});
		it("should not have a mock property", function () {
		    var template = this.pretendr(function () {}).template({});
		    expect(template).to.not.have.property('mock');
		});
    });
    describe("array", function () {
        beforeEach(function () {
            var fn = function () {};
            this.objToMock = [1, 'two', fn];
            this.pretendrResult = this.pretendr(this.objToMock);
        });
        it("should create another array as the mock", function () {
            expect(this.pretendrResult.mock).to.be.an('array')
                .and.not.to.equal(this.objToMock)
                .and.to.have.length(this.objToMock.length);
        });
        it("should mock the elements", function () {
            var assigned = this.pretendrResult.mock[0];
            expect(this.pretendrResult[0].gets).to.equal(1);
            assigned = this.pretendrResult.mock[2]();
            expect(this.pretendrResult[2].calls).to.have.length(1);
        });
    });
});
