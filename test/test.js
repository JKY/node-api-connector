/**
 * Module dependencies.
 */
var express = require('express'),
    color = require('colors'),
    guard = require('../').guard,
    favicon = require('express-favicon'),
    fs = require('fs');
/*****************

 *****************/
var app = module.exports = express();
app.use(favicon(__dirname + '/logo.png'));
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
                'store': true,
                'wx_conf': true,
                'wx_oauth': true,
                'wx_pay': true
            });
        },

        conf: {
            get: function(appid, config, callback) {
                for(var key in config){
                    if(key == 'appid'){
                         config['appid'] = 'wx50d746e9d0f0af1d';//'wx22fb445469f289a2';
                    }
                }
                callback(null, config);
            }
        },

        data: {
            save: function(appid, apiname, data,callback){
                console.log('==== data ====');
                console.log(appid + ':' + apiname);
                console.log(data);
                callback(null,null);
            }
        }
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
