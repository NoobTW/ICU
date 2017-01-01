var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
//var pug = require('pug');
var request = require('request');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var config = require('./config');
var sha256 = require('js-sha256');
var url = require('url');

var mongo = require('mongodb');
var mc = mongo.MongoClient;
var app = express();

const HOST_MONGO = 'mongodb://139.59.224.238:27017/test';
const port = process.env.PORT || 10150;
const PORT_ICU_CLIENT = 10854;
const FB_APP_ID = '1800155283585541';
const FB_APP_KEY = '5f559de2468c506036c10164a0c8adff';
const MIME_JSON = {'Content-Type': 'application/json'};

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
.use(session({
	secret: config.secret.session,
	cookie: { maxAge: 100 * 60 * 1000 },
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
		res.render('dashboard', {
			email: sess.email
		});
	}else{
		res.redirect('/login');
	}
})

.get('/login', (req, res) => {
	var sess = req.session;

	res.render('login', {
		success: sess.success
	});
	sess.destroy(function() {
		sess.email = sess.email;
	});
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
				var result = {};
				if(!err && docs.length){
					if(docs[0].password === data.password){
						sess.email = docs[0].email;
						result = {
							result: 0
						};
						res.writeHead(200, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}else{
						result = {
							result: -1
						};
						res.writeHead(401, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}
				}else if(!err){
					result = {
						result: -1
					};
					res.writeHead(401, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}else{
					result = {
						result: -999
					};
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
	var result = {};
	var sess = req.session;
	mc.connect(HOST_MONGO, (err, db) => {
		var collection = db.collection('user');
		collection.find({'email': data.email}).toArray((err, docs) => {
			if(!err && docs.length !== 0){
				result = {
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
					if(!err && resp){
						sess.success = true;
						result = {
							result: 0
						};
						res.writeHead(200, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}else{
						result = {
							result: -999
						};
						res.writeHead(500, MIME_JSON);
						res.write(JSON.stringify(result));
						res.end();
					}
				});
			}else{
				result = {
					result: -999
				};
				res.writeHead(500, MIME_JSON);
				res.write(JSON.stringify(result));
				res.end();
			}
		});
	});
})

.post('/logout', (req, res) => {
	req.session.destroy();
	var result = {
		result: 0
	};
	res.writeHead(200, MIME_JSON);
	res.write(JSON.stringify(result));
	res.end();
})

.get('/machineInfo', (req, res) =>{
	var data = req.query;
	var sess = req.session;
	if(sess.email){
		res.render('machineInfo', {
			email: sess.email,
			ip: data.ip,
			name: data.name
		});
	}else{
		res.redirect('/login');
	}
})

.get('/machine', (req, res) => {
	var data = req.query;
	var sess = req.session;
	let result = {};

	if(sess.email){
		if(data.ip){
			request.get('http://' + data.ip + ':' + PORT_ICU_CLIENT + '/status', {
				timeout: 5000
			}, (err, resp, body) => {
				if(!err && resp){
					res.writeHead(200, MIME_JSON);
					body = JSON.parse(body);
					result = body;
					result.result = 0;
					res.write(JSON.stringify(result));
					res.end();
				}else{
					result = {
						result: -3
					};
					res.writeHead(400, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}
			});
		}else{
			result = {
				result: -1
			};
			res.writeHead(400, MIME_JSON);
			res.write(JSON.stringify(result));
			res.end();
		}
	}else{
		result = {
			result: -998
		};
		res.writeHead(401, MIME_JSON);
		res.write(JSON.stringify(result));
		res.end();
	}
})

.post('/machine', (req, res) => {
	var data = req.body;
	var sess = req.session;
	let result = {};

	if(sess.email){
		if(data.ip && data.name){
			request.get('http://' + data.ip + ':' + PORT_ICU_CLIENT + '/status', {
				timeout: 5000
			}, (err, resp, body) => {
				if(!err && resp && body){
					mc.connect(HOST_MONGO, (err, db) => {
						var collection = db.collection('machine');
						collection.find({'ip': data.ip}).toArray((err, docs) => {
							if(!err && docs.length){
								result = {
									result: -2
								};
								res.writeHead(400, MIME_JSON);
								res.write(JSON.stringify(result));
								res.end();
							}else if(!err){
								collection.insert({
									ip: data.ip,
									name: data.name,
									owner: sess.email
								}, (err, resp) => {
									if(!err && resp){
										result = {
											result: 0
										};
										res.writeHead(200, MIME_JSON);
										res.write(JSON.stringify(result));
										res.end();
									}else{
										result = {
											result: -999
										};
										res.writeHead(500, MIME_JSON);
										res.write(JSON.stringify(result));
										res.end();
									}
								});
							}else{
								result = {
									result: -999
								};
								res.writeHead(500, MIME_JSON);
								res.write(JSON.stringify(result));
								res.end();
							}
						});
					});
				}else{
					result = {
						result: -3
					};
					res.writeHead(400, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}
			});
		}else{
			result = {
				result: -1
			};
			res.writeHead(400, MIME_JSON);
			res.write(JSON.stringify(result));
			res.end();
		}
	}else{
		result = {
			result: -998
		};
		res.writeHead(401, MIME_JSON);
		res.write(JSON.stringify(result));
		res.end();
	}
})

.get('/machines', (req, res) => {
	//var data = req.query;
	var sess = req.session;

	if(sess.email){
		mc.connect(HOST_MONGO, (err, db) => {
			var collection = db.collection('machine');
			collection.find({owner: sess.email}).toArray((err, docs) => {
				var result = {};
				if(!err && docs.length){
					result = {
						result: 0,
						machines: docs
					};
					res.writeHead(200, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}else if(!err){
					result = {
						result: -1
					};
					res.writeHead(400, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}else{
					result = {
						result: -999
					};
					res.writeHead(500, MIME_JSON);
					res.write(JSON.stringify(result));
					res.end();
				}
			});
		});
	}else{
		var result = {
			result: -998
		};
		res.writeHead(401, MIME_JSON);
		res.write(JSON.stringify(result));
		res.end();
	}
})

.get('/alarms', (req, res) => {
	var sess = req.session;

	if(sess.email){
		res.render('alarms');
	}else{
		res.redirect('/login');
	}
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
	var sess = req.session;
	var code = req.query.code;
	var token_option = {
		url:'https://graph.facebook.com/v2.8/oauth/access_token?' +
			'client_id=' + FB_APP_ID +
			'&client_secret=' + FB_APP_KEY +
			'&code=' + code +
			'&redirect_uri=' + 'http://localhost:10150/auth/facebook/callback',
		method:'GET'
	};
	request(token_option, (err, resposne, body) => {
		var access_token = JSON.parse(body).access_token;
		var info_option = {
			url:'https://graph.facebook.com/debug_token?'+
		'input_token='+access_token +
		'&access_token=' + FB_APP_ID,
			method:'GET'
		};
		request(info_option, (err, response, body) => {
			if(!err && body){
				request({url:'https://graph.facebook.com/me?fields=name,email&access_token=' + access_token}, (err, response, body) => {
					if(!err){
						var data = JSON.parse(body);
						mc.connect(HOST_MONGO, (err, db) => {
							if(!err && db){
								var collection = db.collection('user');
								collection.find({'email': data.email}).toArray((err, docs) => {
									if(!err && docs.length){
										sess.email = data.email;
										res.redirect('/');
										res.end();
									}else if(!err){
										collection.insert({
											email: data.email,
											password: data.password
										}, (err, resp) => {
											if(!err && resp){
												sess.email = data.email;
												res.redirect('/');
												res.end();
											}else{
												res.write('error');
												res.redirect('/login');
												res.end();
											}
										});
									}else{
										res.write('error');
										res.redirect('/login');
										res.end();
									}
								});
							}else{
								res.send('err');
								res.redirect('/login');
								res.end();
							}
						});
					}else{
						res.send('err');
						res.redirect('/login');
						res.end();
					}
					// if(err){
					// 	return res.send(err);
					// }else{
					// 	return res.send(body);
					// }
				});
			}else{
				return res.send(err);
			}
		});
	});
})

.get('/public/js/:file', (req, res) => {
	var file = req.params.file;
	fs.stat('public/js/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/js/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end();
		}
	});
})

.get('/public/fonts/:file', (req, res) => {
	var file = req.params.file;
	fs.stat('public/fonts/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/fonts/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end();
		}
	});
})

.get('/public/img/:file', (req, res) => {
	var file = req.params.file;
	var file = req.params.file;
	fs.stat('public/img/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/img/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end();
		}
	});
})

.get('/public/css/:file', (req, res) => {
	var file = req.params.file;
	var file = req.params.file;
	fs.stat('public/css/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/css/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end();
		}
	});
})

.get('/public/video/:file', (req, res) => {
	var file = req.params.file;
	var file = req.params.file;
	fs.stat('public/video/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/video/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end();
		}
	});
});