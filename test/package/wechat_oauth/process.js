/* process request results */
var handler = function(scope) {
    if(!scope)
        scope = 'snsapi_userinfo';
    var defer = $.Deferred();
    var param = this.__url.param();
    if(param['openid']){
        setTimeout(function(){
            defer.resolve(param);
        }, 500);
    }else{
        var tmp = window.location.href.replace('http://','');
        tmp = tmp.replace('https://','');
        this.__ajax.get("/endpoint/wechat_oauth", {
            "scope": scope,
            "callback": tmp,
        }, function(err, data) {
            if (err) {
                console.log(err);
                defer.reject(err);
            } else {
                if (data.result.type == 'redirect') {
                    window.location.href = data.result.url;
                }else{
                    defer.reject(data.err);
                }
            };
        });
    };
    return defer.promise();
}
