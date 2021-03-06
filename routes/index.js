﻿var crypto = require('crypto'),   
    User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');
var express = require('express');
var router = express.Router();
var multer = require('multer');

/* GET home page. */

//module.exports = router;
module.exports = function(app) {
  app.get('/', function (req, res) {    
	//判断是否是第一页，并把请求的页数转换成number类型
	var page = parseInt(req.query.p) || 1;
	//查询并返回page页的十篇文章
	Post.getTen(null, page, function(err, posts, total){
	  if(err){
		  posts = [];
	  }
	  res.render('index', { 
		title: '网站首页',
		page: page,
		isFirstPage: (page - 1) === 0,
		isLastPage: (page - 1)*10 + posts.length === total,
		user: req.session.user,
		posts: posts,
		total: total,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	  });
	}); 
});
  
  app.get('/reg', checkNotLogin, function(req, res){    //检测未登录
		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
  });
  
   
  app.post('/reg', checkNotLogin, function(req, res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		if(password !== password_re){
			req.flash('error', '两次输入的密码的不一致!');
			return res.redirect('/reg');
		}
		//生成密码的 md5 值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});
		
		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			if(user){
				req.flash('error', '用户已存在');
				return res.redirect('/reg');
			}
			//如果不存在则新增用户
			newUser.save(function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/reg');  //注册失败返回主册页
				}
				req.session.user = user;     //用户信息存入 session
				req.flash('success', '注册成功！');
				res.redirect('/');   //注册成功后返回主页
			});
		});
  });
  
  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res){
	  res.render('login', {
		  title: '登录',
		  user: req.session.user,
		  success: req.flash('success').toString(),
		  error: req.flash('error').toString()
	  });
  });
  
  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res){
	  //生成密码的md5值 
	  var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
	   //检查用户是否存在
	  User.get(req.body.name, function (err, user) {
			if (!user) {
				req.flash('error', '用户不存在!'); 
				return res.redirect('/login');
        }
	    //检查密码是否一致
			if (user.password !== password) {
				req.flash('error', '密码错误！'); 
				return res.redirect('/login');
		}
		//用户名密码都匹配后，将用户信息存入 session
			req.session.user = user;
			req.flash('success', '登录成功!');
			res.redirect('/');
	  });
  });
  
  app.get('/post', checkLogin);
  app.get('/post', function(req, res){
	  res.render('post', {
		  title: '发表',
		  user: req.session.user,
		  success: req.flash('success').toString(),
		  error: req.flash('error').toString()
   }); 
  });
  
  app.post('/post', checkLogin);
  app.post('/post', function(req, res){
	  var currentUser = req.session.user,
		  tags = [req.body.tag1, req.body.tag2, req.body.tag3],
		  post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
	  post.save(function(err){
		  if(err){
			  req.flash('error', err);
			  return res.redirect('/');
		  } 
	      req.flash('success', '发布成功！');
		  res.redirect('/');
	  });
  });
  
  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res){
	  req.session.user = null;
	  req.flash('success', '登出成功！');
	  res.redirect('/');
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res){
      res.render('upload', {
	      title: '上传文件',
	      user: req.session.user,
		  success: req.flash('success').toString(),
		  error: req.flash('error').toString()
	  });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', function(req, res){
		req.flash('success', '文件上传成功!');
		res.redirect('/upload');
  });
  
  app.get('/archive/:name/:month', function(req, res){
		Post.getArchive(req.params.name, req.params.month, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/'); 
			}
			if(req.session.user){
				res.render('archive', {
					title: '存档',
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}else{ 
				res.render('archive', {
					title: '请先登录！',
					user: req.session.user,
					posts: posts,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}
		});
  });
 
  app.get('/tags', function(req, res){
    Post.getTags(function(err, posts){
	  if(err){
	    req.flash('error', err);
		return res.redirect('/');
	  }
	  res.render('tags', {
	    title: '标签',
		posts: posts,
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	  });
	});
  });

  app.get('/tags/:tag', function(req, res){
    Post.getTag(req.params.tag, function(err, posts){
	  if(err){
	    req.flash('error', err);
		  return res.redirect('/');
	  }
	  res.render('tag', {
		title: 'TAG' + req.params.tag,
		posts: posts,
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	  });
	});
  });

  app.get('/search', function(req, res){
    Post.search(req.query.keyword, function(err, posts){
	  if(err){
	    req.flash('error', err);
		return res.redirect('/');
	  }
	  res.render('search', {
	    title: "SEARCH:" + req.query.keyword,
		user: req.body.user,
		posts: posts,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	  });
	});
  });

  app.get('/u/:name', function(req, res){
	  var page = parseInt(req.query.p) || 1; 
	  //检查用户是否存在
	  User.get(req.params.name, function(err, user){
		  if(!user){
			  req.flash('error', '用户不存在');
			  return res.redirect('/');
		  }
		  //查询并返回该用户的第page页的5篇文章
		  Post.getTen(user.name, page, function(err, posts, total){
			  if(err){
			      req.flash('error', 'err');
				  return res.redirect('/');
			  }
			  res.render('user', {
				  title: user.name + '的博客',
				  posts: posts,
				  page: page,
				  isFirstPage: (page - 1) === 0,
				  isLastPage: ((page - 1) * 5 + posts.length) === total,
				  user: req.session.user,
				  success: req.flash('success').toString(),
				  error: req.flash('error').toString()
			  });
		  });
	  });
  });

  app.get('/p/:_id', function(req, res){
	  Post.getOne(req.params._id, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
		  }
		  res.render('article', {
			  title: post.title,
			  post: post,
			  user: req.session.user,
			  success: req.flash('success').toString(),
			  error: req.flash('error').toString()
		  });
	  });
  });

  app.post('/u/:name/:day/:title', function(req, res){
    var date = new Date(),
		time = date.getFullYear() + '-' +(date.getMonth()+1) 
		  + '-' + date.getDate() + '' + date.getHours() + ':' 
		  + (date.getMinutes()<10 ? '0' + date.getMinutes() : date.getMinutes());
	var comment = {
	  name: req.body.name,
	  email: req.body.email,
	  website: req.body.website,
	  time: time,
	  content: req.body.content
	};
	var newComment = new Comment(req.params.name, req.params.day
		, req.params.title, comment);
	newComment.save(function(err){
	  if(err){
		req.flash('error', err);
		return res.redirect('back');
	  }
	  req.flash('success', '留言成功！');
	  res.redirect('back');
	});
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function(req, res){
	  var currentUser = req.session.user;
	  Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
		  if(err){
			  req.flash('error', err);
			  return res.redirect('back');
		  }
		  res.render('edit', {
			  title: '编辑',
			  post: post,
			  user: req.session.user,
			  success: req.flash('success').toString(),
			  error: req.flash('error').toString()
		  });
	  });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.update(currentUser.name, req.params.day
	  , req.params.title, req.body.post, function (err) {
    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
    if (err) {
      req.flash('error', err); 
      return res.redirect(url);//出错！返回文章页
    }
    req.flash('success', '修改成功!');
    res.redirect('/');//成功！返回文章页
  });
});

app.get('/remove/:name/:day/:title', checkLogin);
app.get('/remove/:name/:day/:title', function(req, res){
	var currentUser = req.session.user;
	Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
		if(err){
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '成功删除！');
		res.redirect('/');
	});
});

  function checkLogin(req, res, next){
	  if(!req.session.user){
		   req.flash('error', '未登录！');
		   res.redirect('/login'); 
	  }
	  next();
  }
  function checkNotLogin(req, res, next){
	  if(req.session.user){
		   req.flash('error', '已登录！');
		   res.redirect('back'); 
	  }
	  next();
  }

  var storage = multer.diskStorage({
	  destination: function (req, file, cb){
        cb(null, './public/images');
      },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
  });
  var upload = multer({
	  storage: storage
  });
};




