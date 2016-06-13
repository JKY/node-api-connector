/* process request results */
var handler = function(amount,openid,desc) {
    var defer = $.Deferred();
    this.__ajax.get("/endpoint/wechat_pay", {
        "amount": amount,
        "openid": openid,
        "desc": desc,
    }, function(err, data) {
        if (err) {
            console.log(err);
            defer.reject(err);
        } else {
            if (data['err'] == null) {
                var result = data['result'];
                var orderid = result['orderId'];
                wx.chooseWXPay({
                    'timestamp': result['timeStamp'],
                    'nonceStr': result['nonceStr'],
                    'package': result['package'],
                    'signType': result['signType'],
                    'paySign': result['paySign'],
                    success: function(res) {
                        defer.resolve(res)
                    },
                    fail: function(res) {
                        defer.resolve(res)
                    },
                    cancel: function(res) {
                        defer.resolve(res)
                    }
                });
            } else {
                alert(data['err']);
            }
        };
    });
    return defer.promise();
}
