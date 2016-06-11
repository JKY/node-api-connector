node-api-connector
=====

usage
=====

	var g = new guard({
		PACKAGE_HOME: __dirname + '/package',
		/* 获取配置 */
		get_conf:function(config,context,callback){
			config['appid'] = 'wx50d746e9d0f0af1d';
			callback(null,config);
		}
	});
	app.use(g.proxy);
