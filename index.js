var color = require('colors'),
    INDENT = require('./util').INDENT,
    link = require('./link').link,
    request = require('request'),
    fs = require('fs'),
    net = require('net'),
    http = require('http'),
    https = require('https'), 
    formidable = require('formidable'),
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
                        result[m['name']] = m;
                    } catch (e) {
                        console.log('======= ERROR ========'.red);
                        console.log('Name:' + name.red);
                        console.log(e.toString().red);
                    }
                }
            }
        });
        return result;
    }
}

/* api config factory */
var __factory = function(opt){
	if(__apis == null){
		__apis = package.load(opt.PACKAGE_HOME);
		//console.log(JSON.stringify(apis, null, 4));
	};
	return __apis;
};


var __fn = function(opt) {
    var content = '';
    var APIS = __factory(opt);
    var block = "";
    var libs = "__init([\n";
    for (var name in APIS) {
        var o = APIS[name];
        var depend = o['endpoint']['response']['depend'];
        if(depend){
            depend.forEach( function(d) {
                libs += INDENT(1,'"' + d['url'] + '",\n');
            });
        };
        var glue = [];
        glue.push(INDENT(1, '/************************************************************'));
        glue.push(INDENT(1, ' * name:' + o['name']));
        glue.push(INDENT(1, ' * ver:' + o['version']));
        glue.push(INDENT(1, ' * description:' + o['desc']));
        glue.push(INDENT(1, ' ***********************************************************/'));

        /** glue **/
        var args = [];
        var endpoint = o['endpoint'];
        for (var arg in endpoint['param']) {
            if(!endpoint['param'][arg]['ref'])
                args.push(arg);
        };
        glue.push(INDENT(1, 'window.mkit.prototype["' + o['name'] + '"] = function(' + args.join(',') + '){'));
        glue.push(INDENT(2, 'var defer = $.Deferred();'));
        glue.push(INDENT(2, 'this.__ajax.get("' + '/endpoint/' + name + '",'));
        glue.push(INDENT(2, '{'));
        args.forEach(function(a) {
            glue.push(INDENT(3, '"' + a + '":' + a));
        });
        glue.push(INDENT(2, '},function(err,data){'));
        /* result handler */
        glue.push(INDENT(3, 'if(err){'));
        glue.push(INDENT(4, 'console.log(err);'));
        glue.push(INDENT(4, 'defer.reject(err);'));
        glue.push(INDENT(3, '}else{'));
        /* handler */
        //glue.push(INDENT(3, '__foo_handler(JSON.parse(result));'));
        var path = o['path'] + '/' + endpoint['response']['handler'];
        /* inject response handler script */
        var tmp = fs.readFileSync(path, { encoding: 'utf8' });
        glue.push(link(4,tmp));
        glue.push(INDENT(3, '};'));
        glue.push(INDENT(2, '});'));
        glue.push(INDENT(2, 'return defer.promise();'));
        glue.push(INDENT(1, '}'));
        var str = glue.join("\n");
        block += str;
    };
    libs += '],function(){\n';
    content += libs;
    content += block + '\n});';
    return content;
};



/* make a http request */
var __send_req = function(req,data,callback,key,cert){
    var self = this;
    var q = {
             'url': req['url'],
             'method':req.method,
             'header':{ }
            };
    if(data && req['method'].toLowerCase() == 'post'){
        q['header']['Content-type'] = 'application/x-www-form-urlencoded';
        q['form'] = data;
    };
    if(req['header']){
        for(var key in req['header']){
            q['header'][key] = req['header'][key];
        }
    };
    if(key != '' && cert != ''){
        q['agentOptions']= {'key': key,'cert': cert,}
    };
    request(q,function(err, response, body){
            if(!err && response){
                console.log(req.url + ' ' + response['statusCode']);
                if(!err && response && response['statusCode'] == 200){
                    callback(null,response['statusCode'],body);
                }else{
                    //console.log('======= http response ========');
                    //console.log('error:'+err);
                    //console.log(response);
                    //console.log(body);
                    callback(null,response['statusCode'],null);
                }
            }else{
                console.log('----- request err -----');
                console.log(err);
                callback(err,505,null);
            }
    });
};


/* 解析form*/
var __form = function(req,resp,func){
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.on('progress', function(bytesReceived, bytesExpected) {
        
    });
    form.on('end', function(){
       
    });
    form.onPart = function(part){
        if(!part.filename){
            form.handlePart(part);
            return;
        }
        part.on("data",function(buffer){
            if(!form._files) form._files = {};
            if(!form._files[part.filename]) {
                form._files[part.filename] = buffer;
            }else{
                form._files[part.filename] = Buffer.concat([form._files[part.filename],buffer]);
            }
        });
        part.on("end",function(){
            form.emit('file', part.name, { partname:part.name, name: uid(req) + "_" + Date.now()+"."+part.filename.split(".").pop(), 
                                           data: form._files[part.filename]});
        });
    };
    form.parse(req,function(err,fileds,files){
        if(err !== null){
           sys.log(("pare form error:" + err).red);
           return;
        }else{
            func(fileds,files);
        }
    });
};



/* proxy http request */
var __proxy = function(endpoint,req,resp,context,opt,callback){
    var config = {};
    for(var key in endpoint['endpoint']['param']){
        var arg = endpoint['endpoint']['param'][key];
        if(arg['ref']){
            config[key] = arg['ref']
        }
    };
    opt.get_conf(config,context,function(err,result){
        var method = req['method'];
        var data = {};
        for(var name in result){
            data[name] = result[name];
        };
        if(method.toLowerCase() == 'get'){
            for(var name in req['query']){
                data[name] = req['query'][name];
            };
            var url = endpoint['endpoint']['url'];
            var tmp = [];
            for(var key in data){
                tmp.push(key +'=' + data[key]);
            };
            if(tmp.length > 0)
                url += '?' + tmp.join('&');
            __send_req({
                method: method,
                url: url
            },data,callback);
        }else if(method.toLowerCase() == 'post'){
            __form(req,resp,function(fileds,files){
                __send_req({
                    method: method,
                    url: endpoint['endpoint']['url']
                },data,callback);
            });
        };
    });
};




exports.guard = function(opt){
    /*********************************
     *
     *********************************/
    this.proxy = function(req,resp,next){
        if(req['url'] == '/api.js'){
             fs.readFile(__dirname + '/lib/api.js', {encoding:'utf8'}, function(err,content){
                 resp.writeHead(200, {
                             'Content-Type': 'application/javascript',
                             'Access-Control-Allow-Origin':'*',
                             'Access-Control-Allow-Credentials':true});
                return resp.end(content); 
             });
        }else if(req['url'] == '/fn.js'){
            var content = __fn(opt);
            resp.writeHead(200, {
                             'Content-Type': 'application/javascript',
                             'Access-Control-Allow-Origin':'*',
                             'Access-Control-Allow-Credentials':true});
            return resp.end(content); 
        }else{
            var matches = req['url'].match(/^\/(\w+)\/endpoint\/(\w+)[^\/]*$/);
            if(matches){
                var appid = matches[1];
                var name = matches[2];
                var MAP = __factory();
                if(MAP[name]){
                    var context = {
                        appid:appid
                    };
                    __proxy(MAP[name],req,resp,context,opt,function(err,code,body){
                        resp.writeHead(code, {
                         'Content-Type': 'application/javascript',
                         'Access-Control-Allow-Origin':'*',
                         'Access-Control-Allow-Credentials':true});
                        return resp.end(body); 
                    });
                }else{
                    console.log(('endpoint undefined:' + name).red);
                    resp.writeHead(404, {
                         'Content-Type': 'application/javascript',
                         'Access-Control-Allow-Origin':'*',
                         'Access-Control-Allow-Credentials':true});
                    return resp.end(JSON.stringify({
                        err:'endpoint not found'
                    })); 
                }
            }else{
                next();
            }
        };
    }
};