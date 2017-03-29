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

//Setup TLS
var credentials = {key: privateKey, cert: certificate};

//Listen on https
var httpsServer = https.createServer(credentials, app);
console.log('Starting https server on port ' + 443);
httpsServer.listen(443);
