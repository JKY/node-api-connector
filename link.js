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
	Program: function(indent,node){
		var result = '';
		node['body'].forEach( function(item) {
			if(!T[item['type']]){
				console.log(('ERROR:' + item['type'] + ' not defined').red);
				return;
			};
			result += T[item['type']](indent+1,item);
		});
		return result;
	},
	

	Literal: function(indent,node){
		return node['raw'];
	},


	Identifier: function(ident,node){
		return node['name'];
	},

	VariableDeclaration: function(indent,node){
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
	  								 T[init['type']](indent,init) + ';'
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

	FunctionDeclaration : function(indent,node){
		var tmp = [];
		var id = node['id']['name'];
		var params = [];
		node['params'].forEach( function(p, index) {
			params.push(T[p['type']](0,p));
		});
		tmp.push(INDENT(indent,'function ' + id + '(' + params.join(',') +'){'));
		node['body']['body'].forEach( function(b) {
			 tmp.push(T[b['type']](indent+1,b));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},


	ArrayExpression: function(indent,node){
		var tmp = [];
		node['elements'].forEach( function(el) {
			var type = el['type'];
			if(!T[type]){
				console.log('UNKNOWN TYPE IN ArrayExpression:' + type.red);
				return;
			};
			tmp.push(INDENT(indent+1,T[type](indent+1,el)));
		});
		return '[\n' + tmp.join(',\n') + '\n' + INDENT(indent,']');
	},


	BinaryExpression: function(indent,node){
		var left = node['left'];
		var right = node['right'];
		return T[left['type']](0,left) + ' ' + node['operator'] + ' ' + T[right['type']](0,right);
	},



	LogicalExpression: function(indent,node){
		var left = node['left'];
		var right = node['right'];
		var op = node['operator'];
		var a = T[left['type']](indent,left);
		var b = T[right['type']](indent,right);
		return a + ' ' + op + ' ' + b;
	},



	AssignmentExpression: function(indent,node){
		var left = node['left'];
		var right = node['right'];
		var op = node['operator'];
		return left['name']  + op  + T[right['type']](indent,right) + ';';
	},



	ObjectExpression: function(indent,node){
		var tmp = [];
		tmp.push(INDENT(0,"{"));
		node['properties'].forEach( function(el) {
			var name = el['key']['name'];
			var value = T[el['value']['type']](indent+1,el['value']);
			tmp.push(INDENT(indent+1,name + ':' + value + ','))
		});
		tmp.push(INDENT(indent,"}"));
		return tmp.join('\n');
	},


	MemberExpression: function(indent,node){
		var __object = function(s,o){
			if(o['type'] == 'Identifier'){
				s.push(o['name']);
				return s;
			}else{
				if(o['type'] == 'MemberExpression'){
					__object(s,o['object']);
					s.push(o['property']['name'] || o['property']['value']);
					return s;
				}
			}
		};
		return __object([],node).join('.');
	},


	CallExpression: function(indent,node){
		var callee = node['callee'];
		var line = T['MemberExpression'](0,callee);
		var tmp = [];
		node['arguments'].forEach( function(a) {
			tmp.push(T[a['type']](indent,a));
		});
		line += '(' + tmp.join(', ') + ');';
		return INDENT(indent,line);
	},


	
	UpdateExpression: function(indent,node){
		var argument = node['argument'];
		var tmp = T[argument['type']](indent,argument);
		return tmp + node['operator'];
	},


	
	FunctionExpression: function(indent,node){
		var params = [];
		var blocks = [];
		node['params'].forEach( function(p) {
			params.push(p['name']);
		});
		node['body']['body'].forEach( function(b) {
			 blocks.push(INDENT(indent+1,T[b['type']](0,b)));
		});
		var tmp = [];
		tmp.push('function(' + params.join(',') +'){');
		tmp.push(blocks.join('\n'));
		tmp.push(INDENT(indent,'}'));
		return tmp.join('\n'); 
	},



	ExpressionStatement: function(indent,node){
		var exp = node['expression'];
		var type = exp['type'];
		var result = T[type](indent,exp);
		return result;
	},


	IfStatement: function(indent,node){
		var tmp = [];
		var test = node['test'];
		var ts = T[test['type']](indent+1,test);
		tmp.push(INDENT(indent,'if( ' + ts + ' ){'));
		var consequent = node['consequent']['body'];
		consequent.forEach( function(c) {
			tmp.push(T[c['type']](indent,c));
		});
		var alternate = node['alternate'];
		if(alternate){
			tmp.push(INDENT(indent,'}else{'));
			alternate['body'].forEach( function(a) {
				tmp.push(T[a['type']](indent+1,a));
			});
		}
		tmp.push(INDENT(indent,'}'));
		return tmp.join('\n');
	},


	SwitchStatement: function(indent,node){
		var tmp = [];
		var discriminant = node['discriminant'];
		console.log(discriminant['type']);
		var disc = T[discriminant['type']](indent,discriminant);
		tmp.push(INDENT(indent,'switch(' + disc + '){'));
		var cases = node['cases'];
		cases.forEach( function(c) {
			var test = c['test'];
			if(test){
				var t = T[test['type']](indent+1,test);
				tmp.push(INDENT(indent+1,'case ' + t + ':'));
			}else{
				tmp.push(INDENT(indent+1,'default:'));
			};
			var consequent = c['consequent'];
			consequent.forEach( function(c) {
				tmp.push(T[c['type']](indent+2,c));
			});
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join("\n");
	},


	BreakStatement: function(indent,node){
		return INDENT(indent,'break;');
	},



	ForStatement: function(indent,node){
		var tmp = [];
		var init = node['init'];
		var test = node['test'];
		var update = node['update'];
		var i = T[init['type']](0,init);
		var t = T[test['type']](indent,test);
		if(update)
			var u = T[update['type']](indent,update);
		else 
			var u ='';
		tmp.push(INDENT(indent,'for(' + i  + ' ' + t + '; ' + u + '){'));
		node['body']['body'].forEach( function(b, index) {
			tmp.push(T[b['type']](indent+1,b));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},


	WhileStatement: function(indent,node){
		var tmp = [];
		var test = node['test'];
		var t = T[test['type']](indent+1,test);
		tmp.push(INDENT(indent,'while(' + t + '){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent+1,b));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},



	ForInStatement: function(indent,node){
		var tmp = [];
		var left = node['left'];
		var right = node['right'];
		var a = T[left['type']](0,left);
		var b = T[right['type']](0,right);
		tmp.push(INDENT(indent,'for(' + a + ' in ' + b + '){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent+1,b));
		});
		tmp.push(INDENT(indent,'};'));
		return tmp.join('\n');
	},

	
	WithStatement: function(indent,node){
		var tmp = [];
		var object = node['object'];
		var o = T[object['type']](0,object);
		tmp.push(INDENT(indent,'with(' + o +'){'));
		node['body']['body'].forEach( function(b) {
			tmp.push(T[b['type']](indent,b));
		});
		tmp.push(INDENT(indent,'}'));
		return tmp.join('\n');
	}
};



var link = exports.link = function(indent,str){
	var tree = esprima.parse(str);
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
	//console.log(JSON.stringify(tree, null, 2));
	//console.log('==========')
	//console.log(result);
	return result;
};


/* test */
/*
var str = fs.readFileSync(__dirname + '/test/package/foo/process.js', {encoding:'utf8'});
var content = link(0,str);
console.log(content.yellow);
*/