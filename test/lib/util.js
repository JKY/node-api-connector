var sys = require('sys'),
    fs = require('fs'),
    formidable = require('formidable');

var get_client_ip = exports.get_client_ip = function(req) { 
     var _ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
     return _ip;
};

var getQueryString = exports.getQueryString = function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return "1234";
};

var SEED = "0123456789";
var random = exports.random = function(n) {
      var result = "";
      while(n-- > 0) {
          result += SEED.substr(Math.floor(Math.random() * 10),1);
      }
      return result;
};
/* bind */
var __authorize_uri = {};
var __bind__ = exports.bind = function(path,object,hook,context,authfunc){
  for(var o in object){
      if(typeof(object[o]) == "function"){
          var uri = path+"/"+o;
          if(authfunc != null){
              __authorize_uri[uri] = authfunc;
          };
          if(context != null){
              sys.log(("endpoint:" + uri.green));
              hook.apply(context,[uri,object[o]]);
          }else{
              hook(uri, object[o]);
          }
      }else{
          __bind__(path + "/" + o, object[o], hook,context, authfunc);
      }
  }
};

var authorize = exports.authrize = function(req,callback){
    if(__authorize_uri[req.url] == undefined){
       callback(null,true);
    }else{
       var func = __authorize_uri[req.url];
       if(func == undefined){
           callback(null,false);
       }else{
           func(req,callback);
       }
    }
};


exports.out = {
  err:function(resp,code,data){
        resp.writeHead(code, {'Content-Type': 'application/json'});
          if(data){
            resp.end(JSON.stringify(data));           
          }else{
              resp.end(); 
          }
  },
  json:function(resp,code,data){
      resp.writeHead(code, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin':'*',
                                'Access-Control-Allow-Methods':'get,post,put,delete,option'});
      var str = JSON.stringify(data);
        //sys.log("return:" + str);
      resp.end(str);  
      return true;          
  },
  redirect: function(resp,url){
      resp.writeHead(302, {'Location': url});
      resp.end();      
  },
  
  text:function(resp,data){
    resp.writeHead(200, {'Content-Type': 'text/plain',
                         'Access-Control-Allow-Origin':'*',
                         'Access-Control-Allow-Credentials':true});
    resp.end(data);  
    return true;                
  }
};


// 验证
exports.validate = {
  is: function(format,str){
    var TAB = {
      'email': /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
      'mobile': /^0?(13[0-9]|15[012356789]|18[0236789]|14[57])[0-9]{8}$/,
      'number':/^\d+(\.?)(\d+)?$/
    }
    if(format == 'string'){
        return str != null && str != undefined && str.length > 0;
    }else{
      var re = TAB[format];
      if(re != undefined){
        return re.test(str);
      }else{
        throw new Error("not support format:" + format);
      }
    }
  }
}


var file = exports.file = {
    /* 遍历文件夹 */
    walk: function(path, callback) {
        callback(path);
        var files = fs.readdirSync(path);
        files.forEach(function(item) {
            var tmp = path + '/' + item;
            var stats = fs.statSync(tmp);
            if (stats.isDirectory()) {
                file.walk(tmp, callback);
            } else {
                callback(tmp, floor);
            }
        });
    }
}
