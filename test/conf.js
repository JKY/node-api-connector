module.exports.conf =  {
	appname: 'marketing kits',
	domain:'http://localhost:8000',
	debug:false,
	port: 8000,
	mongo : {
		host:"localhost",
		port: 27017,
		dbname: "mkits",
		serveropt: {
			'auto_reconnect':true,
			 poolSize:5
		},

		dbopt : {
			w:-1
		}
	}
}