﻿var mongodb = require('./db'),
    crypto = require('crypto');  //生成散列值来加密密码

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

//存储用户信息
User.prototype.save = function(callback){
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
	//要存入数据库的用户文档
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,   //需要把 email 转化成小写再编码。
		head: head
	};
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
	
		//读取users集合
		db.collection('users', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//将用户数据插入users集合
			collection.insert(user, {
				safe: true
			},function(err, user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, user[0]);
			});
		});
	});
};

//读取用户信息
User.get = function(name, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取users集合
		db.collection('users', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查找用户名值为name一个文档
			collection.findOne({
				name: name
			}, function(err, user){
				mongodb.close();
				if(err){
					return callback(user);
				}
				callback(null, user);
			});
		});
	});
};














