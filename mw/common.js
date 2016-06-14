var color = require('colors'),
    link = require('../link').link,
    fs = require('fs'),
    formidable = require('formidable'),
    fsmonitor = require('fsmonitor');

var package = exports.package = {
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
};





/* api config factory */
exports.api_factory = function(opt) {
    if (__apis == null) {
        __apis = package.load(opt.PACKAGE_HOME);
        //console.log(JSON.stringify(apis, null, 4));
    };
    return __apis;
};



/* 解析form*/
exports.parse_form = function(req, resp, func) {
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


exports.ip = function(req) {
    var _ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return _ip;
};


exports.out = function(resp, code, content, type) {
    resp.writeHead(code, {
        'Content-Type': type || 'text/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    });
    return resp.end(content);
};


var __apis = null;
exports.init = function(opt) {
    fsmonitor.watch(opt.PACKAGE_HOME, null, function() {
        /* reload */
        __apis = package.load(opt.PACKAGE_HOME);
    });
    package.load(opt.PACKAGE_HOME);
};
