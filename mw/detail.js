var api_factory = require('./common').api_factory,
    out = require('./common').out,
    fs = require('fs');

module.exports = function(router, req, resp, next, opt) {
    /* 获取 API 详情 */
    var APIS = api_factory(opt);
    var matches = req['url'].match(router);
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
        out(resp, 200, JSON.stringify({
            'err': null,
            'result': result
        }, null, 4));
    } else {
        out(resp, 404, JSON.stringify({ 'err': 'not found' }, null, 4));
    };
}
