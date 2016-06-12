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
		common_conf:function(appid, config,callback){
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



endpoints 
===

- #### 前端页面的 js 库 ####

	endpoint: /api.js  
	method: GET  
	验证: none  
	参数:   
	   none
	说明:   
		前端 js 类库  
	测试:   
		http://localhost:8000/api.js  




- #### 前端 js库加载的函数库 ####

	endpoint: /{appid}/fn.js  
	method: GET  
	验证: none  
	参数:   
		appid: appid, 必填  
	说明:   
		前端 api.js 加载完成之后会加载此文件, 在添 mkit 中添加指定app的前端接口  
	测试:  
		http://localhost:8000/foo/fn.js  




- #### 前端页面函数库掉用的接口地址 ####

	endpoint: /{appid}/endpoint/{wechat_conf}  
	method: GET  
	验证: none  
	参数: 
		appid: appid, 必填  
	说明:  
		不同 API 接口被前端调用的中间地址, 服务器根据此地址转发到真正的  
		地址 (manifest.json 文件中)上  
	测试:  
		http://localhost:8000/foo/endpoint/wechat_conf  




- #### 获取所有已公开的API列表 #### 

	endpoint: /api/list  
	验证: none  
	参数:   
		none  
	说明:   
		获取所有已公开的API列表  
	测试:  
		http://localhost:8000/api/list 		




- ####  获取某个 API 详情  ####

	endpoint:  /api/{apiname}  
	验证: 
		none  
	参数:  
		apiname: api name, 必填  
	说明:  
		获取某个API详情, 包括标题, 描述, 及配置信息等, 但不包含 doc  
	测试:  
		http://localhost:8000/api/wechat_conf  



- #### 获取某个 API markdown doc ####

	endpoint:  /api/{apiname}/doc  
	验证: none  
	参数:   
		apiname: api name, 必填  
	说明:   
		获取某个 API markdown content  
	测试:   
		http://localhost:8000/api/wechat_conf/doc  
