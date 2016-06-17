var api_factory = require('./common').api_factory,
    out = require('./common').out,
    parse_form = require('./common').parse_form,
    fs = require('fs');

var __update_conf = function(opt, uid, appid, apiname, conf, fields, files, callback) {
    var tmp = {};
    var regx = /^(\w+)_(\w+)_(\d+)$/;
    for (var k in fields) {
        var matches = k.match(regx);
        if (matches) {
            var name = matches[1];
            var entry = matches[2];
            var n = matches[3];
            if (!tmp[name]) {
                tmp[name] = {};
            };
            if (!tmp[name][n]) {
                tmp[name][n] = {};
            };
            tmp[name][n][entry] = fields[k];
        }
    };
    for (var name in conf) {
        var c = conf[name];
        switch (c['type']) {
            case 'number':
                conf[name]['value'] = fields[name];
                break;
            case 'string':
                conf[name]['value'] = fields[name];
                break;
            case 'file':
                conf[name]['value'] = '@' + name;
                break;
            case 'list':
                if (tmp[name]) {
                    var template = {};
                    for (var k in c) {
                        template['type'] = c[k]['type'];
                        template['desc'] = c[k]['desc'];
                        template['value'] = '';
                    };
                    var f = tmp[name];
                    c['value'] = [];
                    for (var n in f) {
                        var v = f[n];
                        var o = Object.assign({}, template);
                        for (var name in v) {
                            o[name]['value'] = v[name];
                        };
                        c['value'].push(o);
                    }
                }
                break;

        }
    };
    console.log(conf);
    callback(null, conf);
};


module.exports = function(router, req, resp,next, opt) {
    /* 配置 */
    var matches = req['url'].match(router);
    var uid = matches[1];
    var appid = matches[2];
    var apiname = matches[3];
    var MAP = api_factory(opt);
    if (MAP[apiname]) {
        var conf = MAP[apiname]['endpoint']['app']['conf'];
        /* get */
        if (req['method'].toLowerCase() == 'get') {
            out(resp, 200, JSON.stringify(conf));
        } else if (req['method'].toLowerCase() == 'post') {
            /* set*/
            parse_form(req, resp, function(fileds, files) {
                console.log('======= conf =======');
                console.log('fileds:');
                console.log(fileds);
                console.log('files:');
                console.log(files);
                //__update_conf(opt, uid, appid, apiname, conf, fileds, files, function(err, result) {
                //    out(resp, 200, JSON.stringify(result));
                //});
            });
        }
    } else {
        console.log(('endpoint undefined:' + apiname).red);
        out(resp, 200, JSON.stringify({
            err: 'endpoint not found'
        }));
    }
}
