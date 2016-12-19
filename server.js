var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var pug = require('pug');
var request = require('request');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var config = require('./config');

var mongo = require('mongodb');
var mc = mongo.MongoClient;
var app = express();

const HOST_MONGO = 'mongodb://139.59.224.238:27017/test';
const port = process.env.PORT || 10150;
const FB_APP_ID = '1800155283585541';
const FB_APP_KEY = '5f559de2468c506036c10164a0c8adff';
const MIME_JSON = {'Content-Type': 'application/javascript'}

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
.use(session({
	secret: config.secret.session,
	cookie: { maxAge: 10 * 60 * 1000 },
	resave: false,
	saveUninitialized: true
}))
.use(cookieParser(config.secret.cookie))
.listen(port, () => {
	console.log('SERVER STARTED');
});


app
.get('/', (req, res) => {
	var sess = req.session;
	if(sess.email){
		console.log(sess.email);
		res.render('dashboard', {
			email: sess.email
		});
	}else{
		res.redirect('/login');
	}
})

.get('/login', (req, res) => {
	res.render('login');
})

.post('/login', (req, res) => {
	var data = req.body;
	var sess = req.session;

	if(!data.email || !data.password){
		var result = {
			result: -1
		};
		res.writeHead(401, MIME_JSON);
		res.write(JSON.stringify(result));
		res.end();
	}else{
		mc.connect(HOST_MONGO, (err, db) => {
			var collection = db.collection('user');
			collection.find({'email': data.email}).toArray((err, docs) => {
				if(!err && docs.length){
					if(docs[0].password === data.password){
						sess.email = docs[0].email;
						var result = {
							result: 0
						};
						res.writeHead(200, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}else{
						var result = {
							result: -1
						};
						res.writeHead(401, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}
				}else if(!err){
					var result = {
						result: -1
					};
					res.writeHead(401, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}else{
					var result = {
						result: -999
					};
					console.log(err);
					res.writeHead(500, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}
			});
		});
	}
})

.get('/register', (req, res) => {
	res.render('register');
})

.post('/register', (req, res) => {
	var data = req.body;

	mc.connect(HOST_MONGO, (err, db) => {
		var collection = db.collection('user');
		collection.find({'email': data.eamil}).toArray((err, docs) => {
			if(!err && docs.length){
				var result = {
					result: -2
				};
				res.writeHead(400, MIME_JSON);
				res.write(JSON.stringify(result));
				res.end();
			}else if(!err){
				collection.insert({
					email: data.email,
					password: data.password
				}, (err, resp) => {
					if(!err){
						var result = {
							result: 0
						};
						res.writeHead(200, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}else{
						var result = {
							result: -999
						};
						res.writeHead(500, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}
				})
			}else{
				var result = {
					result: -999
				};
				res.writeHead(500, MIME_JSON);
				res.write(JSON.stringify(result));
				res.end();
			}
		})
	});
})

.get('/auth/facebook', (req, res) => {
	var facebook_oauth_url = 'https://www.facebook.com/dialog/oauth?' +
		'redirect_uri=http://localhost:10150/auth/facebook/callback'+
		'&client_id=' + FB_APP_ID +
		'&scope=public_profile,email'+
		'&response_type=code';
	res.redirect(facebook_oauth_url);
})

.get('/auth/facebook/callback', (req, res) => {
var code = req.query.code;
	var token_option = {
		url:'https://graph.facebook.com/v2.8/oauth/access_token?' +
			'client_id=' + FB_APP_ID +
			'&client_secret=' + FB_APP_KEY +
			'&code=' + code +
			'&redirect_uri=' + 'http://localhost:10150/auth/facebook/callback',
		method:"GET"
	};
	request(token_option, (err, resposne, body) => {
		var access_token = JSON.parse(body).access_token;
		var info_option = {
		url:'https://graph.facebook.com/debug_token?'+
		'input_token='+access_token +
		'&access_token=' + FB_APP_ID,
		method:"GET"
		};
		request(info_option, (err, response, body) => {
			if(err){
				return res.send(err);
			}
			request({url:'https://graph.facebook.com/me?fields=name,email&access_token=' + access_token}, (err, response, body) => {
				if(err){
					return res.send(err);
				}else{
					return res.send(body);
				}
			});
		});
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