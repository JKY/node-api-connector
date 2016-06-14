var api_factory = require('./common').api_factory,
    out = require('./common').out,
    parse_form = require('./common').parse_form,
    ip = require('./common').ip,
    request = require('request'),
    fs = require('fs');


var HEADERS = {
    'mkit_appid': true,
    'mkit_apiname': true,
    'mkit_ip': true
};


/* make a http request */
var __send_req = function(req, data, callback, key, cert) {
    var self = this;
    var q = {
        'url': req['url'],
        'method': req.method,
        'headers': {}
    };
    if (data && req['method'].toLowerCase() == 'post') {
        q['headers']['Content-type'] = 'application/x-www-form-urlencoded';
        q['form'] = data;
    };
    if (req['headers']) {
        for (var key in req['headers']) {
            if(HEADERS[key])
                q['headers'][key] = req['headers'][key];
        }
    };
    if (key != '' && cert != '') {
        q['agentOptions'] = { 'key': key, 'cert': cert, }
    };
    request(q, function(err, response, body) {
        if (!err && response) {
            if(response['statusCode'] == 200){
                 console.log(req.url.yellow + ' ' + response['statusCode'].toString().green);
            }else{
                 console.log(req.url.yellow + ' ' + response['statusCode'].toString().red);
            };
            if (!err && response && response['statusCode'] == 200) {
                callback(null, response['statusCode'], body);
            } else {
                //console.log('======= http response ========');
                //console.log('error:'+err);
                //console.log(response);
                //console.log(body);
                callback(null, response['statusCode'], null);
            }
        } else {
            console.log('----- request err -----');
            console.log(err);
            callback(err, 505, null);
        }
    });
};


/* proxy http request */
var __proxy = function(endpoint, req, resp, context, opt, callback) {
    console.log((' >>> ' + req['url']).yellow);
    var config = {};
    for (var key in endpoint['endpoint']['param']) {
        var arg = endpoint['endpoint']['param'][key];
        if (arg['ref']) {
            config[key] = arg['ref']
        }
    };
    opt.api.conf.get(context.appid, config, function(err, result) {
        var method = req['method'];
        var data = {};
        for (var name in result) {
            data[name] = result[name];
        };
        if (method.toLowerCase() == 'get') {
            for (var name in req['query']) {
                data[name] = req['query'][name];
            };
            var url = endpoint['endpoint']['url'];
            var tmp = [];
            for (var key in data) {
                tmp.push(key + '=' + data[key]);
            };
            if (tmp.length > 0)
                url += '?' + tmp.join('&');
            __send_req({
                method: method,
                url: url
            }, data, callback);
        } else if (method.toLowerCase() == 'post') {
            parse_form(req, resp, function(fileds, files) {
                for (var name in fileds) {
                    data[name] = fileds[name];
                };
                __send_req({
                    method: method,
                    url: endpoint['endpoint']['url'],
                    headers: req.headers,
                }, data, callback);
            });
        };
    });
};


module.exports = function(router, req, resp, next, opt) {
    /* endpoints */
    var matches = req['url'].match(router);
    if (matches) {
        var appid = matches[1];
        var name = matches[2];
        var MAP = api_factory(opt);
        req['headers']['mkit_appid'] = appid;
        req['headers']['mkit_apiname'] = name;
        req['headers']['mkit_ip'] = ip(req);
        if (MAP[name]) {
            var context = {
                appid: appid
            };
            __proxy(MAP[name], req, resp, context, opt, function(err, code, body) {
                console.log('########'.yellow);
                out(resp, 200, body);
            });
        } else {
            console.log(('endpoint undefined:' + name).red);
            out(resp, 404, JSON.stringify({
                err: 'endpoint not found'
            }));
        }
    } else {
        next();
    }
};
