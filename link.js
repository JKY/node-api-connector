/**
 * 解析 JS 脚本
 */
var color = require('colors'),
	fs = require('fs'),
	INDENT = require('./util').INDENT,
	esprima = require('esprima');


/****************************************
 * node 解析, 根据 js 语法树生成新的 js 代码 
 ****************************************/
var T = {
	Program: function(indent,node,parent){
		var result = '';
		node['body'].forEach( function(item) {
			if(!T[item['type']]){
				console.log(('ERROR:' + item['type'] + ' not defined').red);
				return;
			};
			result += T[item['type']](indent+1,item,node);
		});
		return result;
	},
	

	Literal: function(indent,node,parent){
		return node['raw'];
	},


	Identifier: function(ident,node,parent){
		return node['name'];
	},

	VariableDeclaration: function(indent,node,parent){
		var result = '';
		node['declarations'].forEach( function(item) {
			if(item['type'] == 'VariableDeclarator'){
				var init = item['init'];
				if(init){
					if(!T[init['type']]){
						console.log(('ERROR: init type:' + init['type'] + ' not defined').red);
						return;
					};
					result = INDENT(indent,
	  								 'var ' + item['id']['name'] +
	  								 ' = ' + 
	  								 T[init['type']](indent,init,node) + ';'
	  							   );
				}else{
					result = INDENT(indent,
	  								 'var ' + item['id']['name']);
				}
			}else{
				console.log('UNKNOWN TYPE IN VariableDeclarator:' + item['type'].red);
			}
		});
		return result;
	},

	FunctionDeclaration : function(indent,node,parent){
		var tmp = [];
		var id = node['id']['name'];
		var params = [];
		node['params'].forEach( function(p, index) {
			params.push(T[p['type']](indent+1,p,node));
		});
		tmp.push('function ' + id + '(' + params.join(',') +'){');
		node['body']['body'].forEach( function(b) {
			 tmp.push(T[b['type']](indent+2,b,node));
		});
		tmp.push(INDENT(indent+1,'};'));
		return tmp.join('\n');
	},


	ArrayExpression: function(indent,node,parent){
		var tmp = [];
		node['elements'].forEach( function(el) {
			var type = el['type'];
			if(!T[type]){
				console.log('UNKNOWN TYPE IN ArrayExpression:' + type.red);
				return;
			};
			tmp.push(INDENT(indent+1,T[type](indent+1,el,node)));
		});
		return '[\n' + tmp.join(',\n') + '\n' + INDENT(indent,']');
	},


	BinaryExpression: function(indent,node,parent){
		var left = node['left'];
		var right = node['right'];
		return T[left['type']](0,left,node) + ' ' + node['operator'] + ' ' + T[right['type']](0,right,node);
	},



	LogicalExpression: function(indent,node,parent){
		var left = node['left'];
		var right = node['right'];
		var op = node['operator'];
		var a = T[left['type']](indent,left,node);
		var b = T[right['type']](indent,right,node);
		return a + ' ' + op + ' ' + b;
	},



	AssignmentExpression: function(indent,node,parent){
		var left = node['left'];
		var right = node['right'];
		var op = node['operator'];
		return INDENT(indent+1, T[left['type']](indent,left,node) + op  + T[right['type']](indent,right,node));
	},



	ObjectExpression: function(indent,node,parent){
		var tmp = [];
		node['properties'].forEach( function(el) {
			var name = el['key']['name'] || el['key']['raw'];
			var value = T[el['value']['type']](indent,el['value'],node);
			tmp.push(INDENT(indent+1, name + ':' + value ))
		});
		return INDENT(0,"{") + '\n' + tmp.join(',\n')  + '\n' + INDENT(indent,"}");
	},


	MemberExpression: function(indent,node,parent){
		var __object = function(s,o){
			if(o['type'] == 'Identifier'){
				s.push(o['name']);
				return s;
			}else{
				if(o['type'] == 'MemberExpression'){
					__object(s,o['object']);
					s.push(o['property']['name'] || o['property']['value']);
					return s;
				}else if(o['type'] == 'ThisExpression'){
					s.push('this');
					return s;
				}
			}
		};
		var tmp = __object([],node);
		return tmp.join('.');
	},


	CallExpression: function(indent,node,parent){
		var i = indent;
		if(parent['type'] != 'ExpressionStatement'){
			i = 0;
		};
		var callee = node['callee'];
		var line = INDENT(i,T['MemberExpression'](indent,callee));
		var tmp = [];
		node['arguments'].forEach( function(a) {
			tmp.push(INDENT(0,T[a['type']](indent+1,a,node)));
		});
		line += '(' + tmp.join(',') + ');';
		return line;
	},


	
	UpdateExpression: function(indent,node,parent){
		var argument = node['argument'];
		var tmp = T[argument['type']](indent,argument.node);
		return tmp + node['operator'];
	},


	
	FunctionExpression: function(indent,node,parent){
		var params = [];
		var blocks = [];
		node['params'].forEach( function(p) {
			params.push(p['name']);
		});
		node['body']['body'].forEach( function(b) {
			 blocks.push(T[b['type']](indent+1,b,node));
		});
		var tmp = [];
		tmp.push(INDENT(0,'function(' + params.join(',') +'){'));
		tmp.push(blocks.join('\n'));
		tmp.push(INDENT(indent,'}'));
		return tmp.join('\n'); 
	},



	ExpressionStatement: function(indent,node,parent){
		var exp = node['expression'];
		var type = exp['type'];
		var result = T[type](indent,exp,node);
		return result;
	},


	IfStatement: function(indent,node,parent){
		var tmp = [];
		var test = node['test'];
		var ts = T[test['type']](indent,test,node);
		tmp.push(INDENT(indent,'if( ' + ts + ' ){'));
		var consequent = node['consequent'];
		var str = T[consequent['type']](indent+1,consequent,node);
		if(str.length > 0)
			tmp.push(str);
		var alternate = node['alternate'];
		if(alternate){
			tmp.push(INDENT(indent,'}else{'));
			var astr = T[alternate['type']](indent+1,alternate,node);
			if(astr.length > 0){
				tmp.push(astr);
			}
		}
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},

	BlockStatement: function(indent,node,parent){
		var tmp = [];
		node['body'].forEach( function(a) {
			tmp.push(T[a['type']](indent+1,a,node));
		});
		if(tmp.length > 0)
			return tmp.join('\n');
		else
			return '';
	},


	UnaryExpression: function(indent,node,parent){
		var arg = node['argument'];
		return node['operator'] + T[arg['type']](indent+1,arg,node);
	},


	SwitchStatement: function(indent,node,parent){
		var tmp = [];
		var discriminant = node['discriminant'];
		console.log(discriminant['type']);
		var disc = T[discriminant['type']](indent,discriminant,node);
		tmp.push(INDENT(indent,'switch(' + disc + '){'));
		var cases = node['cases'];
		cases.forEach( function(c) {
			var test = c['test'];
			if(test){
				var t = T[test['type']](indent+1,test,node);
				tmp.push(INDENT(indent+1,'case ' + t + ':'));
			}else{
				tmp.push(INDENT(indent+1,'default:'));
			};
			var consequent = c['consequent'];
			consequent.forEach( function(c) {
				tmp.push(T[c['type']](indent+2,c,node));
			});
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join("\n");
	},


	BreakStatement: function(indent,node,parent){
		return INDENT(indent,'break;');
	},



	ForStatement: function(indent,node,parent){
		var tmp = [];
		var init = node['init'];
		var test = node['test'];
		var update = node['update'];
		var i = T[init['type']](0,init,node);
		var t = T[test['type']](indent,test,node);
		if(update)
			var u = T[update['type']](indent,update,node);
		else 
			var u ='';
		tmp.push(INDENT(indent,'for(' + i  + ' ' + t + '; ' + u + '){'));
		node['body']['body'].forEach( function(b, index) {
			tmp.push(T[b['type']](indent+1,b,node));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},


	WhileStatement: function(indent,node,parent){
		var tmp = [];
		var test = node['test'];
		var t = T[test['type']](indent+1,test,node);
		tmp.push(INDENT(indent,'while(' + t + '){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent+1,b,node));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},



	ForInStatement: function(indent,node,parent){
		var tmp = [];
		var left = node['left'];
		var right = node['right'];
		var a = T[left['type']](0,left,node);
		var b = T[right['type']](0,right,node);
		tmp.push(INDENT(indent,'for(' + a + ' in ' + b + '){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent+1,b,node));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},

	
	WithStatement: function(indent,node,parent){
		var tmp = [];
		var object = node['object'];
		var o = T[object['type']](0,object,node);
		tmp.push(INDENT(indent,'with(' + o +'){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent,b,node));
		});
		tmp.push(INDENT(indent,'}'));
		return tmp.join('\n');
	},

	ReturnStatement: function(indent,node,parent){
		var tmp = '';
		if(node['argument']){
			var o = node['argument'];
			tmp = T[o['type']](0,o,node);
		};
		return INDENT(indent,"return " + tmp);
	},

	EmptyStatement: function(indent,node,parent){
		return INDENT(indent,"");
	},

	ThisExpression: function(indent,node,parent){
		return INDENT(indent+1,"this");
	}
};



var link = exports.link = function(indent,str){
	var tree = esprima.parse(str);
	//console.log(JSON.stringify(tree, null, 2));
	var result = '/* NO implements */'
	tree['body'].forEach( function(b) {
		if(b['type'] == 'VariableDeclaration'){
			b['declarations'].forEach( function(d) {
				if(d['type'] == 'VariableDeclarator' && 
				   		d['id']['name'] == 'handler' &&
				   			d['init']['type'] == 'FunctionExpression'
				){
					var tmp = [];
					var node = d['init'];
					var params = [];
					node['params'].forEach( function(p) {
						 params.push(p['name']);
					});
					node['body']['body'].forEach( function(b) {
						 tmp.push(T[b['type']](indent,b));
					});
					result = tmp.join('\n'); 
				}
			});
		}
	});
	//console.log('==========')
	//console.log(result);
	return result;
};


/* test */
/*
var str = fs.readFileSync(__dirname + '/test/package/wechat_oauth/process.js', {encoding:'utf8'});
var content = link(0,str);
console.log(content.yellow);
*/




