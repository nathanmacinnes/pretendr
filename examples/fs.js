/*
  These examples are integration tests. They compile and run with mocha.

  Run `grunt examples` to see them in action.
*/

const expect = require("expect.js");
const pretendr = require("../lib/main.js");

describe("example 1: basic file system", () => {
  const mockFs = pretendr({
    readFile : function () {},
    stat : function () {}
  });
  const mockTextDisplay = pretendr();
  const filename = "example.txt";

  beforeEach(() => {
    mockFs.reset();
    mockTextDisplay.reset();
    example1(mockFs.mock, filename, mockTextDisplay.mock);
  });
  it("checks fs methods are called in the correct order", () => {
    expect(mockFs.stat.calledOnce).to.be.ok();
    expect(mockFs.stat.calls[0].args[0]).to.equal(filename);

    expect(mockFs.readFile.called).to.not.be.ok();

    mockFs.stat.calls[0].callback(null, {
      isDirectory : false
    });

    expect(mockFs.readFile.called).to.be.ok();
    expect(mockFs.readFile.calls[0].args[0]).to.equal(filename);
    expect(mockFs.readFile.calls[0].args[1]).to.equal(mockTextDisplay.mock);
  });
  it("checks error handling", () => {
    example1(mockFs.mock, filename);

    expect(() => {
      mockFs.stat.calls[0].callback(null, {
        isDirectory : true
      });
    }).to.throwError(/can't read a directory\!/);

    const fakeError = new Error();

    expect(() => {
      mockFs.stat.calls[0].callback(fakeError);
    }).to.throwError(fakeError);
  });
});

function example1(fs, filename, displayToUser) {
  fs.stat(filename, function (err, stat) {
    if (err) {
      throw err;
    }
    if (stat.isDirectory) {
      throw new Error("can't read a directory!");
    }
    fs.readFile(filename, displayToUser);
  });
}
