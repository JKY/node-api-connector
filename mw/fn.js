var api_factory = require('./common').api_factory,
    out = require('./common').out,
    INDENT = require('../util').INDENT,
    fs = require('fs');


var __fn = function(appid, opt, callback) {
    opt.api.use(appid, function(err, conf) {
        var content = '';
        var APIS = api_factory(opt);
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


module.exports = function(router, req, resp, next, opt) {
    /* 前端 API */
    var matches = req['url'].match(router);
    var appid = matches[1];
    __fn(appid, opt, function(err, content) {
        out(resp, 200, content);
    });
}
