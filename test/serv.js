/**
 * Module dependencies.
 */
var express = require('express'),
	conf = require('./conf').conf,
	color = require('colors'),
	util = require('./lib/util'),
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
		use: function(appid,callback){
			callback(null,{
				'wechat_conf': {

				 }
			});
		}
	},
	/* 获取配置 */
	get_conf:function(config,context,callback){
		config['appid'] = 'wx50d746e9d0f0af1d';
		callback(null,config);
	}
});
app.use(g.proxy);



var vhome = __dirname + '/views';
app.use(express.static(vhome));
app.set('views', [vhome]);
/* views config */
app.get('/',function(req,resp){
	resp.render('index.jade');
});


if (!module.parent) {
  	app.listen(conf.port);
  	console.log(conf['appname'] + ' runnng port:' + conf.port);
}

