//Import modules
var config = require('./private/config.js');
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');

//Setup SQL Server connection
var pool = mysql.createPool({
	host		: config.dbAddress,
	user		: config.dbUser,
	password	: config.dbPassword,
	database	:  config.dbName
});

//Export SQL Queries For Users
module.exports.users = {
	//Inserts a new record into the users table
	insertNew: function(userName, userPassword, userRole, userEmail, cb) {
		if(userName === null || userPassword === null || userRole === null || userEmail === null)
        	{
            		return cb('username, password, role, and email cannot be null');
        	}

		bcrypt.genSalt(config.hashStrength, function(err, salt) {
			if(err){return cb(err);}

			bcrypt.hash(userPassword, salt, null, function(err, hash) {
				if(err){return cb(err);}

				pool.getConnection(function(err, connection) {
					if(err){return cb(err);}

					connection.query('INSERT INTO users (userName, userEmail, userSalt, userPass, userRole) VALUES (?, ?, ?, ?, ?)', [userName, userEmail, salt, hash, userRole], function (err, results, fields) {
						connection.release();
						if(err){return cb(err);}
						return cb(null);
					}); 
				});
			});
		});
	},

	//Returns all username in database
	returnAllNames: function(cb) {
		pool.getConnection(function(err, connection) {
			if(err){return cb(err);}

			connection.query('SELECT userName from users', function(error, results, fields) {
				connection.release();
				if(err){return cb(err, null, null);}
				return cb(null, results, fields);
			});
		});
	}
}
