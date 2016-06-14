var color = require('colors'),
    INDENT = require('./util').INDENT,
    link = require('./link').link,
    request = require('request'),
    fs = require('fs'),
    net = require('net'),
    http = require('http'),
    https = require('https'),
    formidable = require('formidable'),
    fsmonitor = require('fsmonitor'),
    url = require('url');

var __apis = null;

var package = {
    /* read manefest config packages */
    load: function(home) {
        var result = {};
        var dir = fs.readdirSync(home);
        dir.forEach(function(name) {
            var p = home + '/' + name;
            var stats = fs.statSync(p);
            if (stats.isDirectory()) {
                var manifest = p + '/manifest.json';
                if (!fs.existsSync(manifest)) {
                    console.log((manifest + ' not exist').red);
                    return;
                } else {
                    var tmp = fs.readFileSync(manifest, { encoding: 'utf8' });
                    try {
                        var m = JSON.parse(tmp);
                        m['path'] = p;
                        var path = m['path'] + '/' + m['endpoint']['response']['handler'];
                        /* inject response handler script */
                        var tmp = fs.readFileSync(path, { encoding: 'utf8' });
                        m['linked'] = link(3, tmp);
                        result[m['name']] = m;
                        console.log(('loaded [' + m['name'] + ']').green);
                    } catch (e) {
                        console.log(manifest + ' not found'.red);
                        console.log(e);
                    }
                }
            }
        });
        return result;
    }
}

/* api config factory */
var __factory = function(opt) {
    if (__apis == null) {
        __apis = package.load(opt.PACKAGE_HOME);
        //console.log(JSON.stringify(apis, null, 4));
    };
    return __apis;
};


var __fn = function(appid, opt, callback) {
    opt.api.use(appid, function(err, conf) {
        var content = '';
        var APIS = __factory(opt);
        var block = "";
        var libs = "__init([\n";
        for (var name in conf) {
            var o = APIS[name];
            if (!o) {
                console.log((name + ' not defined in APIS').red);
                return;
            };
            var depend = o['endpoint']['response']['depend'];
            if (depend) {
                depend.forEach(function(d) {
                    libs += INDENT(1, '"' + d['url'] + '",\n');
                });
            };
            var glue = ['\n'];
            glue.push(INDENT(1, '/************************************************************'));
            glue.push(INDENT(1, ' * name:' + o['name']));
            glue.push(INDENT(1, ' * ver:' + o['version']));
            glue.push(INDENT(1, ' * description:' + o['desc']));
            glue.push(INDENT(1, ' ***********************************************************/'));

            /** glue **/
            var args = [];
            var endpoint = o['endpoint'];
            for (var arg in endpoint['param']) {
                if (!endpoint['param'][arg]['ref'])
                    args.push(arg);
            };
            glue.push(INDENT(1, 'window.mkit.prototype["' + o['name'] + '"] = function(' + args.join(',') + '){'));
            glue.push(o['linked']);
            glue.push(INDENT(1, '};'));
            var str = glue.join("\n");
            block += str;
        };
        libs += '],function(){\n';
        content += libs;
        content += block + '\n});\n';
        callback(null, content);
    });
};


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


/* 解析form*/
var __form = function(req, resp, func) {
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.on('progress', function(bytesReceived, bytesExpected) {

    });
    form.on('end', function() {

    });
    form.onPart = function(part) {
        if (!part.filename) {
            form.handlePart(part);
            return;
        }
        part.on("data", function(buffer) {
            if (!form._files) form._files = {};
            if (!form._files[part.filename]) {
                form._files[part.filename] = buffer;
            } else {
                form._files[part.filename] = Buffer.concat([form._files[part.filename], buffer]);
            }
        });
        part.on("end", function() {
            form.emit('file', part.name, {
                partname: part.name,
                name: uid(req) + "_" + Date.now() + "." + part.filename.split(".").pop(),
                data: form._files[part.filename]
            });
        });
    };
    form.parse(req, function(err, fileds, files) {
        if (err !== null) {
            sys.log(("pare form error:" + err).red);
            return;
        } else {
            func(fileds, files);
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
            __form(req, resp, function(fileds, files) {
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
    callback(null, conf);
};

var get_client_ip = exports.get_client_ip = function(req) {
    var _ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return _ip;
};




var __output = function(resp, code, content, type) {
    resp.writeHead(code, {
        'Content-Type': type || 'text/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    });
    return resp.end(content);
};

exports.guard = function(opt) {
    fsmonitor.watch(opt.PACKAGE_HOME, null, function() {
        /* reload */
        __apis = package.load(opt.PACKAGE_HOME);
    });
    package.load(opt.PACKAGE_HOME);
    /*********************************
     * 处理请求
     *********************************/
    this.proxy = function(req, resp, next) {
        var router = {
            'api': /^\/api.js$/,
            'fn': /^\/(\w+)\/fn.js[^\/]*$/,
            'endpoint': /^\/(\w+)\/endpoint\/(\w+)[^\/]*$/,
            'ls': /^\/api\/list$/,
            'conf': /^\/(\w+)\/(\w+)\/(\w+)\/conf$/,
            'detail': /^\/api\/(\w+)$/,
            'doc': /^\/api\/(\w+)\/doc$/,
            'tests': /^\/api\/tests\/(\w+)(\?(.*))?/,
            'data': /^\/data\/(\w+)\/(\w+)(\?(.*))?/,
        };
        /* 获取加载的 API 列表 */
        if (router.ls.test(req['url'])) {
            var APIS = __factory(opt);
            var result = [];
            for (var key in APIS) {
                var a = APIS[key];
                result.push({
                    name: a['name'],
                    title: a['title'],
                    version: a['version'],
                    desc: a['desc'],
                    icon: a['icon'],
                    author: a['author'],
                    homepage: a['homepage'],
                    title: a['title'],
                    cost: a['cost']
                })
            };
            __output(resp, 200, JSON.stringify(result, null, 4));
        } else if (router.api.test(req['url'])) {
            /* 前端 SHELL */
            fs.readFile(__dirname + '/lib/api.js', { encoding: 'utf8' }, function(err, content) {
                __output(resp, 200, content);
            });
        } else if (router.detail.test(req['url'])) {
            /* 获取 API 详情 */
            var APIS = __factory(opt);
            var matches = req['url'].match(router.detail);
            var apiname = matches[1];
            if (APIS[apiname]) {
                var item = APIS[apiname];
                var result = {
                    name: item['name'],
                    title: item['title'],
                    version: item['version'],
                    desc: item['desc'],
                    cost: item['cost'],
                    icon: item['icon'],
                    conf: item['endpoint']['app']['conf']
                };
                __output(resp, 200, content, JSON.stringify({
                    'err': null,
                    'result': result
                }, null, 4));
            } else {
                __output(resp, 404, JSON.stringify({ 'err': 'not found' }, null, 4));
            };
        } else if (router.doc.test(req['url'])) {
            var APIS = __factory(opt);
            var matches = req['url'].match(router.doc);
            var apiname = matches[1];
            if (APIS[apiname]) {
                var item = APIS[apiname];
                fs.readFile(item.path + '/doc.md', { encoding: 'utf8' }, function(err, content) {
                    __output(resp, err == null ? 200 : 500, content);
                });
            } else {
                __output(resp, 404, JSON.stringify({ 'err': 'not found' }, null, 4));
            };
        } else if (router.fn.test(req['url'])) {
            /* 前端 API */
            var matches = req['url'].match(router.fn);
            var appid = matches[1];
            __fn(appid, opt, function(err, content) {
                __output(resp, 200, content);
            });
        } else if (router.tests.test(req['url'])) {
            var APIS = __factory(opt);
            var matches = req['url'].match(router.tests);
            var name = matches[1];
            var tmp = APIS[name];
            if (!tmp) {
                __output(resp, 404, "");
            } else {
                fs.readFile(tmp['path'] + '/tests/index.html', { encoding: 'utf8' }, function(err, html) {
                    __output(resp, err == null ? 200 : 404, html || err, 'text/html');
                })
            }
        } else if (router.conf.test(req['url'])) {
            /* 配置 */
            var matches = req['url'].match(router.conf);
            var uid = matches[1];
            var appid = matches[2];
            var apiname = matches[3];
            var MAP = __factory(opt);
            if (MAP[apiname]) {
                var conf = MAP[apiname]['endpoint']['app']['conf'];
                /* get */
                if (req['method'].toLowerCase() == 'get') {
                    __output(resp, 200, JSON.stringify(conf));
                } else if (req['method'].toLowerCase() == 'post') {
                    /* set*/
                    __form(req, resp, function(fileds, files) {
                        __update_conf(opt, uid, appid, apiname, conf, fileds, files, function(err, result) {
                            __output(resp, 200, JSON.stringify(result));
                        });
                    });
                }
            } else {
                console.log(('endpoint undefined:' + apiname).red);
                __output(resp, 200, JSON.stringify({
                    err: 'endpoint not found'
                }));
            }
        } else if (router.data.test(req['url'])) {
            /* receiv data */
            var matches = req['url'].match(router.data);
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
                req.on('end', function () {
                    opt.api.data.save(appid, apiname, body, function(err, result) {
                        __output(resp, 200, JSON.stringify({
                            'err': err,
                            'result': result
                        }));
                });
                });
            } else {
                __output(resp, 200, JSON.stringify({
                    err: 'post please!!!'
                }));
            }
        } else {
            /* endpoints */
            var matches = req['url'].match(router.endpoint);
            if (matches) {
                var appid = matches[1];
                var name = matches[2];
                var MAP = __factory(opt);
                req['headers']['mkit_appid'] = appid;
                req['headers']['mkit_apiname'] = name;
                req['headers']['mkit_ip'] = get_client_ip(req);
                if (MAP[name]) {
                    var context = {
                        appid: appid
                    };
                    __proxy(MAP[name], req, resp, context, opt, function(err, code, body) {
                        console.log('########'.yellow);
                        console.log(body.yellow);
                        __output(resp, 200, body);
                    });
                } else {
                    console.log(('endpoint undefined:' + name).red);
                    __output(resp, 404, JSON.stringify({
                        err: 'endpoint not found'
                    }));
                }
            } else {
                next();
            }
        };
    }
};
