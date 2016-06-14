var api_factory = require('./common').api_factory,
    out =  require('./common').out;

module.exports = function(router,req,resp, next, opt){
    var APIS = api_factory(opt);
    var result = [];
    for (var key in APIS) {
        var a = APIS[key];
        result.push({
            name: a['name'],
            title: a['title'],
            version: a['version'],
            desc: a['desc'],
            icon: a['icon'],
            author: a['author'],
            homepage: a['homepage'],
            title: a['title'],
            cost: a['cost']
        })
    };
    out(resp, 200, JSON.stringify(result, null, 4));
};
