var runner = require('qunit'),
    testDir = './test/';

runner.run({
    code : { path : './lib/pretendr.js', namespace : 'PRETENDR' },
    tests : './test/tests.js'
});
