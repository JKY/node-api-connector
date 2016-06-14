/* process request results */
var handler = function(api) {
    var defer = $.Deferred();
    this.__ajax.get("/endpoint/wx_conf", {
        "u": window.location.href,
        "api_list": api,
    }, function(err, data) {
        var result = data['result'];
        var opt = {
            debug: true,
            appId: result.appid,
            timestamp: result.timestamp,
            nonceStr: result.noncestr,
            signature: result.signature,
            jsApiList: api
        };
        wx.ready(function() { console.log("wx config ready");
            defer.resolve(result); 
        });
        wx.error(function(res) {
            console.log("wx config err:" + res['errMsg']);
            defer.reject(res);
        });
        wx.config(opt);
    });
    return defer.promise();
}
