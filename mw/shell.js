var api_factory = require('./common').api_factory,
    out = require('./common').out,
    fs = require('fs');

module.exports = function(router, req, resp, next, opt) {
    /* 前端 SHELL */
    fs.readFile(__dirname + '/../lib/mkit.js', { encoding: 'utf8' }, function(err, content) {
        out(resp, 200, content);
    });
};
