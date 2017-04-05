//Import modules
var config = require('./config.js');
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

					connection.query('INSERT INTO users (userName, userEmail, userPass, userRole) VALUES (?, ?, ?, ?)', [userName, userEmail, hash, userRole], function (err, results, fields) {
						connection.release();
						if(err){return cb(err);}
						return cb(null);
					}); 
				});
			});
		});
	},

	//Searches database for a username and password pair.  If a match is found the entire user object is returned.  Used for authentication
	selectUsernameAndPassword: function(userName, userPassword, cb) {
		if(userName === null || userPassword === null)
                {
                        return cb('username, and password cannot be null');
                }

		pool.getConnection(function(err, connection) {
			if(err){return cb(err, null);}

			connection.query('SELECT id, userName, userEmail, roleName, userPass from usersWithRoles WHERE userName = ?', [userName], function (err, results, fields) {
				connection.release();
				if(err){return cb(err, null);}

				if (results.length === 1){
					bcrypt.compare(userPassword, results[0].userPass, function(err, res) {
						if (res == true){
							results[0].userPass = null;
							cb(null, results[0]);
						} else {
							cb(null, null);
						}
					});
				} else {
					cb(null, null);
				}
			});
		});
	},

        //Searches database for a user by their id.  Used for already logged in sessions
        selectById: function(id, cb) {
                if (id === null)
                {
                        return cb('id cannot be null');
                }

                pool.getConnection(function(err, connection) {
                        if(err){return cb(err, null);}

                        connection.query('SELECT id, userName, userEmail, roleName from usersWithRoles WHERE id = ?', [id], function (err, results, fields) {
                                connection.release();
                                if(err){return cb(err, null);}

                                if (results.length === 1){
                                        cb(null, results[0]);
                                } else {
                                        return cb('id not found', null);
                                }
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
