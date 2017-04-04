//Import modules
var fs = require('fs');
var db = require('./db.js');
var https = require('https');
var privateKey  = fs.readFileSync('private/certificates/server.key', 'utf8');
var certificate = fs.readFileSync('private/certificates/server.crt', 'utf8');
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
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

//Load middleware
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: config.cookieSecret, resave: false, saveUninitialized: false }));

//Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//Routes used for authentication
app.post('/login', passport.authenticate('local'), function(req, res) {
	res.redirect('/welcome');
});

app.get('/logout', function(req, res){
	req.logout();
	res.send('logged out');
});

//TEST ROUTES.  These are all for development testing.  They shouldn't be used in production.
app.post('/user', function (req, res) {
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

app.get('/returnAllNames', function (req, res) {
  db.users.returnAllNames(function(err, results, fields) {
    if(!err) {
      console.log(results);
      res.send(results);
    } else {
        console.log(err);
	res.send('error retrieving users');
    }
  });
});

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
