var api_factory = require('./common').api_factory,
    out = require('./common').out,
    fs = require('fs');

module.exports = function(router, req, resp, next, opt) {
    var APIS = api_factory(opt);
    var matches = req['url'].match(router);
    var apiname = matches[1];
    if (APIS[apiname]) {
        var item = APIS[apiname];
        fs.readFile(item.path + '/doc.md', { encoding: 'utf8' }, function(err, content) {
            out(resp, err == null ? 200 : 500, content);
        });
    } else {
        out(resp, 404, JSON.stringify({ 'err': 'not found' }, null, 4));
    };
};
