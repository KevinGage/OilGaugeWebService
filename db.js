//Import modules
var config = require('./private/config.js');
var sql = require('seriate');
var bcrypt = require('bcrypt-nodejs');

//Setup SQL Server connection
var sqlConfig = {  
    "server": config.dbAddress,
    "user": config.dbUser,
    "password": config.dbPass,
    "database": config.dbName
};

sql.setDefaultConfig(sqlConfig);
