/*******
*Author: Cesar Voginski
*
*
*Versions: 1.0-Beta
*Change log:
*---
*******/

mongojs = undefined;
ObjectId = undefined;
db = undefined;

exports.startMongo = function()
{
	mongojs = require('mongojs');
	var databaseUrl = "localhost/battle"; // "username:password@example.com/mydb"
	var collections = ["accounts"]
	db = mongojs.connect(databaseUrl, collections);
}

exports.checkName = function(name, callback)
{
	db.accounts.findOne(
		{
			name: name
		},
		function(err, account)
		{
			callback(account);
		}
	);
}

exports.login = function(user, password, callback, callbackError)
{
	db.accounts.findOne(
		{
			user: user,
			pass: password	
		},
		function(err, account)
		{
			if(err || !account)
			{
				if(callbackError)
					callbackError(err);		
			}
			else
			{
				callback(account);
			}
		}
	);
}

exports.findAccount = function(id, callback, callbackError)
{
	var oid = db.ObjectId(id);

	db.accounts.findOne(
		{
			_id : oid
		},
		function(err, account)
		{
			if(err || !account)
			{
				if(callbackError)
					callbackError(err);		
			}
			else
			{
				callback(account);
			}
		}
	);
}

exports.accountSave = function(account)
{
	db.accounts.save(account);
}


