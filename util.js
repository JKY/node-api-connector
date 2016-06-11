var opt = {
    INDENT: '   ',
    pretty: true,
};

var INDENT = exports.INDENT = function(n, line) {
     var c = opt.INDENT;
     if (opt.pretty) {
        for (var i = 0; i < n; i++) {
            line = c + line;
        };
        return line;
    } else {
        return line.replace('\S', '');
    }
};
