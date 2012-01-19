/*
 * This shows the process for mocking a database object. The object has a
 * single method, connect, which returns an object which has a callback
 * called on it. This callback returns a database connection object, which
 * we will also mock.
 *
 * We could mock the original object instead of creating a new one. That's
 * just a matter of preference in this case.
 *
 */

// pretendr has been installed via npm
var pretendr = require('pretendr');

module("Database access", {
    setup : function () {
        // mock the database object
        this.database = pretendr.mock({
            connect : function () {}
        });
        // set a return value, as dbUtil will want to assign a callback method to it
        this.database.connect.setReturnValue({});
    }
});

test("database will connect", function () {
    dbUtil.connectToDatabase(this.database);

    // check that the connection function was called once
    equal(this.database.connect.calls.length, 1,
        "database connection function was called");
});
test("database will open a transaction as soon as it has connected", function () {
    dbUtil.connectToDatabase(this.database);

    // get the return value of the function call so we can call its callback
    // we could've saved this when we created it, but why clutter up the
    // namespace of the other tests when we can just do this!
    var connectionListener = this.database.connect.calls[0].returned;

    // Mock the connection object which is passed to the callback
    var databaseConnectionObject = pretendr.mock({
        transaction : function () {}
    });

    // call the connection callback which the object should have created
    connectionListener.onconnect(databaseConnectionObject);

    equal(databaseConnectionObject.transaction.calls.length, 1, "a transaction is created");
});
