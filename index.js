//Import modules
var fs = require('fs');
var db = require('./db.js');
var https = require('https');
var privateKey  = fs.readFileSync('private/certificates/server.key', 'utf8');
var certificate = fs.readFileSync('private/certificates/server.crt', 'utf8');
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var connectRoles = require('connect-roles');
var app = express();
var config = require('./private/config.js');


//Setup TLS
var credentials = {key: privateKey, cert: certificate};


//Setup Passport for authentication
passport.use(new Strategy(function (username, password, cb) {
	db.users.selectUsernameAndPassword(username, password, function(err, user) {
		return cb(err, user);
	});
}));

passport.serializeUser(function(user, cb) {
	cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
	db.users.selectById(id, function (err, user) {
		if (err) { return cb(err); }
		cb(null, user);
	});
});


//Setup connect-roles for authorization
var user = new connectRoles({
	failureHandler: function (req, res, action) {
		//optional function to run custom code when user fails authorization
		var accept = req.headers.accept || '';
		res.status(403);
		res.send('Access Denied');
	}
});


//Load middleware
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: config.cookieSecret, resave: false, saveUninitialized: false }));


//Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());


//Initialize connect-roles for authoerization
app.use(user.middleware());


//Routes used for authentication
app.post('/login', passport.authenticate('local'), function(req, res) {
	res.redirect('/welcome');
});

app.get('/logout', function(req, res){
	req.logout();
	res.send('logged out');
});


//SETUP ROLES FOR AUTHORIZATION
//if user isn't logged in only give them 'view login screen' permission and don't process more rules
user.use(function (req, action) {
	if (!req.isAuthenticated()) return action === 'view login screen';
});

//if user has user role add 'read data' permissions
user.use('read data', function (req) {
	if (req.user.roleName === 'user') {
		return true;
	}
});

//if user has 'admin' role allow anything 
user.use(function (req) {
	if (req.user.roleName === 'admin') {
		return true;
	}
});


//ROUTES TO ADD OR DELETE OIL AND BATTERY DATA FROM DATABASE
//post new oil level for a device
app.post('/oilLevel', user.can('post data'), function (req, res) {
	res.send('coming soon');
});

//post a new battery reading for a device
app.post('batteryLevel', user.can('post data'), function (req, res) {
	res.send('coming soon');
});

//delete an oil level from database
app.delete('/oilLevel/:levelId', user.can('delete data'), function (req, res) {
        res.send('coming soon');
});

//delete a battery level from database
app.delete('/battery/:levelId', user.can('delete data'), function (req, res) {
        res.send('coming soon');
});


//ROUTES FOR USERS TO RETRIEVE DATA
//return most recent battery level for a device
app.get('/batteryLevel/:deviceId', user.can('read data'), function (req, res) {
	res.send('coming soon');
});

//return battery levels for a device over the last x days
app.get('/batteryLevel/:deviceId/:days', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return battery level for a device between x and y dates
app.get('/batteryLevel/:deviceId/:from-:to', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return most recent oil level for a device
app.get('/oilLevel/:deviceId', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return oil levels for a device over the last x days
app.get('/oilLevel/:deviceId/:days', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return oil level for a device between x and y dates
app.get('/oilLevel/:deviceId/:from-:to', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return most recent oil price
app.get('/oilPrice', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return oil price history over last x days
app.get('/oilPrice/:days', user.can('read data'), function (req, res) {
        res.send('coming soon');
});

//return oil price history between x and y dates
app.get('/oilPrice/:from-:to', user.can('read data'), function (req, res) {
        res.send('coming soon');
});


//ROUTES FOR MANAGE DEVICES
//return all devices for an administrator, or return owned devices for a user
app.get('/device', user.can('read devices'), function (req, res) {
        res.send('coming soon');
});

//return a device
app.get('/device/:deviceId', user.can('read devices'), function (req, res) {
        res.send('coming soon');
});

//add a new device for current user
app.post('/device', user.can('create device'), function (req, res) {
        res.send('coming soon');
});

//add a new device for a particular user
app.post('/device/:userId', user.can('manage devices'), function (req, res) {
        res.send('coming soon');
});

//update a device
app.put('/device/:deviceId', user.can('manage devices'), function (req, res) {
        res.send('coming soon');
});

//delete a device
app.delete('/device/:deviceId', user.can('manage devices'), function (req, res) {
        res.send('coming soon');
});

//ROUTES FOR MANAGING USER ACCOUNTS
//get all users
app.get('/user', user.can('manage users'), function (req, res) {
	db.users.returnAllNames(function(err, results, fields) {
		if (!err) {
			res.send(results);
		} else {i
			console.log(err);
			res.send('error retrieving users');
		}
	});
});

//get one user
app.get('/user/:userId', user.can('manage users'), function (req, res) {
	res.send('coming soon');
});

//post new user
app.post('/user', user.can('manage users'), function (req, res) {
	db.users.insertNew(req.body.username, req.body.password, req.body.role, req.body.email, function(err) {
		if(!err) {
			console.log('inserted data');
			res.send('inserted data');
		} else {
			console.log(err);
			res.send('error inserting user');
		}
	});
});

//update a user for new password or role
app.put('/user/:userId', user.can('manage users'), function (req, res) {
	res.send('coming soon');
});

//delete a user
app.delete('/user/:userId', user.can('manage users'), function (req, res) {
	res.send('coming soon');
});


//TEST ROUTES.  These are all for development testing.  They shouldn't be used in production.
app.get('/welcome', function (req, res) {
	if (!req.user) { 
		res.send('You are not logged in'); 
	} else {
		res.send('You are logged in.  Welcome ' + req.user.userName + '!');
	}
});


//Listen on https
var httpsServer = https.createServer(credentials, app);
console.log('Starting https server on port ' + 443);
httpsServer.listen(443);
