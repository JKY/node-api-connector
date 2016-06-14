var api_factory = require('./common').api_factory,
    out = require('./common').out,
    fs = require('fs');

module.exports = function(router, req, resp, next, opt) {
    var APIS = api_factory(opt);
    var matches = req['url'].match(router);
    var name = matches[1];
    var tmp = APIS[name];
    if (!tmp) {
        out(resp, 404, "");
    } else {
        fs.readFile(tmp['path'] + '/tests/index.html', { encoding: 'utf8' }, function(err, html) {
            out(resp, err == null ? 200 : 404, html || err, 'text/html');
        })
    }
};
