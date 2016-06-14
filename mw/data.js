var api_factory = require('./common').api_factory,
    out = require('./common').out,
    crypto = require('crypto'),
    fs = require('fs');

function md5(data,key){
    var md5 = crypto.createHash('md5');
    md5.update(data+key);
    return md5.digest('hex');
}

module.exports = function(router, req, resp, next, opt) { 
    /* receiv data */
    var matches = req['url'].match(router);
    var appid = matches[1];
    var apiname = matches[2];
    var hash = matches[3];
    if (req['method'].toLowerCase() == 'post') {
        var API = api_factory(opt);
        var a = API[apiname];
        if(!a){
               out(resp, 200, JSON.stringify({
                    'err': 'api not found'
                }));
               return;
        };
        var body = '';
        req.on('data', function(data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });
        req.on('end', function() {
            var key = a['endpoint']['data']['key'];
            if(md5(body,key) !== hash){
                out(resp, 500, JSON.stringify({
                    'err': 'authorized failed'
                }));
               return;
            };
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
