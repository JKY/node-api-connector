var net = require('net');
var http = require('http'),https = require('https'), url = require('url');
var constants = require('constants');
var fs = require('fs');
var sys = require('sys');
var request = require('request');


var HTTP = exports.HTTP = function(){
	var self = this;
	this.rq = function(req,data,callback,key,cert){
		var self = this;
		var q = {'url': req['url'],
				 'method':req.method,
				 'body': data
				};
		if(key != '' && cert != ''){
			q['agentOptions']= {'key': key,'cert': cert,}
		};
		//sys.debug('rq:' + req['url']);
		request(q,function(err, response, body){
				if(!err && response){
					//sys.log(req.url + ' ' + response['statusCode']);
					if(!err && response && response['statusCode'] == 200){
						callback(null,body);
					}else{
						//console.log('======= http response ========');
						//console.log('error:'+err);
						//console.log(response);
						//console.log(body);
						callback('http request error',null);
					}
				}else{
					console.log('----- request err -----');
					console.log(err);
				}
		});
	}
};



/*
this.get = function(req,data,callback,content_type,key,cert){
		var self = this;
		var uri= url.parse(req.url);
     	sys.log((req.method + " " + req.url));
     	var option={	
					'host':uri.hostname,
                  	'port':Number(uri.port||'80'),
                  	'path':uri['pathname']+(uri['search']||""),
                  	'method':req.method,
                  	'headers':req.headers
                  };
        var client = http;
        option.agent = false;
        if(req.url.indexOf('https') == 0){
        	client = https;
        	option['port'] = Number(uri.port||'443');
        	//option['key'] = key;
        	//option['rejectUnauthorized']=true;
        	//option['cert'] = cert;
        	//option['ca'] = fs.readFileSync(__dirname + '/../tests/rootca.pem');
        	//option['agent'] = new https.Agent(option);
        	option['pfx'] = fs.readFileSync(__dirname + '/../tests/apiclient_cert.p12');
        	option['passphrase'] = '1233621502';
        };
		if(content_type != undefined ){
			option.headers["Content-Type"] = content_type;//'application/json;charset=utf-8';
			//option.headers["Content-Length"] = data.length;
		}else{
			//option.headers["Content-Type"] = 'application/json;charset=utf-8';
		}
	    var rq = client.request(option,function(res){
	    	var result = "";
	    	res.on('data',function(chunk){
    			result += chunk;
	    	});

	    	res.on('error',function(e){
	    		sys.log(("http Response: " + req.url + " " + e));
	    		callback(e,null);
	    	});
	    	res.on('end',function(){
	    		callback(null,result);
	    	});

	    	res.socket.on('error',function(e){
	    		sys.log(("http Socket:" + e).yellow);
	    		callback(e,null);
	    	});
	    }).on('error',function(e){
	    	sys.log(("http proxy:" + e));
	    	callback(e,null);
	    });
		if(data != null && data != undefined){
			rq.write(data);
		}
		rq.end();
	}
*/