/*jslint node: true, plusplus: true, indent: 4, maxlen: 80 */

module.exports = function (o) {
	"use strict";
	var ins = [],
		outs = [],
		pretendr,
		pretendrFunction,
		pretendrPrimitive;

	pretendr = function (input, forced) {
		var i,
			indexNumber,
			mock,
			output,
			type;
		for (i = 0; i < ins.length; i++) {
			if (input === ins[i]) {
				return outs[i];
			}
		}
		ins.push(input);
		indexNumber = ins.length - 1;
		if (typeof input === 'function' || typeof input === 'object') {
			if (typeof input === 'function') {
				output = pretendrFunction();
			} else {
				if (forced) {
					mock = forced;
				} else if (input instanceof Array) {
					mock = [];
				} else {
					mock = {};
				}
				output = {
					mock : mock
				};
			}
			outs[indexNumber] = output;
			for (i in input) {
				if (input.hasOwnProperty(i)) {
					type = typeof input[i];
					if (type === 'object' || type === 'function') {
						output[i] = pretendr(input[i]);
						output.mock[i] = output[i].mock;
					} else {
						output[i] = pretendrPrimitive(input[i], output.mock, i);
					}
				}
			}
			return output;
		}
		return pretendrPrimitive(input);
	};

	pretendrFunction = function () {
		var fake,
			pretendrObj,
			templateFake,
			templateReturnValue,
			returnValue,
			template;
		pretendrObj = {
			calls : [],
			instances : [],
			returnValue : function (r) {
				returnValue = r;
			},
			fake : function (fn) {
				fake = fn;
			},
			template : function (t) {
				template = t;
				return {
					returnValue : function (val) {
						templateReturnValue = val;
					},
					fake : function (fn) {
						templateFake = fn;
					}
				};
			},
			mock : function () {
				var call,
					i;
				call = {
					args : arguments,
					context : this
				};
				for (i = 0; i < arguments.length; i++) {
					if (typeof arguments[i] === 'function') {
						call.callback = arguments[i];
					}
				}
				pretendrObj.calls.push(call);
				if (this instanceof pretendrObj.mock) {
					pretendrObj.instances.push(pretendr(
						template,
						this
					));
				} else if (fake) {
					call.returned = fake.apply(this, arguments);
				} else if (template) {
					call.pretendr = module.exports(template);
					if (templateReturnValue) {
						call.pretendr.returnValue(templateReturnValue);
					}
					if (templateFake) {
						call.pretendr.fake(templateFake);
					}
					call.returned = call.pretendr.mock;
				} else {
					call.returned = returnValue;
				}
				return call.returned;
			}
		};
		return pretendrObj;
	};

	pretendrPrimitive = function (val, parent, property) {
		var get,
			pretendrObj,
			set;
		pretendrObj = parent || {};
		get = function () {
			this.gets = this.gets + 1;
			return val;
		};
		set = function (v) {
			val = v;
			this.values.push(v);
		};
		if (Object.defineProperty) {
			pretendrObj.gets = 0;
			pretendrObj.values = [];
			Object.defineProperty(pretendrObj, property || 'mock', {
				get : get,
				set : set
			});
		} else {
			pretendrObj.mock = val;
		}
		return pretendrObj;
	};

	return pretendr(o);
};
