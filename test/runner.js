var runner = require('qunit'),
    testDir = './test/';

runner.run({
    code : { path : './lib/pretendr.js', namespace : 'pretendr' },
    tests : './test/tests.js'
});
