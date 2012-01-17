var runner = require('qunit'),
    testDir = './test/';

runner.run({
    code : { path : './source/mockery.js', namespace : 'mockery' },
    tests : './test/tests.js'
});
