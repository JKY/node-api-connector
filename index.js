var colors = require('colors'),
    common = require('./mw/common');

var ROUTER =  {
    'shell':{
        'path': 'mkit.js(.*)?',
        'handler': null
     },
    'fn': {
        'path': '(\\w+)/fn.js',
        'handler': null
     },
    'endpoint': {
        'path': '(\\w+)/endpoint/(\\w+)[^/]*$',
        'handler': null
     },
    'ls': {
        'path': 'api/list$',
        'handler': null
     },
    'conf': {
        'path': '(\\w+)/(\\w+)/(\\w+)/conf$',
        'handler': null
     },
    'detail': {
        'path': 'api/(\\w+)$',
        'handler': null
     },
    'doc': {
        'path': 'api/(\\w+)/doc$',
        'handler': null
     },
    'tests': {
        'path': 'api/tests/(\\w+)(.*)?',
        'handler': null
     },
    'data': {
        'path': 'data/(\\w+)/(\\w+)/(\\w+)(.*)?',
        'handler': null
     }

};
var HANDLER = {};
exports.guard = function(opt) {
    common.init(opt);
    var prefix = opt['prefix'] || '';
    for (var key in ROUTER) {
        ROUTER[key]['path'] = new RegExp(prefix + '/' + ROUTER[key]['path']);
        ROUTER[key]['handler'] = require(__dirname + '/mw/' + key);
    };
    /*********************************
     * 处理请求
     *********************************/
    this.proxy = function(req, resp, next) {
        for (var key in ROUTER) {
            var rex = ROUTER[key]['path'];
            if (req['url'].match(rex)) {
                return ROUTER[key]['handler'](rex, req, resp, next, opt);
            }
        };
        next();
    }
};
