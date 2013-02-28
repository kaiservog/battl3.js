/*******
*Author: Cesar Voginski
*
*
*Versions: 1.0-Beta
*Change log:
*---
*******/

var db = require('./db.js');
var main = require('./main.js');

exports.enter = function(req, res)
{
	if(checkLogged(req,res))
	{
		var user = req.cookies.user;
		var pass = req.cookies.pass;

		db.login
		(
			user, 
			pass, 
			function(account)
			{
				res.cookie('user', account.user);
				res.cookie('pass', account.pass);

				loadBattlesForHome(account._id, function(battles) {
					res.render('home',
					{
					  	pageTitle: 	'Battl3.js - Home',
						account: account,
						dialog: undefined,
						myBattles: battles[0],
						worldBattles: battles[1]
					});
				});
			},
			function(err)
			{
				res.clearCookie('user');
				res.clearCookie('pass');

				res.render('login',{ pageTitle: 	'Battl3.js - Login', error:'User or Password invalid .' });
			}
		);
	}
}

exports.manual = function(req, res)
{
	res.render('manual');	
}

exports.toSave = function(req, res)
{
	if(checkLogged(req,res))
	{
		var user = req.cookies.user;
		var pass = req.cookies.pass;

		var name = req.param('name');
		var str = parseInt(req.param('str'));
		var vit = parseInt(req.param('vit'));
		var wis = parseInt(req.param('wis'));
		var func = req.param('func');
		
		var accountUpdate = {teste:'test'};
		db.login(user, pass, function(account)
		{
			account.name = name;
			account.str = str;
			account.vit = vit;
			account.wis = wis;
			account.func = func;
			accountUpdate = account;

			if((str + vit + wis) > 30)
			{
					loadBattlesForHome(account._id, function(battles){
					res.render('home',
					{
					  	pageTitle: 	'Battl3.js - Home',
						account: account,
						dialog : {title : 'Status is incorrect', msg : 'The sum of the status must be 30.'},
						myBattles : battles[0],
						worldBattles : battles[1]
					});
				});
				
				return;
			}

			db.checkName(account.name, function(account){
				if(account.name == accountUpdate.name)
					account = undefined;

				if(account)
				{
					loadBattlesForHome(account._id, function(battles){
						res.render('home',
						{
						  	pageTitle: 	'Battl3.js - Home',
							account: account,
							dialog : {title : 'Name is already in use', msg : 'Choose another name pls.'},
							myBattles : battles[0],
							worldBattles : battles[1]
						});
					});
					
					return;
				}
				else
				{
					db.accountSave(accountUpdate);
					
					loadBattlesForHome(accountUpdate._id, function(battles){
						res.render('home',
						{
						  	pageTitle: 	'Battl3.js - Home',
							account: accountUpdate,
							dialog: {title : 'OK', msg: 'Your data has been saved.'},
							myBattles : battles[0],
							worldBattles : battles[1]
						});
					});
				}
			});
		});
	}
}

exports.toLogin = function(req, res)
{
	var user = req.param('user').toLowerCase();
	var pass = req.param('pass');

	db.login(user, pass, function(account)
	{
		res.cookie('user', account.user);
		res.cookie('pass', account.pass);

		loadBattlesForHome(account._id, function(battles){
			res.render('home',
			{
			  	pageTitle: 	'Battl3.js - Home',
				account: account,
				dialog: undefined,
				myBattles : battles[0],
				worldBattles : battles[1]
			});
		})
	},
	function(err)
	{
		res.clearCookie('user');
		res.clearCookie('pass');

		res.render('login',{ pageTitle: 	'Battl3.js - Login', error:'User or Password invalid .' });
	});
}

exports.toRegister = function(req, res)
{
	var user = req.param('user').toLowerCase();
	var password = req.param('password');
	var repassword = req.param('repassword');
	var email = req.param('email').toLowerCase();


	var saveOrError = function(exists)
	{
		if(exists)
		{
			res.render('register',
			{
			  	pageTitle: 	'Battl3.js - Home',
				account : account,
				dialog : {title: 'User is already in use', msg: 'This user is already in use. \n Please choose another one.'}
			});

			return;
		}

		var account = 
		{
			user: user,
			pass: password,
			email : email,
			name : '',
			str : 0,
			vit : 0,
			wis : 0,
			func : 'function action(self, enemy, msg){ return self.action.punch(); }'
		};

		db.accountSave(account);

		res.render('home',
		{
		  	pageTitle: 	'Battl3.js - Home',
			account : account,
			dialog : undefined
		});
	};

	db.checkUser(user, saveOrError);
}

exports.toLogout = function(req, res)
{
	res.clearCookie('user');
	res.clearCookie('pass');

	res.render('login',
	{
	  	pageTitle: 	'Battl3.js - Login', error:''
	});
}

exports.register = function(req, res)
{
	res.render('register',
	{
	  	pageTitle: 	'Battl3.js - Register',
		dialog: undefined
	});
}

exports.toBattl3 = function(req, res)
{

	var enemyId = req.param('enemyid');

	if(checkLogged(req,res))
	{
		var user = req.cookies.user;
		var pass = req.cookies.pass;
		
		db.login(user, pass, function(account)
		{
			self = account;
			
			db.findAccount(enemyId, function(account2)
			{
				enemy = account2;

				var players = new Array();

				players.push(self);
				players.push(enemy);

				var result = main.battl3(players);
				var battleHistory = main.getBattleHistory(self, enemy, result);
				
				db.historySave(battleHistory);
				result._id = battleHistory._id;
				
				res.render('result', { pageTitle:'Battl3.js - Result', result : result });
			},
			function(err)
			{
				console.log('Erro: '+err+'');
			});
		},
		function(err)
		{
			console.log('Erro: '+err+'');
		});
	}	
}

exports.history = function(req, res)
{
	var historyId = req.params.hist;

	db.findHistoryById(historyId, function(history){
		res.render('result', { pageTitle:'Battl3.js - History', result : history });
	});
}

exports.battl3 = function(req, res)
{
	var enemyId = req.params.e;
	if(checkLogged(req,res))
	{
		var user = req.cookies.user;
		var pass = req.cookies.pass;
		
		var self = {};
		var enemy = {};
		
		db.login(user, pass, function(account)
		{
			self = account;
			
			db.findAccount(enemyId, function(account)
			{
				enemy = account;
				res.render('battl3', {pageTitle: 'Battl3.js - '+self.name + ' vs ' + enemy.name, self : self, enemy : enemy});

			},
			function(account)
			{
			});
		},
		function(account)
		{
		});
	}
}

exports.check = function(req,res)
{
	var name = req.param('tryName').toLowerCase();
	var exists = false;

	db.checkName(name, function(account)
	{
		if(account)
			res.send('fail');
		else
			res.send('ok');
	});
}

function checkLogged(request, response)
{
	if(request.cookies == undefined || 
		request.cookies.user == undefined)
	{	
		response.render('login', 
			{
			  	pageTitle: 	'Battl3.js',error:''
			});
		return false;
	}

	return true;
}

function loadBattlesForHome(playerId, callback)
{
	var battles = new Array();
	db.loadBattles(playerId, function(myBattles, worldBattles){
		battles[0] = myBattles;
		battles[1] = worldBattles;
		
		callback(battles);
	});
}
