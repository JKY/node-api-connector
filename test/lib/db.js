var sys = require('sys'),
	format = require('util').format,
    settings = require('../settings').settings;
   
var mongodb = require("mongodb");
var mongoinstance = null;
var funcq = [];

mongodb.MongoClient.connect(format("mongodb://%s:%s/%s", 
							settings.mongo.host,
							settings.mongo.port,
							settings.mongo.dbname), function(err, db) {
	if(err !== null){
         console.log(("database err:" + err));
     }else{
		 mongoinstance = db;	
		 funcq.forEach(function(func){
			func(null,db);
		 })
		 funcq.length = 0;
		 sys.log(("database connected to:" + settings.mongo.host));          
	 }
})

var mongo = exports.mongo = { 
    do:function (callback){
		if(mongoinstance!==null){
	        callback(null,mongoinstance);
		}else{
			sys.log("func is pushed to q, db is not ready");
			funcq.push(callback);
		}
    }
}
