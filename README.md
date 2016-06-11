node-api-connector
=====

usage
===

1. 安装
	
		npm install node-api-connector
	
2. 添加到 express 
		
		var opt = {
			PACKAGE_HOME: __dirname + '/package',
			/* api 配置 */
			api: {
				use: function(appid,callback){
					callback(null,{
						'wechat_conf': {}
				});
			}
		},
		/* 获取配置 */
		get_conf:function(config,context,callback){
			config['appid'] = 'wx50d746e9d0f0af1d';
			callback(null,config);
		}};
		
		var g = new guard(opt);
		app.use(g.proxy);
		
		
   opt 说明:
     * PACKAGE_HOME: 
     		放置 package 的根目录;
     * api.use: 
     		根据 appid 获取 enabled 的 api 
     * get_conf: 
            获取通用设置
	


