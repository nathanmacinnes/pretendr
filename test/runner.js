var runner = require('qunit'),
    testDir = './test/';

runner.run({
    code : { path : './lib/mockery.js', namespace : 'mockery' },
    tests : './test/tests.js'
});
