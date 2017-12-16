var mongodb = require('./db');
//引入markdown
var markdown = require('markdown').markdown

function Post(name,title,content,tags) {
    this.name = name;
    this.title = title;
    this.content = content;
    this.tags = tags;
}
// function Post(name) {
//     this.name = name.name;
//     this.title = name.title;
//     this.content = name.content;
// }
//格式化时间的函数
function formaDate(num) {
    return  num < 10 ? '0' + num : num;
}
Post.prototype.save = function (callback) {
    //1.格式化时间
    var data = new Date();
    var now = data.getFullYear() + '-' + formaDate(data.getMonth() + 1) + '-' + formaDate(data.getDate()) + ' ' + formaDate(data.getHours()) + ':' + formaDate(data.getMinutes()) + ':' + formaDate(data.getSeconds());

    //2.收集数据
    var newContent = {
        name:this.name,
        title:this.title,
        content:this.content,
        time:now,
        //添加一个留言字段
        comments:[],
        //添加一个标签的字段
        tags:this.tags,
        pv:0
    }

    //3.打开数据库
    //4.读取posts集合
    //5.将数据库插入到集合中吗，并且跳转到首页
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(newContent,function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
Post.getTen = function (name,page,callback) {
    mongodb.open(function(err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {}
            if(name){
                query.name = name;
            }
            collection.count(query,function (err,total) {
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                collection.find(query,{
                    skip:(page - 1)*10,
                    limit:10
                }).sort({time:-1}).toArray(function (err,docs) {
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    //将每篇文章在读取的时候以markdown的格式进行解析
                    docs.forEach(function (doc) {
                        doc.content = markdown.toHTML(doc.content);
                    })
                    return callback(null,docs,total);
                })
            })
        })
    })
}
//获取一篇文章
Post.getOne = function (name,title,time,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name:name,
                title:title,
                time:time
            },function (err,doc) {
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                if(doc){
                    //将文章的浏览量加1
                    collection.update({
                        name:name,
                        title:title,
                        time:time
                    },{
                        $inc:{pv:1}
                    },function (err) {
                        mongodb.close();
                    })
                    //markdown解析文章的内容
                    doc.content = markdown.toHTML(doc.content);
                    //留言的内容也要通过markdown来进行解析
                    doc.comments.forEach(function (comment) {
                        comment.c_content = markdown.toHTML(comment.c_content)
                    })
                }
                return callback(null,doc);
            })
        })
    })
}
//编辑
Post.edit = function (name,title,time,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name:name,
                title:title,
                time:time
            },function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
Post.update = function (name,title,time,content,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                name:name,
                title:title,
                time:time
            },{$set:{content:content}},function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc)
            })
        })
    })
}
//删除
Post.remove = function (name,title,time,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                name:name,
                title:title,
                time:time,
            },{
                w:1
            },function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null)
            })
        })
    })
}
//存档
Post.getArchive = function (callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({},{
                name:1,
                title:1,
                time:1
            }).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,docs);
            })
        })
    })
}
//取出所有的标签
Post.getTags = function (callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct是将某个字段中的数据进行去重处理
            //将结果以数组的形式返回
            collection.distinct('tags',function (err,docs) {
                mongodb.close();
                if (err){
                    return callback(err);
                }
                return callback(null,docs)
            })
        })
    })
}
//获取标所对应的文章列表
Post.getTag = function (tag,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({
                tags:tag
            },{
                name:1,
                title:1,
                time:1
            }).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,docs);
            })
        })
    })
}
//搜索
Post.search = function (keyword,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var newRegex = new RegExp(keyword,"i");
            collection.find({
                title:newRegex
            },{
                name:1,
                title:1,
                time:1
            }).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,docs);
            })
        })
    })
}
module.exports = Post;