//Import modules
var fs = require('fs');
var db = require('./db.js');
var https = require('https');
var privateKey  = fs.readFileSync('private/certificates/server.key', 'utf8');
var certificate = fs.readFileSync('private/certificates/server.crt', 'utf8');
var express = require('express');
var passport = require('passport');
var strategy = require('passport-local').Strategy;
var app = express();
var config = require('./private/config.js');

//Setup TLS
var credentials = {key: privateKey, cert: certificate};

//Load middleware
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: config.cookieSecret, resave: false, saveUninitialized: false }));

//TEST ROUTES
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


//Listen on https
var httpsServer = https.createServer(credentials, app);
console.log('Starting https server on port ' + 443);
httpsServer.listen(443);
