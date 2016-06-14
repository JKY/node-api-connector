/* process request results */
var handler = function(data) {
    var defer = $.Deferred();
    this.__ajax.post("/endpoint/store", data, function(err, result) {
        console.log(result);
    });
    return defer.promise();
}
