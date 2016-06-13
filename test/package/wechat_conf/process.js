/* process request results */
var handler = function(data,defer){
    alert('success');
	var result = data['result'];
    var opt = {debug: false,
        appId: result.appid,
        timestamp:result.timestamp, 
        nonceStr: result.noncestr, 
        signature: result.signature,
        jsApiList:['onMenuShareTimeline','onMenuShareAppMessage'] 
    };wx.ready(function(){console.log("wx config ready");defer.resolve(result);});wx.error(function(res){  
    	console.log("wx config err:" + res['errMsg']);
    	defer.reject(res);
    });
    wx.config(opt);
}