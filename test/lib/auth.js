var sys = require('sys'),
	crypto = require('crypto'),
	sysutil = require('util'),
	settings = require('../settings').settings,
	clientip = require('./util').get_client_ip;
    wxapp = require('./wxsdk').app;

/* util functions */
var util = exports.util = {
	mkq: function(query,appid,apikey){
		var keys = [];
		query['appid'] = appid;
	    for(var k in query){
	    	keys.push(k);
	    }
	    var pairs = [];
	    keys.sort();
	    keys.forEach(function(key){
	    	pairs.push(key+'='+query[key]);
	    });
	    var hash = crypto.createHash('md5');
	    var param = pairs.join('&');
		hash.update(new Buffer(param+apikey).toString("binary"));
		return sysutil.format('%s&key=%s',param,hash.digest('hex'));
	}
};

/*
console.log(util.mkq({
	'openid':'oBMupuClZCbFKHnhoFq3u8qOqCj0',
	'content':'中文'
},'wxe6ea629bc532a9e5','1234'));*/

/* auth method */
var method = exports.method = {
	base: function(req,callback){
		callback(true);
	},

	/* 
	 *  对query param 按字母顺序排序, 
	 *  str="a=1&b=2&key=xxx', 
	 *  key=hash('a=1&b=2'+apikey) 
	 */
	sign: function(req,callback){
		var query = req['query'];
		var appid = '';
		var K = ''; 
		/* xxxx */
		var keys = [];
	    for(var k in query){
	    	switch(k){
	    		case 'key':
	    			K = query['key'];
	    			break;
	    		case 'appid':
	    			appid = query['appid'];
	    			keys.push(k);
	    			break;
	    		default:
	    			keys.push(k);
	    			break;
	    	}
	    }
	    var pairs = [];
	    keys.sort();
	    keys.forEach(function(key){
	    	pairs.push(key+'='+query[key]);
	    });
	    wxapp.get(appid,function(err,app){
	    	if(err || app == null){
	    		callback(false);
	    	}else{
	    		var hash = crypto.createHash('md5');
			    hash.update(new Buffer(pairs.join('&') + app['apikey']).toString("binary"));
			    callback(K==hash.digest('hex'));
			}
	    });
	    return true;
	},

	wl: function(req,callback){
		var ip = clientip(req);
		var result = settings.whitelist.indexOf(ip);
		if(result < 0){
			sys.log((ip + ' blocked').red);
		};
		callback(result >= 0);
		return true;
	}
};


/* main */
var Authorizer = exports.Authorizer = function(config){
	this.__config = config;
	/* test using configed auth method */
	this.passed = function(req,callback){
		var url = req.url;
		var result = true;
		for(var i=0;i<this.__config.length;i++){
			var item = this.__config[i];
			if(url.indexOf(item['path']) >= 0){
				var method = item['method'];
				if(method(req,callback)){
					return;
				}
			}
		};
		/* not in config list, passwd default */
		callback(true);
	} 
}