/**
 * Module dependencies.
 */
var express = require('express'),
    color = require('colors'),
    guard = require('../').guard,
    fs = require('fs');
/*****************

 *****************/
var app = module.exports = express();
var minify = require('express-minify');
app.enable('trust proxy');
app.locals.pretty = true;
//app.use(minify());



var g = new guard({
    PACKAGE_HOME: __dirname + '/package',
    /* api 配置 */
    api: {
        use: function(appid, callback) {
            callback(null, {
                'wechat_conf': { },
                'wechat_oauth': { },
                'wechat_pay':{ }
            });
        }
    },
    /* 获取通用配置 */
    common_conf: function(appid, config, callback) {
        var key = config['appid']; // 'wx.appid'
        config['appid'] = 'wx50d746e9d0f0af1d';
        callback(null, config);
    },
    /* 保存API返回数据*/
    data: function(appid,apiname,data,callback){
        callback(null);
    }
});
app.use(g.proxy);


if (!module.parent) {
    app.listen(8000);
}
