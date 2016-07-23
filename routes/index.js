var crypto = require('crypto'),   //����ɢ��ֵ��������
    User = require('../modles/user.js'),
	Post = require('../modles/post.js');
var express = require('express');
var router = express.Router();
var multer = require('multer');

/* GET home page. */

//module.exports = router;
module.exports = function(app) {
  app.get('/', function (req, res) {
	Post.get(null, function(err, posts){
	  if(err){
		ports = [];
	  }
	  res.render('index', { 
		title: '主页',
		user: req.session.user,
		posts: posts,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	  });
	}); 
  });
  
  app.get('/reg', checkNotLogin);    //检测未登录
  app.get('/reg', function(req, res){
	res.render('reg', {
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
  });
  
  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res){
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body['password-repeat'];
	//�������������Ƿ�һ��
	if(password !== password_re){
		req.flash('error', '两次输入的密码的不一致!');
		return res.redirect('/reg');
	}
	//���������md5ֵ
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: name,
		password: password,
		email: req.body.email
	});
	
	//����û����Ƿ����
	User.get(newUser.name, function(err, user){
		if(err){
			req.flash('error', err);
			return res.redirect('/');
		}
		if(user){
			req.flash('error', '用户不存在');
			return res.redirect('/');
		}
		//��������ڣ�������û�
		newUser.save(function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/reg');  //ע��ʧ�ܷ�����ҳ
			}
			req.session.user = user;     //�û���Ϣ����session
			req.flash('success', '注册成功！');
			res.redirect('/');   // ע��ɹ�������ҳ
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
	  //��������� md5 ֵ
	  var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');
	   //����û��Ƿ����
	  User.get(req.body.name, function (err, user) {
        if (!user) {
          req.flash('error', '用户不存在!'); 
          return res.redirect('/login');//�û�����������ת����¼ҳ
        }
	    //��������Ƿ�һ��
        if (user.password !== password) {
          req.flash('error', '密码错误！'); 
          return res.redirect('/login');//�����������ת����¼ҳ
		}
		//�û������붼ƥ��󣬽��û���Ϣ���� session
        req.session.user = user;
        req.flash('success', '登录成功!');
        res.redirect('/');//��½�ɹ�����ת����ҳ
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
		  post = new Post(currentUser.name, req.body.title, req.body.post);
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
	  //ͨ���� req.session.user ��ֵ null ���� session ���û�����Ϣ��ʵ���û����˳���
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
        cb(null, './public/images')
      },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
  });
  var upload = multer({
	  storage: storage
  });
};




