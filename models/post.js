﻿var mongodb = require('./db'),
    ObjectID = require('mongodb').ObjectID;

function Post(name, head, title, tags, post){
    this.name = name;
	  this.head = head;
    this.title = title; 
    this.tags = tags;
    this.post = post;
}
module.exports = Post;

//存储一篇文章及相关信息
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
            + " " + date.getHours() + ":" + (date.getMinutes()<10 ? "0"
            + date.getMinutes():date.getMinutes())
    };
    
    //要存入数据库的文档
    var post = {
        name: this.name,
				head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
    };
    
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post, {
                safe: true
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
				});
        });
    });
};

//一次读取十条文章
Post.getTen = function(name, page, callback){
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
  //读取 posts 集合
   db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function(err, total){
		//query对象带有mongodb nodejs原生驱动程序理解的特殊属性名，
		//与客户端执行的原生查询密切相关
        //根据query对象查询，并跳过前(page-1)*10个结果，返回之后的5个结果
        collection.find(query, {
          skip: (page - 1)*10,  //指定返回的文档的最大数量
          limit: 10  //指定返回一个文档之前从查询结果中跳过的文档数量。
        }).sort({
          time: -1    
        }).toArray(function(err, docs){
          mongodb.close();
          if(err){
            return callback(err);
          }
          //解析markdown为html
          /*docs.forEach(function(doc){
            doc.post = markdown.toHTML(doc.post);
          });*/
          callback(null, docs, total);
        });
      });
    });
  });
};

//获取一篇文章
Post.getOne = function(_id, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用id进行查询
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                //解析markdown为html
                if(doc){
                    //每访问一次，pv值增加1
                    collection.update({
                      "_id": new ObjectID(_id)
                    }, {
                      $inc: {"pv": 1}  
                    }, function(err){
                      mongodb.close();
                      if(err){
                        return callback(err);
                      }
                    });
                    /*//解析 markdown 为 html
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });*/
                    callback(null, doc);   //返回查询的一篇文章
                }
            });
        });
    });
};

//返回原始发表的内容
Post.edit = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
             //根据用户名、发表日期及文章名进行查询
             collection.findOne({
                 "name": name,
                 "time.day": day,
                 "title": title 
             }, function(err, doc){
                  mongodb.close();
                  if(err){
                      callback(err);
                  }
                  callback(null, doc);   //返回查询的一篇文章
             });
        });
    });
};

//更新一篇文章
Post.update = function(name, day, title, post, callback){
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}  
            }, function(err){
                mongodb.close();     //未关闭数据库
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//删除一篇文章
Post.remove = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1    //写入级别，请求写确认
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//返回所有文章存档信息
Post.getArchive = function(name, month, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //返回只包含 name、time、title、pv、comments 属性的文档组成的存档数组
            collection.find({
              "time.month": month,
              "name": name
            }, {
                "name": 1,
                "time": 1,
                "title": 1,
				"pv": 1,
				"comments": 1
            }).sort({
                time: -1    
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回所有标签页
Post.getTags = function(callback){
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    db.collection('posts', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct('tags', function(err, docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback){
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    db.collection('posts', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.find({
        'tags': tag
      }, {
        'name': 1,
        'time': 1,
        'title': 1,
		'pv': 1,
		'comments': 1
      }).sort({
        time: -1    
      }).toArray(function(err, docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback){
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    db.collection('posts', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, 'i');
      collection.find({
        'title': pattern
      }, {
        'name': 1,
        'time': 1,
        'title': 1,
				'pv': 1,
				'comments': 1
      }).sort({
        time: -1    
      }).toArray(function(err, docs){
        mongodb.close();
        if(err){
          callback(err);
        }
        callback(null, docs);
      });
    });
  });
};







