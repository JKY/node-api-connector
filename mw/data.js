var api_factory = require('./common').api_factory,
    out = require('./common').out,
    fs = require('fs');

module.exports = function(router, req, resp, next, opt) {
    /* receiv data */
    var matches = req['url'].match(router);
    var appid = matches[1];
    var apiname = matches[2];
    if (req['method'].toLowerCase() == 'post') {
        var body = '';
        req.on('data', function(data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });
        console.log('------')
        console.log(body);
        req.on('end', function() {
            opt.api.data.save(appid, apiname, body, function(err, result) {
                out(resp, 200, JSON.stringify({
                    'err': err,
                    'result': result
                }));
            });
        });
    } else {
        out(resp, 200, JSON.stringify({
            err: 'post please!!!'
        }));
    }
};
