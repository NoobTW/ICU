var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pug = require('pug');
var port = process.env.PORT || 10150;
var fs = require('fs');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
//var logger = require('morgan');
//var cors = require('cors');

//var logFile = fs.createWriteStream('/var/log/express/access.log');

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
//.use(cors())
//.use(logger({stream: logFile}))

passport.use(new FacebookStrategy({
	clientID: '1800155283585541',
	clientSecret: '5f559de2468c506036c10164a0c8adff',
	callbackURL: 'http://localhost:10150/auth/facebook/callback'
}, (accessToken, refreshToken, profile, done) => {
	done();
}));

app.listen(port, () => {
	console.log("SERVER STARTED");
});

app
.get('/login', (req, res) => {
	res.render('login');
})

.get('/register', (req, res) => {
	res.render('register');
})

.get('/dashboard', (req, res) => {
	res.render('dashboard');
})

.get('/auth/facebook', (req, res) => {
	passport.authenticate('facebook', { scope: 'read_stream' });
})

.get('/auth/facebook/callback', (req, res) => {
	passport.authenticate('facebook', {
		successRedirect: '/dashboard',
		failureRedirect: '/'
	});
})

.get('/public/js/:file', (req, res) => {
	var file = req.params.file;
	var f = fs.createReadStream('public/js/' + file);
	var contentType = 'text/plain';
	if(file.endsWith('.css')) contentType = 'text/css';
	if(file.endsWith('.js')) contentType = 'application/javascript';
	res.writeHead(200, { 'Content-Type': contentType });
	f.pipe(res);
})

.get('/public/fonts/:file', (req, res) => {
	var file = req.params.file;
	var f = fs.createReadStream('public/fonts/' + file);
	var contentType = 'text/plain';
	if(file.endsWith('.css')) contentType = 'text/css';
	if(file.endsWith('.js')) contentType = 'application/javascript';
	res.writeHead(200, { 'Content-Type': contentType });
	f.pipe(res);
})

.get('/public/img/:file', (req, res) => {
	var file = req.params.file;
	var f = fs.createReadStream('public/img/' + file);
	var contentType = 'text/plain';
	if(file.endsWith('.css')) contentType = 'text/css';
	if(file.endsWith('.js')) contentType = 'application/javascript';
	res.writeHead(200, { 'Content-Type': contentType });
	f.pipe(res);
})

.get('/public/css/:file', (req, res) => {
	var file = req.params.file;
	var f = fs.createReadStream('public/css/' + file);
	var contentType = 'text/plain';
	if(file.endsWith('.css')) contentType = 'text/css';
	if(file.endsWith('.js')) contentType = 'application/javascript';
	res.writeHead(200, { 'Content-Type': contentType });
	f.pipe(res);
})