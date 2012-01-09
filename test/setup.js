(function () {
    "use strict";
    // Make strictEqual the default
    window.looseEqual = window.equal;
    window.equal = window.strictEqual;
}());
