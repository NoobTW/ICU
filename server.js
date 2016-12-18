var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pug = require('pug');
var port = process.env.PORT || 10150;
var fs = require('fs');
var request = require('request');
//var logger = require('morgan');
//var cors = require('cors');

//var logFile = fs.createWriteStream('/var/log/express/access.log');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://139.59.224.238:27017/test';

// Use connect method to connect to the server

function insertUser(email, password) {

	MongoClient.connect(url, function(err, db) {

		assert.equal(null, err);
		console.log("Connected successfully to server");
		var collection = db.collection('restaurants');
		// Find some documents
		collection.insertMany([
			{'email' : email, 'password' : password}
		], function(err, result) {
			assert.equal(err, null);
			assert.equal(1, result.result.n);
			assert.equal(1, result.ops.length);
			console.log("Inserted 1 documents into the collection");
		});

	});
}

function loginCheck(email, password, callback) {
	MongoClient.connect(url, function(err, db) {
		var collection = db.collection('restaurants');
		collection.find({'email': email}).toArray(function(err, docs) {
			if (password === docs[0].password) {
				callback(true);
			}else{
				callback(false);
			}
		}); 
	});
}

function checkRepeatEmailByEmail(email, callback){
	MongoClient.connect(url, function(err, db) {
		var collection = db.collection('restaurants');
		collection.find({'email': email}).toArray(function(err, docs) {
			if (docs.length == 1) {
				callback(true);
			}else{
				callback(false);
			}
		}); 
	});
}


app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
//.use(cors())
//.use(logger({stream: logFile}))

app.listen(port, () => {
	console.log("SERVER STARTED");
});

app
.get('/login', (req, res) => {
	res.render('login');
})

.post('/checkLogin', (req, res) => {
	var email = req.body.email;
	var password = req.body.password;
	loginCheck(email, password, function(result){
		if( result == true) {
			res.redirect('/dashboard');
			res.end();
		}else{
			res.redirect('/login');
			res.end();
		}
	});
	
})

.get('/register', (req, res) => {
	res.render('register');
})

.post('/insertUser', (req, res) => {
	var email = req.body.email;
	var password = req.body.password;
	var passwordCheck = req.body.passwordCheck;
    if (password !== passwordCheck) {
    	res.redirect('/register');
    	res.end();
    }

    checkRepeatEmailByEmail(email, function(result) {
    	if (result == true) {
    		res.redirect(302, '/register');
    		res.end();
    	}else{
    		insertUser(email, password);
    		res.redirect('/login');
    		res.end();
    	}
    });

    
})

.get('/dashboard', (req, res) => {
	res.render('dashboard');
})

.get('/auth/facebook', (req, res) => {
	var facebook_oauth_url = 'https://www.facebook.com/dialog/oauth?' +
		'redirect_uri=http://localhost:10150/auth/facebook/callback'+
		'&client_id=1800155283585541' +
		'&scope=public_profile'+
		'&response_type=code';
	res.redirect(facebook_oauth_url);
	//return res.send(JSON.stringify({'redirect_url':facebook_oauth_url}));
})

.get('/auth/facebook/callback', (req, res) => {
var code = req.query.code;
	var token_option = {
		url:'https://graph.facebook.com/v2.3/oauth/access_token?' +
			'client_id=1800155283585541' +
			'&client_secret=5f559de2468c506036c10164a0c8adff' +
			'&code=' + code +
			'&redirect_uri=' + 'http://localhost:10150/auth/facebook/callback',
		method:"GET"
	};
	request(token_option, (err, resposne, body) => {
		var access_token = JSON.parse(body).access_token;
		var info_option = {
		url:'https://graph.facebook.com/debug_token?'+
		'input_token='+access_token +
		'&access_token=1800155283585541',
		method:"GET"
		};
		request(info_option, (err, response, body) => {
			if(err){
				return res.send(err);
			}

			request({url:'https://graph.facebook.com/me?access_token=' + access_token}, (err, response, body) => {
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